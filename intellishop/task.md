# CodeToCommerce — Full App Prompts by Team Member
### Backend work distributed across all 5 — only secrets stay locked to the Leader

Backend work is spread across all 5 members — **every member builds at least one real API route** that talks to the database. The only thing that stays exclusively with L is anything touching a **secret key** (`RAZORPAY_KEY_SECRET`, Supabase service-role key) — that's a security boundary, not a workload one, so it doesn't move.

**Roles:**

| Role | Frontend | Backend (API routes / server logic) |
|---|---|---|
| **L** | Homepage assembly | Design system setup, Firebase + Supabase project setup, Razorpay order-creation route, Razorpay signature-verification route (both touch secrets), deploy |
| **M2** | Navbar, sign-in button, listing page | `app/api/products/route.ts` (GET, search + category filter, real Supabase data) |
| **M3** | Hero, detail page | `app/api/products/[slug]/route.ts` (GET single product by slug, real Supabase data) |
| **M4** | ProductCard, CartDrawer | `app/api/cart/route.ts` (GET/POST/PATCH/DELETE cart items, tied to Firebase uid) |
| **M5** | Footer, checkout page, Razorpay popup UI | `app/api/orders/route.ts` (POST — create order + order_items), `app/api/order-status/[id]/route.ts` (GET — poll order status for retry) |

Every API route above uses the **public/anon** Supabase key only — none of them touch the service-role key or Razorpay secret, so this distribution doesn't create any new security risk. Only L's two Razorpay routes touch `RAZORPAY_KEY_SECRET`.

---

## Git Workflow (same as before)

1. `git checkout main && git pull`
2. `git checkout -b <yourname>-<task>`
3. Paste your prompt, review, test locally.
4. `git add -A && git commit -m "..."`, `git push origin <yourname>-<task>`
5. Open a PR. L reviews and merges.
6. Sync again before your next task.

---

## Task Flow

| # | Owner | Task | Needs merged first |
|---|---|---|---|
| T1 | L | Project setup + folder structure + design system + GitHub push | — |
| T2 | M2 | Navbar | T1 |
| T3 | M3 | Hero | T1 |
| T4 | M4 | ProductCard | T1 |
| T5 | M5 | Footer | T1 |
| T6 | L | Homepage assembly | T2, T3, T4, T5 |
| T7 | M2 | Products API route (placeholder data) + listing page | T4 |
| T8 | M3 | Product detail API route (placeholder data) + detail page | T4 |
| T9 | L | Metadata & SEO | T7, T8 |
| T10 | L | Firebase + Supabase project setup + schema | T6 |
| T11 | M2 | Sign-in wiring + products API route now queries real Supabase data | T10 |
| T12 | M3 | Product detail API route now queries real Supabase data | T10 |
| T13 | M4 | Cart API route + CartContext + CartDrawer | T11, T12 |
| T14 | M5 | Orders API route + checkout page | T13 |
| T15 | L | Razorpay backend (order + verify routes — secrets) | T14 |
| T16 | M5 | Razorpay popup + order-status API route + payment UI states | T15 |
| T17 | Whole team | Test a real payment + debug | T16 |
| T18 | L → M2/M3/M4/M5 | Full audit + split fixes | T17 |
| T19 | L | Production build check + deploy | T18 |
| T20 | Whole team | Live retest | T19 |

---

## T1 — L: Project setup, folder structure, design system, GitHub push

**Manual:**
```
npx create-next-app@latest your-app-name
```
Accept defaults; **Yes** to TypeScript and Tailwind CSS. `cd your-app-name`, open in Antigravity IDE.

**Prompt — folder structure:**
```
This project was just created with npx create-next-app (App Router, TypeScript,
Tailwind CSS already configured — do not reconfigure or re-scaffold any of that).
Set up this exact folder and file structure, creating empty placeholder files
where noted:

app/
  layout.tsx (already exists, keep it)
  page.tsx (homepage — already exists, keep it)
  globals.css (already exists, keep it)
  products/page.tsx
  products/[slug]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  order-confirmation/[id]/page.tsx
  api/products/route.ts
  api/products/[slug]/route.ts
  api/cart/route.ts
  api/orders/route.ts
  api/order-status/[id]/route.ts
  api/create-razorpay-order/route.ts
  api/verify-razorpay-payment/route.ts
components/
  Navbar.tsx
  Hero.tsx
  ProductCard.tsx
  Footer.tsx
  CartDrawer.tsx
contexts/
  CartContext.tsx
lib/
  firebase.ts
  supabase.ts
  razorpay.ts
.env.local.example

Don't build functionality yet — just create the files/folders to match this
structure exactly. Then start the dev server to confirm the default homepage
still loads.
```

**Prompt — design system:**
```
Set up a project-wide design system every future prompt must follow:
1) In app/globals.css, define CSS custom properties under :root: --color-primary,
--color-primary-foreground, --color-secondary, --color-secondary-foreground,
--color-accent, --color-background, --color-foreground, --color-surface,
--color-muted, --color-border, --color-success, --color-error. Pick a clean,
modern palette with real hex values — this is the only place colors are hardcoded.
2) In tailwind.config.ts, extend theme.colors so classes like bg-primary,
text-secondary, border-border, bg-surface, text-error map to those variables.
Every component built from now on must use these theme classes, never a raw hex
code or arbitrary color like bg-blue-500.
3) Install lucide-react. Every icon must be a lucide-react icon component.
Never use an emoji anywhere in the UI, placeholder text, or code comments.
4) Treat every screen as mobile-first: design for small screens first, then
scale up with sm:/md:/lg: breakpoints.

Add a small temporary demo block on the homepage showing the primary/secondary
colors and one icon so I can confirm it's working, then remove it once confirmed.
```

**Prompt — GitHub:**
```
Initialize a git repository, create a .gitignore for a Node.js/Next.js project
(excluding node_modules, .env*, .next), and make an initial commit: "Initial
commit: project setup, folder structure, and design system". Give me the exact
terminal commands to connect this to a GitHub repository at [paste your repo
URL] and push it to main.
```
→ Push to `main`, tell the team it's ready to clone.

---

## T2 — M2: Navbar

**Prompt:**
```
Build components/Navbar.tsx only. Do not create or edit any other file.
Follow the design system in app/globals.css and tailwind.config.ts (theme
color classes, lucide-react icons only, no emoji, mobile-first).

Requirements: a sticky navbar with the store name/logo on the left, nav links
(Home, Products) centered, and a cart icon (lucide-react ShoppingCart) with a
small item-count badge on the right. Collapse into a hamburger menu below the
md breakpoint. Export Navbar as the default export. Use placeholder values
for now (item count = 0, no real links wired up yet).
```

## T3 — M3: Hero

**Prompt:**
```
Build components/Hero.tsx only. Do not create or edit any other file.
Follow the design system in app/globals.css and tailwind.config.ts.

A bold headline, short subtext, a call-to-action button in the primary theme
color, and a background built from theme colors (gradient or solid, never a
random hardcoded color). Export Hero as the default export.
```

## T4 — M4: ProductCard

**Prompt:**
```
Build components/ProductCard.tsx only. Do not create or edit any other file.
Follow the design system in app/globals.css and tailwind.config.ts.

Accept props: image, name, price, slug. Show the image, name, price, and a
"View Product" button (primary theme color) linking to /products/[slug].
Export ProductCard as the default export, with TypeScript props typed
explicitly.
```

## T5 — M5: Footer

**Prompt:**
```
Build components/Footer.tsx only. Do not create or edit any other file.
Follow the design system in app/globals.css and tailwind.config.ts.

Show the store name and a copyright line, using theme colors. Export Footer
as the default export.
```

---

## T6 — L: Homepage assembly

**Prompt:**
```
In app/page.tsx, build the homepage using the already-built components/Navbar.tsx,
components/Hero.tsx, components/ProductCard.tsx, and components/Footer.tsx
(do not modify those files). Add a "Featured Products" section using
ProductCard in a responsive grid (1 column mobile, up to 4 desktop) with 6-8
placeholder products (image, name, price, slug). Navbar on top, Footer at
the bottom.
```

---

## T7 — M2: Products API route + listing page

**Prompt 1 — API route (placeholder data for now):**
```
Build app/api/products/route.ts as a GET endpoint. For now, return an
in-memory array of 8 realistic placeholder products (id, name, description,
price, image_url, category, slug) as JSON. Support optional ?search= and
?category= query params that filter the returned array by name and category.
This will be updated later to read from Supabase instead of the in-memory
array — structure the code so that swap is easy (keep the data-fetching in
one clearly separated function).
```

**Prompt 2 — Listing page consuming it:**
```
Build app/products/page.tsx to display all products in a responsive grid,
reusing components/ProductCard.tsx (do not modify ProductCard.tsx). Fetch
data from app/api/products/route.ts (already built — do not modify that
file). Add a search bar at the top (lucide-react search icon) and a category
filter dropdown, both passed as query params to the API route. Follow the
design system rules.
```

## T8 — M3: Product detail API route + detail page

**Prompt 1 — API route (placeholder data for now):**
```
Build app/api/products/[slug]/route.ts as a GET endpoint. For now, look up
the product by slug from an in-memory array of the same 8 placeholder
products used in app/api/products/route.ts (do not modify that file — define
your own local copy of the same product list here for now). Return 404 JSON
if not found. Structure the data-fetching in one clearly separated function
so it's easy to swap for a real Supabase query later.
```

**Prompt 2 — Detail page consuming it:**
```
Build the dynamic product detail page at app/products/[slug]/page.tsx,
fetching from app/api/products/[slug]/route.ts (already built — do not
modify that file). Show a large product image, name, price, description, a
quantity selector (+/- icon buttons), and an "Add to Cart" button in the
primary theme color (doesn't need to do anything yet). Follow the design
system rules. Make sure "View Product" on any ProductCard navigates here
correctly.
```

## T9 — L: Metadata & SEO

**Prompt:**
```
Set up metadata for the whole app:
1) In app/layout.tsx, export a metadata object with a title template
("%s | [your store name]"), a default title, a short description, and the
existing favicon.
2) Add Open Graph and Twitter card metadata.
3) In app/products/page.tsx, export metadata with title "Shop All Products".
4) In app/products/[slug]/page.tsx, use generateMetadata to set the page
title to the product's name dynamically (fetch from the existing API route).
```

---

## T10 — L: Firebase + Supabase project setup

**Manual:** Create the Firebase project (Build → Authentication → Sign-in method → enable Google), and the Supabase project. Copy all config values.

**Prompt — Firebase:**
```
Set up Firebase in lib/firebase.ts and add Google Sign-In helper functions
(signInWithGoogle, signOutUser, an onAuthStateChanged listener/hook). Read
config from NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID — do
not hardcode any keys. Create .env.local.example listing these variable
names with empty values. Do not modify components/Navbar.tsx.
```

**Prompt — Supabase schema:**
```
Set up the Supabase client in lib/supabase.ts using NEXT_PUBLIC_SUPABASE_URL
and NEXT_PUBLIC_SUPABASE_ANON_KEY (public/anon key only — never the service
role key here). Create a SQL migration for these tables:
- products (id uuid pk, name text, description text, price numeric, image_url
  text, category text, stock int, slug text, created_at timestamp)
- cart_items (id uuid pk, user_id text, product_id uuid fk, quantity int,
  created_at timestamp)
- orders (id uuid pk, user_id text, status text default 'pending',
  total_amount numeric, shipping_name text, shipping_address text,
  shipping_city text, shipping_postal_code text, shipping_phone text,
  razorpay_order_id text, razorpay_payment_id text, created_at timestamp)
- order_items (id uuid pk, order_id uuid fk, product_id uuid fk, quantity int,
  price numeric)
Enable Row Level Security on cart_items and orders (restrict to matching
user_id); make products publicly readable. Seed products with 8 realistic
sample rows including slugs.
```
→ **L shares the .env.local values securely with the team** once merged.

---

## T11 — M2: Real data in products API + sign-in wiring

**Prompt 1 — Swap products API to real Supabase data:**
```
Update app/api/products/route.ts to query the products table via
lib/supabase.ts (already set up — do not modify lib/supabase.ts) instead of
the in-memory array. Keep the existing ?search= and ?category= query param
filtering behavior, now applied as Supabase query filters.
```

**Prompt 2 — Wire sign-in into Navbar:**
```
In components/Navbar.tsx, add a "Sign in with Google" button using a
lucide-react icon (not a logo image or emoji), calling signInWithGoogle from
lib/firebase.ts (already built — do not modify lib/firebase.ts). When signed
in, replace the button with the user's Google profile photo, name, and a
"Sign out" option (lucide-react logout icon) in a dropdown. Persist login
across refresh using the auth state listener.
```

## T12 — M3: Real data in product detail API

**Prompt:**
```
Update app/api/products/[slug]/route.ts to query the products table via
lib/supabase.ts (already set up — do not modify lib/supabase.ts) by matching
the slug, instead of the in-memory array. Keep returning 404 JSON if not found.
```

---

## T13 — M4: Cart API route + CartContext + CartDrawer

**Prompt 1 — Cart API route:**
```
Build app/api/cart/route.ts using lib/supabase.ts (already set up — do not
modify it):
- GET: return all cart_items rows for a given user_id (passed as a query
  param for now — we'll tighten this to a verified session later).
- POST: insert a new cart_items row (user_id, product_id, quantity).
- PATCH: update the quantity of an existing cart_items row by id.
- DELETE: remove a cart_items row by id.
Return JSON responses with clear success/error shapes.
```

**Prompt 2 — CartContext + CartDrawer using the API route:**
```
Create contexts/CartContext.tsx: a React context + provider that manages cart
state tied to the signed-in Firebase user's uid, calling app/api/cart/route.ts
(already built — do not modify that file) via fetch for all reads/writes,
rather than talking to Supabase directly. Expose: addToCart(productId,
quantity), updateQuantity(itemId, quantity), removeFromCart(itemId), and a
computed subtotal. Wrap the app with this provider in app/layout.tsx (add
the wrapper only — don't change layout.tsx's metadata).

Then build components/CartDrawer.tsx using this context: list all items with
image, name, price, editable quantity (+/- icon buttons), a remove button
(trash icon), and the running subtotal. Update the Add to Cart button in
app/products/[slug]/page.tsx to call addToCart. Update the cart icon badge
in components/Navbar.tsx to show the live item count. If the user isn't
signed in, prompt them to sign in before adding to cart. Confirm the drawer
works at mobile width.
```

---

## T14 — M5: Orders API route + checkout page

**Prompt 1 — Orders API route:**
```
Build app/api/orders/route.ts as a POST endpoint using lib/supabase.ts
(already set up — do not modify it). It should accept the cart items, user
id, and shipping details in the request body, then:
1) Insert a new row into orders with status "pending" and the correct
   total_amount and shipping fields.
2) Insert matching rows into order_items linked to that order.
3) Clear the user's cart_items rows.
4) Return the new order's id.
```

**Prompt 2 — Checkout page consuming it:**
```
Build app/checkout/page.tsx using the cart from contexts/CartContext.tsx
(do not modify CartContext.tsx). Show an order summary and a form to collect
name, address, city, postal code, and phone number. Follow the design system
rules. Show clear inline validation errors (themed error-colored text/icons,
no emoji) for empty required fields. On submit, call app/api/orders/route.ts
(already built — do not modify that file), then redirect to
app/order-confirmation/[id]/page.tsx showing the order ID and summary. Build
that confirmation page too, fetching the order from app/api/orders/route.ts
or a simple direct Supabase read.
```
→ Once merged: `git commit -m "Storefront, auth, database, cart, and checkout complete"`.

---

## T15 — L: Razorpay backend (secrets — stays with L)

**Manual:** In the Razorpay Dashboard, confirm Test Mode, go to Settings → API Keys → Generate Test Key. Copy the Key ID and Key Secret.

**Prompt:**
```
Install the official Razorpay Node SDK and initialize it in lib/razorpay.ts
using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (server-only env variables,
never exposed to the browser). Build app/api/create-razorpay-order/route.ts:
1) Accept an order_id (our Supabase order id) in the request body.
2) Fetch that order's total_amount from Supabase via lib/supabase.ts.
3) Create a Razorpay Order for that amount in paise (total_amount * 100).
4) Save the Razorpay order id into razorpay_order_id on our Supabase order.
5) Return the Razorpay order id and amount to the frontend.

Then build app/api/verify-razorpay-payment/route.ts:
1) Receive razorpay_order_id, razorpay_payment_id, razorpay_signature.
2) Recompute the expected signature using HMAC SHA256 with
   RAZORPAY_KEY_SECRET (order_id + '|' + payment_id, per Razorpay's official
   method).
3) If it matches, update the Supabase order's status to 'paid' and store
   razorpay_payment_id. Return success.
4) If it does not match, do not update the order status, and return an error.

Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.example.
```
→ **L shares RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET securely with the team** once merged.

---

## T16 — M5: Order-status API route + Razorpay popup + payment UI states

**Prompt 1 — Order-status API route:**
```
Build app/api/order-status/[id]/route.ts as a GET endpoint using
lib/supabase.ts (already set up — do not modify it). It returns the current
status of an order by id. This will be used to check whether a payment
ultimately succeeded when the frontend needs to re-check or retry.
```

**Prompt 2 — Popup:**
```
In app/checkout/page.tsx, after our Supabase order and the Razorpay order
(via app/api/create-razorpay-order/route.ts, already built — do not modify
that file) are both created, load the Razorpay Checkout script and open the
payment popup. Configure it with the public key
NEXT_PUBLIC_RAZORPAY_KEY_ID, the Razorpay order id and amount, the customer's
name/email/phone from the checkout form, and our store name/logo. Show a
themed loading state (spinner icon, not emoji) while the popup loads. On
successful payment, call app/api/verify-razorpay-payment/route.ts with the
razorpay_order_id, razorpay_payment_id, and razorpay_signature returned.
```

**Prompt 3 — Success/failure handling:**
```
In app/checkout/page.tsx, show a clear success screen (redirect to
order-confirmation) with a themed success icon when verify-razorpay-payment
returns success, and a clear error message with a themed error icon plus a
"Try Again" button when it fails. Handle the case where the user closes the
Razorpay popup without paying or the payment fails: in both cases keep the
order status as 'pending' (use app/api/order-status/[id]/route.ts, already
built, to confirm current status — do not modify that file), and show:
"Payment was not completed. You can try again." with a button that reopens
the popup for the same order.
```

---

## T17 — Whole team: Test a real payment

```
Test card: 4111 1111 1111 1111
Expiry: any future date (e.g. 12/30)
CVV: any 3 digits (e.g. 123)
Name on card: any name
OTP (if asked): 1234 or any value the test screen accepts
```

**Debug prompt (anyone, if something looks wrong):**
```
I just tested a payment and [describe what happened]. Walk through
app/api/create-razorpay-order/route.ts, app/checkout/page.tsx, and
app/api/verify-razorpay-payment/route.ts, find the issue, and fix it so the
order status updates correctly to 'paid' only after a genuinely successful
and verified test payment.
```

---

## T18 — Full audit + split fixes

**L runs first, on `main`:**
```
Do a complete audit of this project before we deploy. Go through the entire
codebase and produce a report organized by category: FUNCTIONAL,
UI/THEME CONSISTENCY, RESPONSIVENESS, ACCESSIBILITY, SECURITY, PERFORMANCE.
List every issue found in each category, but do not fix anything yet —
just report.
```

Each teammate syncs, branches `<name>-audit-fix`, and runs their category:

**M2 — UI/Theme fixes:**
```
Search the entire codebase for any emoji characters and remove them,
replacing with the correct lucide-react icon. Search for any hardcoded hex
colors or arbitrary Tailwind colors (e.g. bg-blue-500) outside of globals.css
and replace them with the theme classes. Fix every instance found.
```

**M3 — Responsiveness fixes:**
```
Review every page (homepage, products, product detail, cart, checkout, order
confirmation) for mobile, tablet, and desktop layouts. Fix anything that
overlaps, overflows, or is hard to tap on a small screen.
```

**M4 — Accessibility fixes:**
```
Confirm every image has descriptive alt text, every icon-only button has an
aria-label, and text has sufficient contrast against its background given
our theme colors. Fix every issue found.
```

**M5 — Security & performance fixes:**
```
Confirm RAZORPAY_KEY_SECRET and any Supabase service-role key are never
referenced in client-side/browser code, only in server routes. Confirm all
API routes (products, cart, orders, order-status) only ever use the public
anon Supabase key, never a service-role key. Confirm .env.local is excluded
by .gitignore. Confirm RLS policies on cart_items and orders correctly
restrict access to each user's own rows. Confirm product images use Next.js's
Image component, and checkout/payment actions show a loading state rather
than appearing frozen. Fix every issue found.
```
Merge one at a time, re-testing between each.

---

## T19 — L: Production build check + deploy

**Prompt:**
```
Review this project for production readiness: confirm every secret is read
only from environment variables with nothing hardcoded, run the production
build (npm run build) and fix any errors or warnings it reports, and update
.env.local.example with the complete final list of required variable names.
```
→ Merge, then commit: `git commit -m "Razorpay payments integrated, audited, and production-ready"`.

**Manual — deploy:**
1. `vercel.com/new`, import the repo.
2. Paste every variable from `.env.local.example` (real values) into Environment Variables.
3. Deploy.

---

## T20 — Whole team: Live retest

On the live `*.vercel.app` URL, repeat the full test purchase and confirm mobile view, icons, and page titles all work correctly in production.

---

## Why this split is fair

Every member now writes **at least one real API route** that reads or writes to the actual database — not just consumes data someone else fetched. The only asymmetry left is intentional and security-driven: **L is the only one who ever handles a secret key** (Razorpay Key Secret, and is the one who runs the Supabase schema/RLS setup). That's not favoritism — in a real company, that's usually one designated person too, for the same reason.
