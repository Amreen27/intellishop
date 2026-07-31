import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";

export interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  slug: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
}

export default function ProductCard({
  image,
  name,
  price,
  slug,
  rating = 4.5,
  reviewCount = 0,
  badge,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

  const stars = Math.round(rating);

  return (
    <article className="group relative flex flex-col bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* Badge */}
      {badge && (
        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-accent text-primary-foreground text-xs font-semibold">
          {badge}
        </span>
      )}

      {/* Product image */}
      <Link href={`/products/${slug}`} className="block overflow-hidden aspect-square bg-background">
        <Image
          src={image}
          alt={name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < stars ? "text-accent fill-accent" : "text-border fill-border"}
                />
              ))}
            </div>
            <span className="text-xs text-muted">({reviewCount})</span>
          </div>
        )}

        {/* Name */}
        <Link href={`/products/${slug}`}>
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 hover:text-accent transition-colors duration-200">
            {name}
          </h3>
        </Link>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">{formattedPrice}</span>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-accent transition-colors duration-200 active:scale-95"
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart size={14} />
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
