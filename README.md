# MAHAMAYA — Premium Foxnuts (Makhana) Website

A complete, production-ready, single-page static website for the **MAHAMAYA**
foxnuts brand. No build step, no backend, no database — just open `index.html`
or serve the folder statically.

> Tagline: **Discover the Crunch of Nature**

## Features

- Cinematic luxury design (ivory + earthy green + restrained gold), responsive & mobile-first.
- Hero with a stand-up pouch that **rises, rotates and settles** on load and reacts to scroll, with a static-image fallback and full `prefers-reduced-motion` support.
- 5 sections: Hero · Product Catalogue · About · Why Choose Us · Contact/WhatsApp.
- 9 flavours × configurable grades (**4 / 5 / 6 / 6+ Sutta**) with multiple pack weights.
- Product cards: image, grade selector, pack-weight selector, ₹ price, quantity +/− controls, add to order.
- Cart with line totals, subtotal, edit/remove, instant recalculation, empty-state and validation.
- WhatsApp ordering to **+91 81696 34386** with a correctly URL-encoded, pre-filled order message. Opens in a new tab with a manual fallback link. The customer must press **Send** in WhatsApp — the order is never auto-placed.
- Delivery never priced: shows **“Delivery charges confirmed on WhatsApp.”**
- SEO title/description, semantic & keyboard-accessible markup, lazy-loaded optimized images (WebP).

## Project structure

```
index.html            # markup + SEO
css/styles.css         # all styles (responsive + reduced-motion)
js/catalogue.js        # ← EDIT THIS: all product data (single config)
js/app.js              # rendering, cart, totals, WhatsApp logic
assets/img/            # optimized images (pouch, hero, about, thumb, favicon)
```

## Editing the catalogue (the only file you normally touch)

Open **`js/catalogue.js`**. It is fully commented. You can:

1. **Brand / WhatsApp** — edit `BRAND` and `WHATSAPP_NUMBER`.
2. **Grades** — foxnut sizes in `GRADES` (usually leave as-is).
3. **Products** — one entry per flavour in `PRODUCTS`. For each flavour set:
   - which grades are available (the `grades` map; omit a grade to hide it),
   - the pack weights + prices for each grade (`packs`),
   - the product `image`.

### Placeholder prices (important)

Every seeded pack has `placeholder: true`. This means the price is **NOT**
confirmed:

- The card shows **“Price to be confirmed”** instead of a price.
- **Ordering is disabled** for that option, so no customer can ever be charged a
  placeholder price.

When you have a real price, set the real `price` and change `placeholder` to
`false` for that pack — it immediately becomes orderable.

To make a grade unavailable for a flavour, remove it (or set it to `null`) in
that product's `grades` map. Never list a grade you don't actually stock.

### Replacing product photos

Drop real photos into `assets/img/` and point each product's `image` field at
them. The temporary pouch mockup (`product-thumb.webp`) is a placeholder until
the real packaging artwork is supplied.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

It's a static site — host it anywhere:

- **Cloudflare Pages** / **Netlify** / **Vercel**: drag-and-drop the folder or
  connect the repo (no build command, output = project root).
- **GitHub Pages**: push and enable Pages on the branch root.
- Any static web host / S3 bucket.

## Notes / honesty

No certifications, health claims, reviews, awards or unverified business claims
are made anywhere. Prices shown out of the box are clearly marked placeholders.
