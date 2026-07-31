import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FEATURED_PRODUCTS = [
  {
    slug: "wireless-noise-cancelling-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    price: 7999,
    image: "https://picsum.photos/seed/headphones/400/400",
    rating: 5,
    reviewCount: 214,
    badge: "Best Seller",
  },
  {
    slug: "ultra-slim-laptop-15",
    name: "Ultra Slim Laptop 15\" — 16GB RAM, 512GB SSD",
    price: 64999,
    image: "https://picsum.photos/seed/laptop15/400/400",
    rating: 4,
    reviewCount: 98,
  },
  {
    slug: "smart-fitness-watch",
    name: "Smart Fitness Watch with Heart-Rate Monitor",
    price: 4499,
    image: "https://picsum.photos/seed/fitwatch/400/400",
    rating: 4,
    reviewCount: 531,
    badge: "New",
  },
  {
    slug: "mechanical-keyboard-rgb",
    name: "Mechanical Gaming Keyboard — RGB Backlit",
    price: 3299,
    image: "https://picsum.photos/seed/keyboard/400/400",
    rating: 5,
    reviewCount: 173,
  },
  {
    slug: "portable-bluetooth-speaker",
    name: "Portable Bluetooth Speaker — 360° Sound",
    price: 2199,
    image: "https://picsum.photos/seed/speaker/400/400",
    rating: 4,
    reviewCount: 89,
    badge: "Sale",
  },
  {
    slug: "ergonomic-office-chair",
    name: "Ergonomic Mesh Office Chair with Lumbar Support",
    price: 12999,
    image: "https://picsum.photos/seed/officechair/400/400",
    rating: 5,
    reviewCount: 42,
  },
  {
    slug: "4k-usb-c-monitor",
    name: '27" 4K USB-C Monitor — 144Hz Display',
    price: 34999,
    image: "https://picsum.photos/seed/monitor4k/400/400",
    rating: 4,
    reviewCount: 67,
    badge: "New",
  },
  {
    slug: "stainless-steel-water-bottle",
    name: "Insulated Stainless Steel Water Bottle — 1L",
    price: 899,
    image: "https://picsum.photos/seed/waterbottle/400/400",
    rating: 4,
    reviewCount: 312,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero section */}
      <Hero />

      {/* Featured Products section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-2">
              Hand-picked for you
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-3 transition-all duration-200 shrink-0"
          >
            View all products
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Responsive product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.slug} {...product} />
          ))}
        </div>
      </section>

      {/* Value proposition strip */}
      <section className="bg-surface border-y border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-extrabold text-accent">10K+</span>
              <span className="text-sm text-secondary font-medium">Happy Customers</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-extrabold text-accent">500+</span>
              <span className="text-sm text-secondary font-medium">Products Available</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-extrabold text-accent">4.9</span>
              <span className="text-sm text-secondary font-medium">Average Rating</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
