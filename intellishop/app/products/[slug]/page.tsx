import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Star } from "lucide-react";
import ProductActions from "@/components/ProductActions";
import type { Product } from "@/app/api/products/[slug]/route";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getProduct(slug: string): Promise<Product | null> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/products/${slug}`, {
    // Don't cache product pages — swap to { next: { revalidate: 60 } } when using Supabase
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);

  return res.json() as Promise<Product>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found — IntelliShop" };
  }

  return {
    title: `${product.name} — IntelliShop`,
    description: product.description,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`full-${i}`} size={16} className="fill-accent text-accent" />
        ))}
        {partial > 0 && (
          <span className="relative inline-block" style={{ width: 16, height: 16 }}>
            <Star size={16} className="text-border fill-border" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${partial * 100}%` }}
            >
              <Star size={16} className="fill-accent text-accent" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`empty-${i}`} size={16} className="fill-border text-border" />
        ))}
      </div>
      <span className="text-sm text-muted">
        {rating.toFixed(1)} ({count.toLocaleString()} reviews)
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-background">
      {/* ── Breadcrumb / back nav ── */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="
              inline-flex items-center gap-1.5
              text-sm text-muted
              transition-colors duration-150 hover:text-foreground
            "
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to Products
          </Link>
        </div>
      </div>

      {/* ── Product layout ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: product image ── */}
          <div className="flex flex-col gap-4">
            <div
              className="
                relative aspect-square w-full overflow-hidden
                rounded-3xl border border-border bg-surface
                shadow-sm
              "
            >
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Out-of-stock overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/60 backdrop-blur-sm">
                  <span className="rounded-full bg-surface px-5 py-2 text-sm font-semibold text-error shadow">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: product details ── */}
          <div className="flex flex-col gap-6 lg:pt-2">
            {/* Category badge */}
            <span
              className="
                w-fit rounded-full border border-accent/30
                bg-accent/10 px-3 py-1
                text-xs font-semibold uppercase tracking-widest text-accent
              "
            >
              {product.category}
            </span>

            {/* Name */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <StarRating rating={product.rating} count={product.reviewCount} />

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.inStock ? (
                <span className="text-sm font-medium text-success">In Stock</span>
              ) : (
                <span className="text-sm font-medium text-error">Out of Stock</span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                Description
              </h2>
              <p className="text-base leading-relaxed text-secondary">
                {product.description}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Qty + Add to Cart — client island */}
            {product.inStock ? (
              <ProductActions productName={product.name} />
            ) : (
              <button
                disabled
                className="
                  flex w-full items-center justify-center rounded-2xl
                  bg-muted/30 px-8 py-4
                  text-base font-semibold text-muted
                  cursor-not-allowed
                "
              >
                Currently Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
