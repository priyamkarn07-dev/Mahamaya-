/* =============================================================================
   MAHAMAYA — App logic
   Depends on: js/catalogue.js (MAHAMAYA_CONFIG)
   Handles: product rendering, per-card selectors, cart, totals, validation,
            WhatsApp order + quotation enquiry, hero animation, reveal.

   NOTE: There are NO prices in this file. All prices/weights/grades come from
   js/catalogue.js. Edit prices there and everything here updates automatically.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.MAHAMAYA_CONFIG || (typeof MAHAMAYA_CONFIG !== "undefined" ? MAHAMAYA_CONFIG : null);
  if (!CFG) { console.error("MAHAMAYA_CONFIG missing — check js/catalogue.js load order."); return; }

  const CUR = CFG.currency || "₹";
  const gradeLabel = (id) => (CFG.grades.find(g => g.id === id) || {}).label || id;
  const fmt = (n) => CUR + Number(n).toLocaleString("en-IN");
  const el = (sel, root = document) => root.querySelector(sel);

  const MAX_QTY = 99;

  // ---- Cart state: keyed by product|grade|packIndex ------------------------
  const cart = new Map(); // key -> { productId, name, gradeId, gradeLabel, weight, price, qty }
  const grid = el("#productGrid");

  /* ===========================================================================
     CATALOGUE DATA HELPERS
     =========================================================================== */
  function availableGrades(product) {
    // Only grades that exist for this product AND have at least one pack.
    return CFG.grades.filter(g => product.grades && product.grades[g.id] &&
      Array.isArray(product.grades[g.id].packs) && product.grades[g.id].packs.length);
  }
  function packsFor(product, gradeId) {
    const g = product.grades && product.grades[gradeId];
    return g && Array.isArray(g.packs) ? g.packs : [];
  }
  function isOrderablePack(p) {
    return !!p && p.placeholder !== true && typeof p.price === "number" && p.price > 0;
  }

  /* ===========================================================================
     RENDER PRODUCT CARDS  (each card is fully independent)
     =========================================================================== */
  function buildCard(product) {
    const grades = availableGrades(product);
    const card = document.createElement("article");
    card.className = "product-card reveal";
    card.dataset.pid = product.id;

    // No grades at all -> graceful unavailable card.
    if (!grades.length) {
      card.innerHTML = `
        <div class="pc-media"><img src="${product.image}" alt="${product.name} pack" loading="lazy" decoding="async" width="640" height="640"></div>
        <div class="pc-body">
          <h3 class="pc-name">${product.name}</h3>
          <p class="pc-tag">${product.description || ""}</p>
          <p class="pc-unavailable">Currently unavailable</p>
        </div>`;
      handleImgError(card);
      return card;
    }

    const gradeOpts = grades.map(g => `<option value="${g.id}">${g.label}</option>`).join("");

    card.innerHTML = `
      <div class="pc-media"><img src="${product.image}" alt="${product.name} pack" loading="lazy" decoding="async" width="640" height="640"></div>
      <div class="pc-body">
        <h3 class="pc-name">${product.name}</h3>
        <p class="pc-tag">${product.description || ""}</p>

        <div class="pc-field">
          <label for="grade-${product.id}">Grade (size)</label>
          <select class="pc-select js-grade" id="grade-${product.id}">${gradeOpts}</select>
        </div>

        <div class="pc-field">
          <label for="pack-${product.id}">Pack weight</label>
          <select class="pc-select js-pack" id="pack-${product.id}"></select>
        </div>

        <div class="pc-price-row">
          <span class="pc-price js-price" aria-live="polite"></span>
        </div>

        <div class="pc-field">
          <label for="qty-${product.id}">Quantity</label>
          <div class="pc-qty">
            <button type="button" class="qty-btn js-minus" aria-label="Decrease quantity for ${product.name}">−</button>
            <input class="qty-input js-qty" id="qty-${product.id}" type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="1" aria-label="Quantity for ${product.name}">
            <button type="button" class="qty-btn js-plus" aria-label="Increase quantity for ${product.name}">+</button>
          </div>
        </div>

        <div class="pc-add">
          <button type="button" class="btn btn-primary js-add">Add to Order</button>
          <button type="button" class="btn btn-ghost js-quote" hidden>Request a Quote</button>
          <p class="pc-added js-added" hidden aria-live="polite"><span class="pc-added-ico" aria-hidden="true">✓</span> <span class="js-added-text">Added to your order</span></p>
        </div>
      </div>`;

    const gradeSel = el(".js-grade", card);
    const packSel  = el(".js-pack", card);
    const priceEl  = el(".js-price", card);
    const qtyInput = el(".js-qty", card);
    const addBtn   = el(".js-add", card);
    const quoteBtn = el(".js-quote", card);
    const addedMsg = el(".js-added", card);
    const addedTxt = el(".js-added-text", card);

    handleImgError(card);

    function renderPacks() {
      const packs = packsFor(product, gradeSel.value);
      packSel.innerHTML = packs.map((p, i) => `<option value="${i}">${p.weight}</option>`).join("");
      packSel.selectedIndex = 0;
      renderPrice();
    }

    function currentPackIndex() { return Number(packSel.value) || 0; }
    function currentPack() { return packsFor(product, gradeSel.value)[currentPackIndex()] || null; }

    function renderPrice() {
      const pack = currentPack();
      hideAddedFlash();
      if (!pack) { priceEl.textContent = ""; return; }

      if (isOrderablePack(pack)) {
        priceEl.classList.remove("placeholder");
        priceEl.textContent = fmt(pack.price);
        addBtn.hidden = false;  addBtn.disabled = false;
        quoteBtn.hidden = true;
        reflectAddedState();
      } else {
        // Placeholder / unconfirmed price → quote only, cannot be ordered.
        priceEl.classList.add("placeholder");
        priceEl.textContent = "Price to be confirmed";
        addBtn.hidden = true;   addBtn.disabled = true;
        quoteBtn.hidden = false;
      }
    }

    // Shows the persistent "✓ In your order (xN)" state if this exact
    // product+grade+pack is already in the cart.
    function reflectAddedState() {
      const pack = currentPack();
      if (!pack || !isOrderablePack(pack)) { addedMsg.hidden = true; card.classList.remove("is-added"); return; }
      const key = keyOf(product.id, gradeSel.value, currentPackIndex());
      const item = cart.get(key);
      if (item) {
        addedMsg.hidden = false;
        addedTxt.textContent = `In your order (×${item.qty})`;
        card.classList.add("is-added");
      } else {
        addedMsg.hidden = true;
        card.classList.remove("is-added");
      }
    }

    let flashTimer;
    function flashAdded(qty) {
      addedMsg.hidden = false;
      addedTxt.textContent = `Added ${qty} to your order`;
      card.classList.add("is-added", "just-added");
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { card.classList.remove("just-added"); reflectAddedState(); }, 1600);
    }
    function hideAddedFlash() { clearTimeout(flashTimer); card.classList.remove("just-added"); }

    function clampQty() {
      let v = parseInt(qtyInput.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > MAX_QTY) v = MAX_QTY;
      qtyInput.value = v;
      return v;
    }

    gradeSel.addEventListener("change", renderPacks);
    packSel.addEventListener("change", renderPrice);
    qtyInput.addEventListener("input", () => { if (qtyInput.value !== "") clampQty(); });
    qtyInput.addEventListener("blur", clampQty);
    el(".js-minus", card).addEventListener("click", () => { qtyInput.value = Math.max(1, clampQty() - 1); });
    el(".js-plus", card).addEventListener("click", () => { qtyInput.value = Math.min(MAX_QTY, clampQty() + 1); });

    addBtn.addEventListener("click", () => {
      const pack = currentPack();
      if (!isOrderablePack(pack)) { toast("That option has no confirmed price yet."); renderPrice(); return; }
      const qty = clampQty();
      addToCart(product, gradeSel.value, currentPackIndex(), pack, qty);
      flashAdded(qty);
      toast(`Added ${qty} × ${product.name} · ${gradeLabel(gradeSel.value)} · ${pack.weight}`);
    });

    quoteBtn.addEventListener("click", () => {
      const pack = currentPack();
      openQuoteEnquiry(product, gradeSel.value, pack ? pack.weight : "", clampQty());
    });

    // expose refresh so the cart can update this card's "added" badge
    card._refreshAdded = reflectAddedState;

    renderPacks();
    return card;
  }

  // If a product image is missing/broken, swap to a styled placeholder box.
  function handleImgError(card) {
    const img = el("img", card);
    if (!img) return;
    img.addEventListener("error", () => {
      const ph = document.createElement("div");
      ph.className = "pc-img-fallback";
      ph.setAttribute("aria-hidden", "true");
      ph.textContent = "MAHAMAYA";
      img.replaceWith(ph);
    }, { once: true });
  }

  function renderCatalogue() {
    if (!grid) return;
    if (!CFG.products || !CFG.products.length) {
      grid.innerHTML = `<p class="catalogue-empty">No products are available right now. Please check back soon.</p>`;
      return;
    }
    const frag = document.createDocumentFragment();
    CFG.products.forEach(p => frag.appendChild(buildCard(p)));
    grid.appendChild(frag);
  }

  function refreshAllAddedStates() {
    grid && grid.querySelectorAll(".product-card").forEach(c => { if (c._refreshAdded) c._refreshAdded(); });
  }

  /* ===========================================================================
     CART
     =========================================================================== */
  function keyOf(productId, gradeId, packIdx) { return `${productId}|${gradeId}|${packIdx}`; }

  function addToCart(product, gradeId, packIdx, pack, qty) {
    const key = keyOf(product.id, gradeId, packIdx);
    const existing = cart.get(key);
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + qty);
      existing.price = pack.price; // keep price fresh from catalogue
    } else {
      cart.set(key, {
        productId: product.id,
        name: product.name,
        gradeId,
        gradeLabel: gradeLabel(gradeId),
        weight: pack.weight,
        price: pack.price,
        qty
      });
    }
    renderCart();
  }

  function setQty(key, qty) {
    const item = cart.get(key);
    if (!item) return;
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > MAX_QTY) qty = MAX_QTY;
    item.qty = qty;
    renderCart();
  }
  function removeItem(key) {
    cart.delete(key);
    renderCart();
    if (cart.size === 0) toast("Order cleared");
  }

  function subtotal() { let s = 0; cart.forEach(i => { s += i.price * i.qty; }); return s; }
  function totalUnits() { let q = 0; cart.forEach(i => { q += i.qty; }); return q; }
  function distinctItems() { return cart.size; }

  const cartEmpty      = el("#cartEmpty");
  const cartFilled     = el("#cartFilled");
  const cartItems      = el("#cartItems");
  const cartSubtotalEl = el("#cartSubtotal");
  const navCartCount   = el("#navCartCount");
  const cartCountLine  = el("#cartCountLine");
  const placeOrderBtn  = el("#placeOrderBtn");

  function renderCart() {
    if (navCartCount) navCartCount.textContent = totalUnits();

    if (cart.size === 0) {
      if (cartEmpty)  cartEmpty.hidden = false;
      if (cartFilled) cartFilled.hidden = true;
      if (cartItems)  cartItems.innerHTML = "";
      refreshAllAddedStates();
      return;
    }
    if (cartEmpty)  cartEmpty.hidden = true;
    if (cartFilled) cartFilled.hidden = false;

    cartItems.innerHTML = "";
    let idx = 1;
    cart.forEach((item, key) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      const line = item.price * item.qty;
      li.innerHTML = `
        <div class="ci-main">
          <div class="ci-name"><span class="ci-num">${idx}.</span> ${item.name}</div>
          <div class="ci-meta">Grade: ${item.gradeLabel} &nbsp;·&nbsp; Pack: ${item.weight}</div>
          <div class="ci-unit">${fmt(item.price)} per pack</div>
        </div>
        <div class="ci-right">
          <div class="ci-line">${fmt(line)}</div>
          <div class="ci-controls">
            <button type="button" class="qty-btn js-ci-minus" aria-label="Decrease quantity of ${item.name} ${item.gradeLabel} ${item.weight}">−</button>
            <input class="qty-input js-ci-qty" type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="${item.qty}" aria-label="Quantity of ${item.name} ${item.gradeLabel} ${item.weight}">
            <button type="button" class="qty-btn js-ci-plus" aria-label="Increase quantity of ${item.name} ${item.gradeLabel} ${item.weight}">+</button>
          </div>
          <button type="button" class="ci-remove js-ci-remove" aria-label="Remove ${item.name} ${item.gradeLabel} ${item.weight} from order">Remove</button>
        </div>`;

      el(".js-ci-minus", li).addEventListener("click", () => setQty(key, item.qty - 1));
      el(".js-ci-plus", li).addEventListener("click", () => setQty(key, item.qty + 1));
      el(".js-ci-remove", li).addEventListener("click", () => removeItem(key));
      const qi = el(".js-ci-qty", li);
      qi.addEventListener("change", () => setQty(key, qi.value));
      qi.addEventListener("blur", () => { if (qi.value === "" || parseInt(qi.value,10) < 1) setQty(key, 1); });

      cartItems.appendChild(li);
      idx++;
    });

    cartSubtotalEl.textContent = fmt(subtotal());
    if (cartCountLine) {
      const items = distinctItems(), units = totalUnits();
      cartCountLine.textContent =
        `${items} ${items === 1 ? "item" : "items"} · ${units} ${units === 1 ? "pack" : "packs"} total`;
    }
    // Place Order only enabled with >=1 valid orderable item (always true here,
    // since placeholder items can never enter the cart).
    if (placeOrderBtn) placeOrderBtn.disabled = !hasOrderableItems();

    refreshAllAddedStates();
  }

  function hasOrderableItems() {
    let ok = false;
    cart.forEach(i => { if (typeof i.price === "number" && i.price > 0 && i.qty > 0) ok = true; });
    return ok;
  }

  /* ===========================================================================
     WHATSAPP — ORDER MESSAGE (exact format from spec)
     =========================================================================== */
  function buildOrderMessage() {
    const lines = [];
    lines.push(`Hello ${CFG.brand}, I would like to place an order.`);
    lines.push("");
    let idx = 1;
    cart.forEach(item => {
      const line = item.price * item.qty;
      lines.push(`${idx}. Flavour: ${item.name}`);
      lines.push(`   Grade: ${item.gradeLabel}`);
      lines.push(`   Pack: ${item.weight}`);
      lines.push(`   Quantity: ${item.qty}`);
      lines.push(`   Price per pack: ${fmt(item.price)}`);
      lines.push(`   Line total: ${fmt(line)}`);
      lines.push("");
      idx++;
    });
    lines.push(`Order subtotal: ${fmt(subtotal())}`);
    lines.push(`Delivery: To be confirmed on WhatsApp.`);
    lines.push("");
    lines.push(`Please confirm availability and delivery charges.`);
    return lines.join("\n");
  }

  // A separate, clearly-labelled QUOTATION enquiry for unpriced products.
  function buildQuoteMessage(product, gradeId, weight, qty) {
    const lines = [];
    lines.push(`Hello ${CFG.brand}, I would like to request a price quotation (not a confirmed order).`);
    lines.push("");
    lines.push(`Flavour: ${product.name}`);
    if (gradeId) lines.push(`Grade: ${gradeLabel(gradeId)}`);
    if (weight)  lines.push(`Pack: ${weight}`);
    if (qty)     lines.push(`Quantity interested: ${qty}`);
    lines.push("");
    lines.push(`Please share the price and availability for this item.`);
    return lines.join("\n");
  }

  // IMPORTANT: encode ONLY the message, then append to the base URL.
  function whatsappUrl(text) {
    return `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  // Open in a new tab; if blocked, reveal a manual fallback link.
  function openWhatsApp(url, fallbackLink, fallbackWrap, okMsg) {
    if (fallbackLink) fallbackLink.href = url;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      if (fallbackWrap) fallbackWrap.hidden = false;
      toast("Pop-up blocked — use the manual link shown.");
      return false;
    }
    if (fallbackWrap) fallbackWrap.hidden = false; // keep as a safety net
    if (okMsg) toast(okMsg);
    return true;
  }

  function placeOrder() {
    // Validate the cart again right before opening WhatsApp.
    if (cart.size === 0 || !hasOrderableItems()) {
      toast("Your order is empty — add at least one item first.");
      const sec = el("#catalogue"); if (sec) sec.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const url = whatsappUrl(buildOrderMessage());
    openWhatsApp(url, el("#orderFallbackLink"), el("#orderFallback"),
      "Opening WhatsApp… review your order and press Send.");
  }

  function openQuoteEnquiry(product, gradeId, weight, qty) {
    const url = whatsappUrl(buildQuoteMessage(product, gradeId, weight, qty));
    // reuse a lightweight toast + open (no cart fallback element needed)
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      // fallback: temporarily set the contact link and tell the user
      const c = el("#contactWhatsApp");
      if (c) { c.href = url; }
      toast("Pop-up blocked — use ‘Chat on WhatsApp’ in Contact.");
    } else {
      toast("Opening a WhatsApp quotation enquiry (not a confirmed order).");
    }
  }

  /* ===========================================================================
     STATIC UI WIRING
     =========================================================================== */
  function wireStaticUI() {
    const contact = el("#contactWhatsApp");
    if (contact) contact.href = whatsappUrl(`Hello ${CFG.brand}, I'd like to know more about your foxnuts.`);
    const dn = el("#deliveryNote"); if (dn) dn.textContent = CFG.deliveryNote;

    if (placeOrderBtn) placeOrderBtn.addEventListener("click", placeOrder);
    const clearBtn = el("#clearCartBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      cart.clear(); renderCart();
      const f = el("#orderFallback"); if (f) f.hidden = true;
      toast("Order cleared");
    });

    // Mobile nav
    const toggle = el("#navToggle"), menu = el("#navMenu");
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }));
    }
    const yr = el("#year"); if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ===========================================================================
     TOAST
     =========================================================================== */
  let toastTimer;
  function toast(msg) {
    const t = el("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ===========================================================================
     HERO SCROLL ANIMATION (pouch rise/rotate/settle) + reduced motion
     =========================================================================== */
  function initHeroAnimation() {
    const wrap = el("#pouchWrap");
    if (!wrap) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      wrap.style.setProperty("--p-op", "1");
      wrap.style.setProperty("--p-y", "0px");
      wrap.style.setProperty("--p-rot", "0deg");
      wrap.style.setProperty("--p-scale", "1");
      return;
    }
    const hero = el("#hero");
    let ticking = false;
    function update() {
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      let p = (-rect.top) / vh;
      p = Math.max(0, Math.min(1, p));
      const ease = p;
      wrap.style.setProperty("--p-y", (-ease * 40).toFixed(2) + "px");
      wrap.style.setProperty("--p-rot", (ease * 8).toFixed(2) + "deg");
      wrap.style.setProperty("--p-scale", (1 - ease * 0.06).toFixed(3));
      wrap.style.setProperty("--p-op", (1 - ease * 0.25).toFixed(3));
    }
    // Intro
    wrap.style.setProperty("--p-op", "0");
    wrap.style.setProperty("--p-y", "60px");
    wrap.style.setProperty("--p-rot", "-10deg");
    wrap.style.setProperty("--p-scale", "0.9");
    wrap.style.transition = "transform 1.1s cubic-bezier(.2,.8,.2,1), opacity 1.1s ease";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.style.setProperty("--p-op", "1");
      wrap.style.setProperty("--p-y", "0px");
      wrap.style.setProperty("--p-rot", "0deg");
      wrap.style.setProperty("--p-scale", "1");
    }));
    setTimeout(() => { wrap.style.transition = "transform .15s linear, opacity .15s linear"; }, 1200);
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  /* ===========================================================================
     REVEAL ON SCROLL
     =========================================================================== */
  function initReveal() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll(".reveal, .section-head, .about-copy, .about-media, .why-card");
    items.forEach(i => i.classList.add("reveal"));
    if (reduce || !("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(i => io.observe(i));
  }

  /* ===========================================================================
     INIT
     =========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    renderCatalogue();
    renderCart();
    wireStaticUI();
    initHeroAnimation();
    initReveal();
  });
})();
