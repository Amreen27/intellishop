"use client";

/**
 * app/products/[slug]/page.tsx
 *
 * Product detail page. Fetches product data by slug (mocked here until
 * a products API is wired up). Allows the signed-in user to add the item
 * to their cart. Prompts sign-in if the user is not authenticated.
 */

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Star, ChevronLeft, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Mock product data (replace with a real fetch once the products API is ready)
// ─────────────────────────────────────────────────────────────────────────────

function getMockProduct(slug: string) {
  return {
    id:          slug,                        // use slug as product_id for now
    name:        slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    price:       49.99,
    rating:      4.5,
    reviewCount: 128,
    description:
      "A premium product crafted with quality materials. " +
      "Designed for modern lifestyles and built to last.",
    image:       `https://picsum.photos/seed/${slug}/600/600`,
    category:    "Electronics",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const product   = getMockProduct(slug);

  const { user }    = useAuth();
  const { addToCart, openCart } = useCart();

  const [qty,        setQty]        = useState(1);
  const [adding,     setAdding]     = useState(false);
  const [feedback,   setFeedback]   = useState<"success" | "error" | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      setShowSignIn(true);
      return;
    }

    setAdding(true);
    setFeedback(null);

    try {
      await addToCart(product.id, qty, {
        name:  product.name,
        price: product.price,
        image: product.image,
      });
      setFeedback("success");
      openCart();
    } catch {
      setFeedback("error");
    } finally {
      setAdding(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* ── Product Image ─────────────────────────────────────── */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-border/20 shadow-sm">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* ── Product Info ──────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Category badge */}
            <span className="w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              {product.category}
            </span>

            {/* Name */}
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-border text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="text-4xl font-bold text-accent">
              ${product.price.toFixed(2)}
            </div>

            {/* Description */}
            <p className="leading-relaxed text-secondary">
              {product.description}
            </p>

            {/* Quantity selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Qty:</span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                <button
                  id="qty-decrease"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-foreground"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  id="qty-increase"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-foreground"
                >
                  +
                </button>
              </div>
            </div>

            {/* ── Sign-in prompt ──────────────────────────────────── */}
            {showSignIn && (
              <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <LogIn className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Sign in to add items to your cart
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Create a free account or sign in to start shopping.
                  </p>
                  <Link
                    href="/auth/signin"
                    className="mt-2 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* Add to Cart button */}
            <button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {adding ? "Adding…" : "Add to Cart"}
            </button>

            {/* Feedback messages */}
            {feedback === "success" && (
              <p className="text-sm font-medium text-success">
                ✓ Added to your cart!
              </p>
            )}
            {feedback === "error" && (
              <p className="text-sm font-medium text-error">
                ✗ Something went wrong. Please try again.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
