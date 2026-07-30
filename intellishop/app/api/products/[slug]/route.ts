import { NextRequest, NextResponse } from "next/server";

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
// In-memory product list
// TODO: replace `PRODUCTS` with a Supabase query inside `getProductBySlug`.
//
// This is a local copy of the same 8 placeholder products used in
// app/api/products/route.ts. Do NOT import from that file — it keeps this
// route self-contained and ready for independent data-source migration.
// ---------------------------------------------------------------------------

const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "wireless-noise-cancelling-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.",
    price: 29999,
    category: "Electronics",
    imageUrl: "/images/products/headphones.jpg",
    rating: 4.7,
    reviewCount: 1284,
    inStock: true,
  },
  {
    id: "2",
    slug: "minimalist-leather-wallet",
    name: "Minimalist Leather Wallet",
    description:
      "Slim bifold wallet crafted from full-grain leather with RFID blocking and room for up to 8 cards.",
    price: 4999,
    category: "Accessories",
    imageUrl: "/images/products/wallet.jpg",
    rating: 4.5,
    reviewCount: 632,
    inStock: true,
  },
  {
    id: "3",
    slug: "stainless-steel-water-bottle",
    name: "Stainless Steel Water Bottle",
    description:
      "Double-walled, vacuum-insulated 32 oz bottle that keeps drinks cold 24 hours and hot 12 hours.",
    price: 3499,
    category: "Kitchen",
    imageUrl: "/images/products/water-bottle.jpg",
    rating: 4.8,
    reviewCount: 2103,
    inStock: true,
  },
  {
    id: "4",
    slug: "mechanical-keyboard-tkl",
    name: "Mechanical Keyboard TKL",
    description:
      "Tenkeyless mechanical keyboard with Cherry MX Red switches, per-key RGB lighting, and aluminium frame.",
    price: 13999,
    category: "Electronics",
    imageUrl: "/images/products/keyboard.jpg",
    rating: 4.6,
    reviewCount: 887,
    inStock: true,
  },
  {
    id: "5",
    slug: "yoga-mat-pro",
    name: "Yoga Mat Pro",
    description:
      "Non-slip, eco-friendly TPE yoga mat (6mm thick) with alignment lines and carrying strap.",
    price: 5999,
    category: "Sports",
    imageUrl: "/images/products/yoga-mat.jpg",
    rating: 4.4,
    reviewCount: 519,
    inStock: true,
  },
  {
    id: "6",
    slug: "scented-soy-candle-set",
    name: "Scented Soy Candle Set",
    description:
      "Set of 3 hand-poured soy candles in amber glass jars — lavender, cedar & vanilla, and eucalyptus.",
    price: 3999,
    category: "Home",
    imageUrl: "/images/products/candles.jpg",
    rating: 4.9,
    reviewCount: 341,
    inStock: false,
  },
  {
    id: "7",
    slug: "running-shoes-ultralight",
    name: "Running Shoes Ultralight",
    description:
      "Breathable mesh upper, cushioned EVA midsole, and carbon-fibre plate for responsive long-distance running.",
    price: 17999,
    category: "Sports",
    imageUrl: "/images/products/running-shoes.jpg",
    rating: 4.5,
    reviewCount: 763,
    inStock: true,
  },
  {
    id: "8",
    slug: "pour-over-coffee-kit",
    name: "Pour-Over Coffee Kit",
    description:
      "Complete pour-over set: borosilicate glass dripper, gooseneck kettle, burr grinder, and 50 paper filters.",
    price: 8999,
    category: "Kitchen",
    imageUrl: "/images/products/coffee-kit.jpg",
    rating: 4.7,
    reviewCount: 428,
    inStock: true,
  },
];

// ---------------------------------------------------------------------------
// Data-fetching layer (swap this function for a Supabase call)
// ---------------------------------------------------------------------------

/**
 * Look up a single product by its URL slug.
 *
 * To migrate to Supabase, replace the body with:
 *   const { data } = await supabase
 *     .from("products")
 *     .select("*")
 *     .eq("slug", slug)
 *     .single();
 *   return data ?? null;
 */
async function getProductBySlug(slug: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
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
