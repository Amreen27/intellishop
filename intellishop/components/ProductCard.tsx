
import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  slug: string;
}

export default function ProductCard({
  image,
  name,
  price,
  slug,
}: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-white/[.1] dark:bg-zinc-900">
      {/* Product image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product name */}
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {name}
        </h2>

        {/* Price */}
        <p className="text-lg font-bold text-foreground">
          ${price.toFixed(2)}
        </p>

        {/* View Product button — primary theme (bg-foreground / text-background) */}
        <Link
          href={`/products/${slug}`}
          className="mt-auto flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors duration-200 hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
