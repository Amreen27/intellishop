import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Data layer — all filtering is pushed to Supabase (no JS post-processing).
// To revert to the in-memory array, swap only this function body.
// ---------------------------------------------------------------------------

async function fetchProducts(
  search: string,
  category: string
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("id, name, description, price, image_url, category, slug");

  // Case-insensitive substring match on the name column
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Exact category match (Supabase is case-sensitive by default — the
  // category values in the DB should match the casing used in the UI)
  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as Product[];
}

// ---------------------------------------------------------------------------
// Route handler — unchanged from the in-memory version
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";

    const products = await fetchProducts(search, category);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("[/api/products] Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
