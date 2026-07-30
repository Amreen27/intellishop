import { NextRequest, NextResponse } from "next/server";

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
// Data layer — swap this function body for a Supabase query when ready.
// The route handler below must NOT be changed; only this function changes.
// ---------------------------------------------------------------------------

async function fetchProducts(): Promise<Product[]> {
  // TODO: Replace with:
  //   const { data, error } = await supabase.from("products").select("*");
  //   if (error) throw error;
  //   return data as Product[];
  return [
    {
      id: 1,
      name: "Wireless Noise-Cancelling Headphones",
      description:
        "Premium over-ear headphones with 40-hour battery life, adaptive noise cancellation, and crystal-clear audio.",
      price: 299.99,
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      category: "Electronics",
      slug: "wireless-noise-cancelling-headphones",
    },
    {
      id: 2,
      name: "Mechanical Gaming Keyboard",
      description:
        "Compact tenkeyless layout with tactile Cherry MX switches, per-key RGB lighting, and a detachable USB-C cable.",
      price: 149.99,
      image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
      category: "Electronics",
      slug: "mechanical-gaming-keyboard",
    },
    {
      id: 3,
      name: "Minimalist Leather Wallet",
      description:
        "Slim bifold wallet crafted from full-grain Italian leather. Holds up to 8 cards with an RFID-blocking lining.",
      price: 59.99,
      image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600",
      category: "Accessories",
      slug: "minimalist-leather-wallet",
    },
    {
      id: 4,
      name: "Stainless Steel Water Bottle",
      description:
        "Triple-insulated 1 L bottle that keeps drinks cold for 24 hours or hot for 12. Scratch-resistant matte finish.",
      price: 44.99,
      image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
      category: "Home & Kitchen",
      slug: "stainless-steel-water-bottle",
    },
    {
      id: 5,
      name: "Ergonomic Office Chair",
      description:
        "Fully adjustable mesh chair with lumbar support, 4D armrests, and breathable backrest — built for all-day comfort.",
      price: 489.0,
      image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
      category: "Furniture",
      slug: "ergonomic-office-chair",
    },
    {
      id: 6,
      name: "Portable Bluetooth Speaker",
      description:
        "360° surround sound, IP67 waterproof rating, 20-hour playback, and a compact design that fits in a cup holder.",
      price: 89.99,
      image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
      category: "Electronics",
      slug: "portable-bluetooth-speaker",
    },
    {
      id: 7,
      name: "Merino Wool Running Socks",
      description:
        "Arch-support socks made from 80% merino wool. Moisture-wicking, blister-resistant, and available in a 3-pack.",
      price: 34.99,
      image_url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
      category: "Apparel",
      slug: "merino-wool-running-socks",
    },
    {
      id: 8,
      name: "Ceramic Pour-Over Coffee Set",
      description:
        "Handcrafted ceramic dripper with a matching server and a stainless-steel gooseneck kettle for the perfect brew.",
      price: 79.99,
      image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
      category: "Home & Kitchen",
      slug: "ceramic-pour-over-coffee-set",
    },
  ];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const category = searchParams.get("category")?.trim().toLowerCase() ?? "";

    let products = await fetchProducts();

    if (search) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(search)
      );
    }

    if (category) {
      products = products.filter(
        (p) => p.category.toLowerCase() === category
      );
    }

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("[/api/products] Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
