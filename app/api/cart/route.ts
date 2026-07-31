import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Supabase client
// lib/supabase.ts is intentionally left as a stub for now; we instantiate the
// client here directly.  Replace the env-var names if your project uses
// different ones.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are not set. " +
        "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to your .env.local file."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details !== undefined && { details }) },
    { status }
  );
}

// ---------------------------------------------------------------------------
// GET /api/cart?user_id=<uuid>
// Returns all cart_items rows that belong to the given user.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");

  if (!user_id) {
    return fail("Missing required query param: user_id", 400);
  }

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        products (
          name,
          price,
          image_url
        )
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (error) return fail(error.message, 500, error);

    // Format output to match client requirements
    const enrichedData = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      name: row.products?.name ?? "Unknown Product",
      price: Number(row.products?.price ?? 0),
      image_url: row.products?.image_url ?? ""
    }));

    return ok(enrichedData);
  } catch (err) {
    return fail(String(err), 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/cart
// Body: { user_id: string; product_id: string; quantity: number }
// Inserts a new cart_items row and returns the created record.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, product_id, quantity } = body ?? {};

    if (!user_id) return fail("Missing field: user_id");
    if (!product_id) return fail("Missing field: product_id");
    if (typeof quantity !== "number" || quantity < 1) {
      return fail("Field 'quantity' must be a positive integer");
    }

    const supabase = getClient();

    const { data, error } = await supabase
      .from("cart_items")
      .insert({ user_id, product_id, quantity })
      .select()
      .single();

    if (error) return fail(error.message, 500, error);

    return ok(data, 201);
  } catch (err) {
    return fail(String(err), 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/cart
// Body: { id: string; quantity: number }
// Updates the quantity of an existing cart_items row.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, quantity } = body ?? {};

    if (!id) return fail("Missing field: id");
    if (typeof quantity !== "number" || quantity < 1) {
      return fail("Field 'quantity' must be a positive integer");
    }

    const supabase = getClient();

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .select()
      .single();

    if (error) return fail(error.message, 500, error);
    if (!data) return fail("Cart item not found", 404);

    return ok(data);
  } catch (err) {
    return fail(String(err), 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/cart
// Body: { id: string }
// Removes a cart_items row by its primary key.
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body ?? {};

    if (!id) return fail("Missing field: id");

    const supabase = getClient();

    const { error, count } = await supabase
      .from("cart_items")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) return fail(error.message, 500, error);
    if (count === 0) return fail("Cart item not found", 404);

    return ok({ id, deleted: true });
  } catch (err) {
    return fail(String(err), 500);
  }
}
