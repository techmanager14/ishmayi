# Ishmayi

Website and online store for Ishmayi: premium adornments and heritage, operated by Trivana Creations LLP.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript. Products, orders, customers and site content are stored in GoHighLevel. Payments go through Razorpay.

```bash
npm install
cp .env.example .env.local   # fill in your own values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Home: banners, category tiles, budget and category grids, products, offers, limited-time sales, occasions |
| `/shop` | All products, with filters (`?collection=`, `?q=`, `?max=`, `?offer=1`) |
| `/product/[handle]` | Product details |
| `/offers`, `/promo-codes` | Current offers and public promo codes |
| `/sale/[id]` | Limited-time sale with a countdown |
| `/explore` | Browse by collection, gemstone and style |
| `/gifting`, `/gift-sets`, `/bulk-orders` | Gifting, customised gift set requests and bulk order enquiries |
| `/wishlist`, `/cart`, `/checkout` | Wishlist and bag (kept in the browser) and secure checkout |
| `/account`, `/track`, `/report-damage` | Customer accounts, order tracking and damage claims |
| `/about`, `/faqs`, `/contact`, `/jewellery-care`, `/policies` | Information pages |
| `/admin` | Private back office |

## Where things are edited

- **Merchandising** (category tiles, collections, gemstones, styles, occasions): `src/data/shelves.ts`. Shelves fill themselves by matching words in product names, plus any GoHighLevel collection with the same slug. Set `image` on a shelf to use a specific photo.
- **Sales and countdowns:** `src/data/offers.ts`. Each campaign gets its own page, and the `endsAt` date drives the countdown.
- **Filter pills:** `src/data/chips.ts`. "Most Bought" stays hidden until `MOST_BOUGHT` lists real best sellers.
- **Everything else** (banners, FAQs, reviews, promo codes, products, settings): the admin panel.

Discounts are never invented: a percentage only appears when it is set on a campaign or the listed prices are really reduced.

## Configuration

Copy `.env.example` to `.env.local`. It lists every setting. Secrets belong only in `.env.local` and your hosting settings, never in this repository.

Without the GoHighLevel settings the shop has no products and ordering is closed. Use Razorpay test keys until you are ready to take real payments.

## Checks

```bash
npx tsc --noEmit
npm run build
```
