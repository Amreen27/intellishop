/**
 * app/api/create-razorpay-order/route.ts
 *
 * POST /api/create-razorpay-order
 *
 * Request body:
 *   { order_id: string }   ← our Supabase order UUID
 *
 * Steps:
 *   1. Validate the request body.
 *   2. Fetch the order's total_amount from Supabase.
 *   3. Create a Razorpay Order for that amount (converted to paise).
 *   4. Persist the Razorpay order id back onto the Supabase order row.
 *   5. Return { razorpay_order_id, amount } to the frontend.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

// ── Supabase (server-side — uses service-role key when available) ──────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase env vars are not set. " +
        "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

// ── Response helpers ──────────────────────────────────────────────────────────
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

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await req.json().catch(() => null);
    if (!body) return fail("Request body must be valid JSON.");

    const { order_id } = body as { order_id?: unknown };

    if (!order_id || typeof order_id !== "string") {
      return fail("Missing or invalid field: order_id (string required).");
    }

    const supabase = getClient();

    // 2. Fetch total_amount from Supabase
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, total_amount, status")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      return fail("Order not found.", 404, fetchError ?? undefined);
    }

    if (typeof order.total_amount !== "number" || order.total_amount <= 0) {
      return fail("Order has an invalid total_amount.", 422);
    }

    // 3. Create a Razorpay Order (amount must be in paise — smallest INR unit)
    const amountInPaise = Math.round(order.total_amount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: "INR",
      receipt:  order_id, // use our internal order id as the receipt reference
      notes: {
        supabase_order_id: order_id,
      },
    });

    const razorpayOrderId = razorpayOrder.id;

    // 4. Persist the Razorpay order id onto the Supabase order row
    const { error: updateError } = await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrderId })
      .eq("id", order_id);

    if (updateError) {
      // Non-fatal but worth logging — the order was created in Razorpay's system.
      // We still return the id so the frontend can proceed.
      console.error(
        `[create-razorpay-order] Failed to persist razorpay_order_id for order ${order_id}:`,
        updateError
      );
    }

    // 5. Return the Razorpay order id and amount to the frontend
    return ok({
      razorpay_order_id: razorpayOrderId,
      amount:            amountInPaise,
    });
  } catch (err) {
    console.error("[create-razorpay-order] Unexpected error:", err);
    return fail("Internal server error.", 500, String(err));
  }
}
