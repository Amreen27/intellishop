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
// PATCH /api/admin/orders/[id]
// Updates an order's status (e.g. pending, paid, shipped, delivered, failed).
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return fail("Missing order ID path parameter.");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON payload in request body.");

    const { status } = body;
    if (!status?.trim()) return fail("Field 'status' is required.");

    const allowedStatuses = ["pending", "paid", "shipped", "delivered", "failed", "refunded"];
    if (!allowedStatuses.includes(status.trim().toLowerCase())) {
      return fail(`Invalid status. Allowed values: ${allowedStatuses.join(", ")}`);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: status.trim().toLowerCase() })
      .eq("id", id)
      .select()
      .single();

    if (error) return fail(error.message, 500, error);
    if (!data) return fail("Order not found.", 404);

    return ok(data);
  } catch (err) {
    return fail(String(err), 500);
  }
}
