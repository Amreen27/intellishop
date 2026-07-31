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
// GET /api/admin/products
// Returns all products from the products table.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return fail(error.message, 500, error);
    return ok(data);
  } catch (err) {
    return fail(String(err), 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/products
// Creates a new product row.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON payload in request body.");

    const { name, description, price, image_url, category, stock, slug } = body;

    // Simple validations
    if (!name?.trim()) return fail("Field 'name' is required.");
    if (typeof price !== "number" || price < 0) {
      return fail("Field 'price' must be a positive number.");
    }
    if (typeof stock !== "number" || stock < 0) {
      return fail("Field 'stock' must be a positive integer.");
    }
    if (!slug?.trim()) return fail("Field 'slug' is required.");

    const supabase = getClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        description: description?.trim() ?? "",
        price,
        image_url: image_url?.trim() ?? "",
        category: category?.trim() ?? "",
        stock,
        slug: slug.trim().toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      // Check for unique key violation (slug unique check)
      if (error.code === "23505") {
        return fail("A product with this URL slug already exists. Slugs must be unique.", 409);
      }
      return fail(error.message, 500, error);
    }

    return ok(data, 201);
  } catch (err) {
    return fail(String(err), 500);
  }
}
