import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;          // in USD cents (e.g. 4999 = $49.99)
  category: string;
  imageUrl: string;
  rating: number;         // 0–5
  reviewCount: number;
  inStock: boolean;
}

// ---------------------------------------------------------------------------
// Data-fetching layer
// ---------------------------------------------------------------------------

/**
 * Look up a single product by its URL slug via Supabase.
 * Returns null when no row matches (PGRST116 = "no rows" error from .single()).
 */
async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  // PGRST116 means no rows matched — treat as not found, not a server error.
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
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json(
      { error: "Product not found", slug },
      { status: 404 },
    );
  }

  return NextResponse.json(product);
}
