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
// PATCH /api/admin/products/[id]
// Updates an existing product row by id.
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return fail("Missing product ID path parameter.");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON payload in request body.");

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name?.trim();
    if (body.description !== undefined) updates.description = body.description?.trim();
    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return fail("Field 'price' must be a positive number.");
      }
      updates.price = body.price;
    }
    if (body.image_url !== undefined) updates.image_url = body.image_url?.trim();
    if (body.category !== undefined) updates.category = body.category?.trim();
    if (body.stock !== undefined) {
      if (typeof body.stock !== "number" || body.stock < 0) {
        return fail("Field 'stock' must be a positive integer.");
      }
      updates.stock = body.stock;
    }
    if (body.slug !== undefined) updates.slug = body.slug?.trim().toLowerCase();

    if (Object.keys(updates).length === 0) {
      return fail("No updates provided in the request body.");
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return fail("A product with this URL slug already exists. Slugs must be unique.", 409);
      }
      return fail(error.message, 500, error);
    }
    if (!data) return fail("Product not found.", 404);

    return ok(data);
  } catch (err) {
    return fail(String(err), 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/products/[id]
// Deletes a product row by id.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return fail("Missing product ID path parameter.");

    const supabase = getClient();
    const { error, count } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) return fail(error.message, 500, error);
    if (count === 0) return fail("Product not found.", 404);

    return ok({ id, deleted: true });
  } catch (err) {
    return fail(String(err), 500);
  }
}
