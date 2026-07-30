import Image from "next/image";
import { Palette } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      {/* ── Temporary design-system demo block ── */}
      <div className="w-full max-w-md mx-auto my-8 rounded-2xl border border-border bg-surface shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="text-accent" size={24} />
          <span className="text-sm font-semibold text-muted uppercase tracking-widest">
            Design System Demo
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-primary flex items-center justify-center py-4">
            <span className="text-primary-foreground text-sm font-medium">
              bg-primary
            </span>
          </div>
          <div className="flex-1 rounded-lg bg-secondary flex items-center justify-center py-4">
            <span className="text-secondary-foreground text-sm font-medium">
              bg-secondary
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-accent flex items-center justify-center py-4">
            <span className="text-white text-sm font-medium">bg-accent</span>
          </div>
          <div className="flex-1 rounded-lg bg-surface border border-border flex items-center justify-center py-4">
            <span className="text-error text-sm font-medium">text-error</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-surface border border-border flex items-center justify-center py-4">
            <span className="text-success text-sm font-medium">text-success</span>
          </div>
          <div className="flex-1 rounded-lg bg-muted/20 border border-border flex items-center justify-center py-4">
            <span className="text-muted text-sm font-medium">text-muted</span>
          </div>
        </div>
      </div>
      {/* ── End demo block ── */}

      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-surface sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-secondary">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-foreground"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-foreground"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-colors hover:opacity-90 md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-border px-5 transition-colors hover:bg-border md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
