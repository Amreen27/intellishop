"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-gradient-to-br from-primary via-secondary to-primary
        min-h-[88vh] flex items-center justify-center
        px-6 py-24
      "
    >
      {/* Subtle radial glow overlay — uses only theme accent color via CSS var */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          [background:radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_srgb,var(--color-accent)_25%,transparent),transparent)]
        "
      />

      {/* Decorative blurred blob — accent, top-right */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -top-32 -right-32
          h-96 w-96 rounded-full
          bg-accent/20 blur-3xl
        "
      />

      {/* Decorative blurred blob — secondary, bottom-left */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-24 -left-24
          h-72 w-72 rounded-full
          bg-secondary/30 blur-2xl
        "
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Eyebrow badge */}
        <span
          className="
            inline-flex items-center gap-2
            rounded-full border border-accent/40
            bg-accent/10 px-4 py-1.5
            text-xs font-semibold uppercase tracking-widest
            text-accent
            mb-8 backdrop-blur-sm
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Smart Shopping, Reimagined
        </span>

        {/* Headline */}
        <h1
          className="
            text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight
            text-primary-foreground
            mb-6
          "
        >
          Discover Products{" "}
          <span
            className="
              relative inline-block
              text-transparent bg-clip-text
              bg-gradient-to-r from-accent to-[color-mix(in_srgb,var(--color-accent)_60%,white)]
            "
          >
            You'll Love
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="
            text-lg sm:text-xl leading-relaxed
            text-primary-foreground/70
            max-w-2xl mx-auto mb-10
          "
        >
          IntelliShop curates thousands of top-rated products tailored to your
          taste — browse, compare, and check out in seconds.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary CTA — accent color from theme */}
          <Link
            href="/products"
            className="
              group relative inline-flex items-center gap-2
              rounded-2xl bg-accent px-8 py-4
              text-base font-semibold text-primary-foreground
              shadow-lg shadow-accent/30
              transition-all duration-200
              hover:brightness-110 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              active:translate-y-0
            "
          >
            Shop Now
            {/* Arrow icon — pure SVG, no external dep */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {/* Ghost / secondary CTA */}
          <Link
            href="/products"
            className="
              inline-flex items-center gap-2
              rounded-2xl border border-primary-foreground/25 px-8 py-4
              text-base font-semibold text-primary-foreground/80
              backdrop-blur-sm
              transition-all duration-200
              hover:border-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/5 hover:-translate-y-0.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground
              active:translate-y-0
            "
          >
            Browse Catalogue
          </Link>
        </div>

        {/* Social proof micro-line */}
        <p className="mt-10 text-sm text-primary-foreground/50 tracking-wide">
          Trusted by{" "}
          <span className="font-semibold text-primary-foreground/70">
            50,000+
          </span>{" "}
          shoppers worldwide
        </p>
      </div>
    </section>
  );
}
