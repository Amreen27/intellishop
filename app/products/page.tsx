"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, PackageSearch, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/app/api/products/route";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "All",
  "Electronics",
  "Accessories",
  "Home & Kitchen",
  "Furniture",
  "Apparel",
];

// ---------------------------------------------------------------------------
// Skeleton card — mirrors ProductCard layout while loading
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface animate-pulse">
      <div className="aspect-square w-full bg-border" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-border" />
        <div className="h-4 w-1/2 rounded-full bg-border" />
        <div className="mt-auto h-10 w-full rounded-full bg-border" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search value by 350 ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products.");
      const data: { products: Product[] } = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (value: string) => {
    // "All" → clear category filter (empty string means no filter in the API)
    setCategory(value === "All" ? "" : value);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Our Products
          </h1>
          <p className="mt-2 text-sm text-muted">
            Browse our full catalogue and find exactly what you&apos;re looking for.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Search & Filter controls                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted outline-none ring-0 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4 flex-shrink-0 text-muted"
              aria-hidden="true"
            />
            <select
              id="product-category"
              value={category === "" ? "All" : category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Filter by category"
              className="cursor-pointer appearance-none rounded-xl border border-border bg-surface py-2.5 pl-3 pr-8 text-sm text-foreground outline-none ring-0 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {/* Custom caret */}
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Products grid                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-sm font-medium text-error">{error}</p>
            <button
              onClick={fetchProducts}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <PackageSearch className="h-12 w-12 text-muted" />
            <div>
              <p className="text-base font-semibold text-foreground">
                No products found
              </p>
              <p className="mt-1 text-sm text-muted">
                Try adjusting your search or category filter.
              </p>
            </div>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-5 text-sm text-muted">
              {products.length}{" "}
              {products.length === 1 ? "product" : "products"} found
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.image_url}
                  name={product.name}
                  price={product.price}
                  slug={product.slug}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
