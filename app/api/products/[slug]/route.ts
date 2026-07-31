import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseKey);
}

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
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, description, price, category, image_url, stock")
    .eq("slug", slug)
    .single();

  // PGRST116 means no rows matched — treat as not found, not a server error.
  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  if (!data) return null;

  // Map DB snake_case columns → camelCase Product shape
  return {
    id:          data.id,
    slug:        data.slug,
    name:        data.name,
    description: data.description,
    price:       Number(data.price),
    category:    data.category,
    imageUrl:    data.image_url ?? "",
    inStock:     (data.stock ?? 0) > 0,
    // rating & reviewCount are not in the DB yet — use sensible defaults
    rating:      4.5,
    reviewCount: 128,
  };
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
