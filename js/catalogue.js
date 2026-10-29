/* =============================================================================
   MAHAMAYA — CATALOGUE CONFIGURATION   ←←←  EDIT ONLY THIS FILE  →→→
   =============================================================================

   This is the SINGLE SOURCE OF TRUTH for the whole shop. Every price, flavour
   name, image, grade and pack weight lives here. The product cards, the cart,
   the line totals, the subtotal and the WhatsApp message all read from this
   file automatically — you NEVER need to edit index.html or js/app.js to
   change prices or products.

   ---------------------------------------------------------------------------
   QUICK TASK INDEX  (search the file for these markers)
   ---------------------------------------------------------------------------
   • Change the WhatsApp number ........ edit  WHATSAPP_NUMBER   (section 1)
   • Change a PRICE .................... edit the  price:  of a pack (section 4)
   • Mark a price as "to be confirmed" . set    placeholder: true  on that pack
   • Publish a real price .............. set    placeholder: false AND a price
   • Add / remove a PACK WEIGHT ........ add/remove an item in a grade's packs[]
   • Make a GRADE unavailable .......... delete that grade key (or set to null)
   • Add a WHOLE NEW FLAVOUR ........... copy a product block in PRODUCTS[]
   • Change a product PHOTO ............ edit the  image:  path

   ---------------------------------------------------------------------------
   THE GOLDEN RULES  (so customers are never misled)
   ---------------------------------------------------------------------------
   1. Prices are in Indian Rupees (₹), whole numbers, e.g.  price: 120
   2. A pack with  placeholder: true  is shown as "Price to be confirmed".
      • It CANNOT be added to a confirmed-price order.
      • Customers can instead send a "request a quotation" WhatsApp enquiry.
   3. NEVER use 0 or a made-up number as a stand-in for an unknown price.
      If you don't know the price yet, leave placeholder: true.
   4. Only list the grades you ACTUALLY stock for a flavour. Unlisted grades
      do not appear as options.
   ========================================================================== */


/* ===========================================================================
   SECTION 1 — BRAND & CONTACT
   =========================================================================== */
const BRAND = "MAHAMAYA";

/* WhatsApp business number, international format, DIGITS ONLY (no +, no spaces). */
const WHATSAPP_NUMBER = "918169634386";          // = +91 81696 34386

/* Shown in the cart and included in every order message. Do NOT price delivery. */
const DELIVERY_NOTE = "Delivery charges confirmed on WhatsApp.";


/* ===========================================================================
   SECTION 2 — GRADES  (foxnut SIZES, not flavours)
   "Sutta" is the traditional size grade. Keep the ids ("4s" etc.) stable;
   you may rename the visible labels.
   =========================================================================== */
const GRADES = [
  { id: "4s",  label: "4 Sutta" },
  { id: "5s",  label: "5 Sutta" },
  { id: "6s",  label: "6 Sutta" },
  { id: "6ps", label: "6+ Sutta" }
];


/* ===========================================================================
   SECTION 3 — PACK TEMPLATES  (optional convenience helpers)
   ---------------------------------------------------------------------------
   A "pack" is one buyable WEIGHT with its own PRICE and placeholder flag:

        { weight: "100 g", price: 120, placeholder: false }

   • weight ...... any text you like, e.g. "50 g", "100 g", "250 g", "1 kg".
   • price ....... whole-number rupees. Ignored for display while placeholder
                   is true, but keep it realistic so it's ready to publish.
   • placeholder . true  = "Price to be confirmed", NOT orderable (quote only).
                   false = real, orderable price.

   The helpers below just save typing. You can ALSO write the packs array by
   hand for any grade — nothing forces you to use these helpers.
   =========================================================================== */

// Confirmed (orderable) pack: give it a weight and a real price.
function pack(weight, price) {
  return { weight: weight, price: price, placeholder: false };
}

// Unconfirmed pack: shown as "Price to be confirmed", quote-only.
// (The number is just a placeholder you can edit before publishing.)
function tbc(weight, price) {
  return { weight: weight, price: price || null, placeholder: true };
}


/* ===========================================================================
   SECTION 4 — PRODUCTS  (the 9 flavours)
   ---------------------------------------------------------------------------
   Each product:
     id .......... unique slug, lowercase, no spaces (used internally).
     name ........ flavour name shown on the card.
     description . short line under the name.
     image ....... photo path (replace with real packaging photos later).
     grades ...... object mapping a GRADE id -> { packs: [ ...packs ] }.
                   Only include the grades you stock for THIS flavour.

   NOTE ON PRICES BELOW: these are EXAMPLE demonstration prices so the shop is
   fully functional out of the box. Review and replace them with your real
   selling prices. Packs created with tbc(...) are intentionally left as
   "Price to be confirmed" to demonstrate the placeholder / quotation flow.
   =========================================================================== */
const PRODUCTS = [
  {
    id: "peri-peri",
    name: "Peri Peri Fox Nut",
    description: "Fiery, tangy and boldly spiced.",
    image: "assets/img/product-thumb.webp",
    grades: {
      // grade : { packs: [ weight+price, ... ] }
      "4s": { packs: [ pack("50 g", 70),  pack("100 g", 130), pack("200 g", 250) ] },
      "5s": { packs: [ pack("50 g", 75),  pack("100 g", 140), pack("200 g", 270) ] },
      "6s": { packs: [ pack("50 g", 80),  pack("100 g", 150), pack("200 g", 290) ] }
      // 6+ Sutta intentionally NOT listed for this flavour (example of limited stock)
    }
  },
  {
    id: "simple-white",
    name: "Simple White Nuts",
    description: "Pure, roasted and unseasoned.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: [ pack("50 g", 60), pack("100 g", 110), pack("200 g", 210) ] },
      "5s":  { packs: [ pack("50 g", 65), pack("100 g", 120), pack("200 g", 230) ] },
      "6s":  { packs: [ pack("50 g", 70), pack("100 g", 130), pack("200 g", 250) ] },
      "6ps": { packs: [ pack("100 g", 150), pack("250 g", 360) ] }
    }
  },
  {
    id: "salted",
    name: "Salted Fox Nuts",
    description: "Lightly salted everyday crunch.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s":  { packs: [ pack("50 g", 65), pack("100 g", 120), pack("200 g", 230) ] },
      "5s":  { packs: [ pack("50 g", 70), pack("100 g", 130), pack("200 g", 250) ] },
      "6s":  { packs: [ pack("50 g", 75), pack("100 g", 140), pack("200 g", 270) ] },
      "6ps": { packs: [ pack("100 g", 160), pack("250 g", 380) ] }
    }
  },
  {
    id: "chilli",
    name: "Chilli Fox Nut",
    description: "A warm, lingering chilli kick.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s": { packs: [ pack("50 g", 75), pack("100 g", 140), pack("200 g", 270) ] },
      "6s": { packs: [ pack("50 g", 80), pack("100 g", 150), pack("200 g", 290) ] }
    }
  },
  {
    id: "sezwan",
    name: "Sezwan Fox Nuts",
    description: "Street-style Szechuan zest.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: [ pack("50 g", 80), pack("100 g", 150), pack("200 g", 290) ] },
      "6s":  { packs: [ pack("50 g", 85), pack("100 g", 160), pack("200 g", 310) ] },
      // 6+ Sutta Sezwan price not finalised yet -> shown as "Price to be confirmed"
      "6ps": { packs: [ tbc("100 g"), tbc("250 g") ] }
    }
  },
  {
    id: "kurkure",
    name: "Kurkure Fox Nuts",
    description: "Crunchy, masala-coated indulgence.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "4s": { packs: [ pack("50 g", 70), pack("100 g", 135), pack("200 g", 260) ] },
      "6s": { packs: [ pack("50 g", 80), pack("100 g", 150), pack("200 g", 290) ] }
    }
  },
  {
    id: "onion",
    name: "Onion Fox Nuts",
    description: "Savoury roasted onion flavour.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s":  { packs: [ pack("50 g", 75), pack("100 g", 140), pack("200 g", 270) ] },
      "6s":  { packs: [ pack("50 g", 80), pack("100 g", 150), pack("200 g", 290) ] },
      "6ps": { packs: [ pack("100 g", 170), pack("250 g", 400) ] }
    }
  },
  {
    id: "garlic",
    name: "Garlic Fox Nuts",
    description: "Aromatic, toasty garlic notes.",
    image: "assets/img/product-thumb.webp",
    grades: {
      "5s": { packs: [ pack("50 g", 75), pack("100 g", 140), pack("200 g", 270) ] },
      "6s": { packs: [ pack("50 g", 80), pack("100 g", 150), pack("200 g", 290) ] }
    }
  },
  {
    id: "mango",
    name: "Mango Fox Nuts",
    description: "Sweet-tangy seasonal mango twist.",
    image: "assets/img/product-thumb.webp",
    grades: {
      // Seasonal flavour — prices still being finalised, so quote-only for now.
      "6s":  { packs: [ tbc("100 g"), tbc("200 g") ] },
      "6ps": { packs: [ tbc("100 g"), tbc("250 g") ] }
    }
  }
];


/* ===========================================================================
   SECTION 5 — EXPORT  (do not edit below this line)
   Exposes everything above to the app as one object.
   =========================================================================== */
const MAHAMAYA_CONFIG = {
  brand: BRAND,
  whatsapp: WHATSAPP_NUMBER,
  deliveryNote: DELIVERY_NOTE,
  currency: "₹",
  grades: GRADES,
  products: PRODUCTS
};

/* Make available to app.js (works with a plain <script> include). */
if (typeof window !== "undefined") { window.MAHAMAYA_CONFIG = MAHAMAYA_CONFIG; }
