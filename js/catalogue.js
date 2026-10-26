/* =============================================================================
   MAHAMAYA — CATALOGUE CONFIGURATION  (EDIT THIS FILE ONLY)
   -----------------------------------------------------------------------------
   This is the ONE place to manage the whole product catalogue.
   The owner should replace the PLACEHOLDER values below with the final data.

   HOW TO EDIT
   -----------
   1. BRAND / CONTACT ....... edit BRAND and WHATSAPP_NUMBER.
   2. GRADES ................ foxnut sizes. Usually leave as-is.
   3. PRODUCTS .............. one entry per flavour. For each flavour you choose:
        - which GRADES are available (grades object)
        - for each available grade, the PACK WEIGHTS + PRICES (packs array)
        - the product image (image)

   IMPORTANT RULES
   ---------------
   • Prices are in Indian Rupees (INR, ₹).
   • Every pack currently has  "placeholder": true  which means the price is a
     PLACEHOLDER, NOT a confirmed price. The website clearly labels these and
     DISABLES ordering for them so no customer is ever charged a fake price.
   • When you have a REAL price, set the real "price" and change the pack's
     "placeholder" to false  →  that pack becomes orderable.
   • To make a grade unavailable for a flavour, set it to  null  (or remove it).
   • Never claim every grade is available for every flavour — only list the
     grades you actually stock for each flavour.
   ========================================================================== */

const BRAND = "MAHAMAYA";

/* WhatsApp business number in international format, digits only. */
const WHATSAPP_NUMBER = "918169634386";      // +91 81696 34386

/* Delivery policy text shown in cart + WhatsApp message (do not price delivery). */
const DELIVERY_NOTE = "Delivery charges confirmed on WhatsApp.";

/* -----------------------------------------------------------------------------
   GRADES (foxnut SIZES — not flavours). "Sutta" is the traditional size grade.
   Keep ids stable; edit labels if needed.
----------------------------------------------------------------------------- */
const GRADES = [
  { id: "4s",  label: "4 Sutta" },
  { id: "5s",  label: "5 Sutta" },
  { id: "6s",  label: "6 Sutta" },
  { id: "6ps", label: "6+ Sutta" }
];

/* -----------------------------------------------------------------------------
   PACK HELPERS
   A pack = one buyable weight+price for a given grade of a flavour.
   placeholder:true  → price is NOT confirmed, ordering disabled for that pack.
   Replace with real weights/prices and set placeholder:false to enable.
----------------------------------------------------------------------------- */
// Default seed packs reused for every available grade below.
// EDIT these per grade/flavour as real data arrives.
function seedPacks() {
  return [
    { weight: "100 g", price: 199, placeholder: true },
    { weight: "250 g", price: 449, placeholder: true },
    { weight: "500 g", price: 849, placeholder: true }
  ];
}

/* -----------------------------------------------------------------------------
   PRODUCTS (the 9 flavours)
   grades: map of GRADE id -> { packs: [...] }  (omit / null = not available)
----------------------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: "peri-peri",
    name: "Peri Peri Fox Nut",
    tagline: "Fiery, tangy and boldly spiced.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: seedPacks() },
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() }
      // 6+ Sutta not listed for this flavour (example of limited availability)
    }
  },
  {
    id: "simple-white",
    name: "Simple White Nuts",
    tagline: "Pure, roasted and unseasoned.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: seedPacks() },
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() },
      "6ps": { packs: seedPacks() }
    }
  },
  {
    id: "salted",
    name: "Salted Fox Nuts",
    tagline: "Lightly salted everyday crunch.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: seedPacks() },
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() },
      "6ps": { packs: seedPacks() }
    }
  },
  {
    id: "chilli",
    name: "Chilli Fox Nut",
    tagline: "A warm, lingering chilli kick.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() }
    }
  },
  {
    id: "sezwan",
    name: "Sezwan Fox Nuts",
    tagline: "Street-style Szechuan zest.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() },
      "6ps": { packs: seedPacks() }
    }
  },
  {
    id: "kurkure",
    name: "Kurkure Fox Nuts",
    tagline: "Crunchy, masala-coated indulgence.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() }
    }
  },
  {
    id: "onion",
    name: "Onion Fox Nuts",
    tagline: "Savoury roasted onion flavour.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() },
      "6ps": { packs: seedPacks() }
    }
  },
  {
    id: "garlic",
    name: "Garlic Fox Nuts",
    tagline: "Aromatic, toasty garlic notes.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: seedPacks() },
      "6s":  { packs: seedPacks() }
    }
  },
  {
    id: "mango",
    name: "Mango Fox Nuts",
    tagline: "Sweet-tangy seasonal mango twist.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "6s":  { packs: seedPacks() },
      "6ps": { packs: seedPacks() }
    }
  }
];

/* Expose config as a single namespace for the app. Do not edit below. */
const MAHAMAYA_CONFIG = {
  brand: BRAND,
  whatsapp: WHATSAPP_NUMBER,
  deliveryNote: DELIVERY_NOTE,
  currency: "₹",
  grades: GRADES,
  products: PRODUCTS
};
