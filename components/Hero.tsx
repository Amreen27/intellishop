import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";

const TRUST_BADGES = [
  { icon: Truck, label: "Free shipping over ₹999" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: RefreshCw, label: "30-day returns" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
        style={{ background: "var(--color-accent)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10"
        style={{ background: "var(--color-accent)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
        {/* Eyebrow label */}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold tracking-widest uppercase mb-6">
          New season arrivals
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight max-w-2xl">
          Shop Smarter.{" "}
          <span className="text-accent">Live Better.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg text-muted max-w-xl leading-relaxed">
          Discover curated products across electronics, fashion, and home —
          delivered fast, priced fairly, and backed by our happiness guarantee.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-accent text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-200"
          >
            Shop Now
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-muted text-muted font-semibold text-sm hover:border-primary-foreground hover:text-primary-foreground transition-all duration-200"
          >
            Browse All Products
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-col sm:flex-row gap-6 sm:gap-10">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted">
              <Icon size={16} className="text-accent shrink-0" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
