import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The subset of order columns returned by this endpoint.
 * Only `id` and `status` are exposed — no sensitive payment details.
 */
export interface OrderStatus {
  id: string;
  status: string; // e.g. "pending" | "paid" | "failed" | "refunded"
}

// ---------------------------------------------------------------------------
// Data-fetching layer
// ---------------------------------------------------------------------------

/**
 * Fetch the status of a single order from the `orders` table.
 *
 * Returns `null` when no row matches the given id (PGRST116 = "no rows"
 * from `.single()`). Any other Supabase error is re-thrown so Next.js
 * can surface a 500.
 */
async function getOrderStatus(id: string): Promise<OrderStatus | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .single();

  // PGRST116 = no rows matched — not a server error, just not found.
  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data ?? null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const order = await getOrderStatus(id);

  if (!order) {
    return NextResponse.json(
      { error: "Order not found", id },
      { status: 404 },
    );
  }

  return NextResponse.json(order);
}
