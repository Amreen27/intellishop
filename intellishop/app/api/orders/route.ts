import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Supabase client
// lib/supabase.ts is intentionally left as a stub; the client is instantiated
// here directly, consistent with app/api/cart/route.ts.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are not set. " +
        "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "(or NEXT_PUBLIC_SUPABASE_ANON_KEY) to your .env.local file."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

// ---------------------------------------------------------------------------
// Response helpers (same shape as cart route)
// ---------------------------------------------------------------------------
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== undefined && { details }),
    },
    { status }
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItemInput {
  product_id: string;
  quantity:   number;
  price:      number; // unit price at time of checkout
  name?:      string; // stored for receipt / order history display
}

interface ShippingDetails {
  full_name:    string;
  address_line1: string;
  address_line2?: string;
  city:         string;
  state?:       string;
  postal_code:  string;
  country:      string;
  phone?:       string;
}

// ---------------------------------------------------------------------------
// POST /api/orders
//
// Request body:
// {
//   user_id:          string;
//   items:            CartItemInput[];
//   shipping_details: ShippingDetails;
// }
//
// Steps:
//   1. Validate inputs.
//   2. Compute total_amount = Σ(price × quantity).
//   3. INSERT into `orders` → get new order id.
//   4. INSERT into `order_items` (one row per cart item).
//   5. DELETE the user's `cart_items` rows.
//   6. Return { order_id }.
//
// All three DB operations are done sequentially; if step 3 or 4 fails the
// order is not committed (step 5 is not reached). A Supabase transaction /
// stored procedure would be cleaner for full atomicity, but this matches the
// current project's client-side Supabase pattern.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse & validate body ──────────────────────────────────────────

    const body = await req.json().catch(() => null);
    if (!body) return fail("Request body must be valid JSON.");

    const { user_id, items, shipping_details } = body as {
      user_id?:          unknown;
      items?:            unknown;
      shipping_details?: unknown;
    };

    if (!user_id || typeof user_id !== "string") {
      return fail("Missing or invalid field: user_id (string required).");
    }

    if (!Array.isArray(items) || items.length === 0) {
      return fail("Field 'items' must be a non-empty array of cart items.");
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Partial<CartItemInput>;
      if (!item.product_id || typeof item.product_id !== "string") {
        return fail(`items[${i}].product_id is required and must be a string.`);
      }
      if (typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return fail(`items[${i}].quantity must be a positive integer.`);
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return fail(`items[${i}].price must be a non-negative number.`);
      }
    }

    // Validate shipping
    if (!shipping_details || typeof shipping_details !== "object") {
      return fail("Field 'shipping_details' is required.");
    }
    const sd = shipping_details as Partial<ShippingDetails>;
    const requiredShippingFields: (keyof ShippingDetails)[] = [
      "full_name",
      "address_line1",
      "city",
      "postal_code",
      "country",
    ];
    for (const field of requiredShippingFields) {
      if (!sd[field] || typeof sd[field] !== "string") {
        return fail(`shipping_details.${field} is required.`);
      }
    }

    // ── 2. Compute total ──────────────────────────────────────────────────

    const total_amount = (items as CartItemInput[]).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const supabase = getClient();

    // ── 3. Insert order ───────────────────────────────────────────────────

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        status:           "pending",
        total_amount:     Math.round(total_amount * 100) / 100, // 2 dp
        // Shipping fields — store as individual columns; the table may also
        // accept a shipping_details JSONB column depending on the schema.
        shipping_full_name:    sd.full_name,
        shipping_address_line1: sd.address_line1,
        shipping_address_line2: sd.address_line2 ?? null,
        shipping_city:         sd.city,
        shipping_state:        sd.state ?? null,
        shipping_postal_code:  sd.postal_code,
        shipping_country:      sd.country,
        shipping_phone:        sd.phone ?? null,
      })
      .select("id")
      .single();

    if (orderError) {
      return fail("Failed to create order.", 500, orderError);
    }

    const orderId: string = order.id;

    // ── 4. Insert order_items ─────────────────────────────────────────────

    const orderItemRows = (items as CartItemInput[]).map((item) => ({
      order_id:   orderId,
      product_id: item.product_id,
      quantity:   item.quantity,
      unit_price: item.price,
      // total_price per line for convenience
      total_price: Math.round(item.price * item.quantity * 100) / 100,
      ...(item.name ? { name: item.name } : {}),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemRows);

    if (itemsError) {
      // The order row was created but items failed.
      // Mark the order as "failed" so it doesn't appear as a live pending order.
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);

      return fail("Order created but failed to insert order items.", 500, itemsError);
    }

    // ── 5. Clear the user's cart ──────────────────────────────────────────

    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user_id);

    // A cart-clear failure is non-fatal — the order is confirmed.
    // Log it server-side but don't surface it to the client.
    if (clearError) {
      console.error(
        `[orders] Cart clear failed for user ${user_id} after order ${orderId}:`,
        clearError
      );
    }

    // ── 6. Return the new order id ────────────────────────────────────────

    return ok({ order_id: orderId }, 201);
  } catch (err) {
    return fail(String(err), 500);
  }
}
