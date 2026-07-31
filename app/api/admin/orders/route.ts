import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseKey);
}

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details !== undefined && { details }) },
    { status }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/orders
// Returns all orders joined with their order_items.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) return fail(error.message, 500, error);
    return ok(data);
  } catch (err) {
    return fail(String(err), 500);
  }
}
