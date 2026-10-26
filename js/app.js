/* =============================================================================
   MAHAMAYA — App logic
   Depends on: js/catalogue.js (MAHAMAYA_CONFIG)
   Handles: product rendering, selectors, cart, totals, WhatsApp order.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.MAHAMAYA_CONFIG || (typeof MAHAMAYA_CONFIG !== "undefined" ? MAHAMAYA_CONFIG : null);
  if (!CFG) { console.error("MAHAMAYA_CONFIG missing"); return; }

  const CUR = CFG.currency || "₹";
  const gradeLabel = (id) => (CFG.grades.find(g => g.id === id) || {}).label || id;
  const fmt = (n) => CUR + Number(n).toLocaleString("en-IN");

  // ---- Cart state: keyed by product|grade|packIndex ------------------------
  const cart = new Map(); // key -> { productId, name, gradeId, gradeLabel, weight, price, qty }

  const el = (sel, root = document) => root.querySelector(sel);
  const grid = el("#productGrid");

  /* ---------------------------------------------------------------------------
     RENDER PRODUCT CARDS
  --------------------------------------------------------------------------- */
  function availableGrades(product) {
    return CFG.grades.filter(g => product.grades && product.grades[g.id] &&
      Array.isArray(product.grades[g.id].packs) && product.grades[g.id].packs.length);
  }

  function packsFor(product, gradeId) {
    const g = product.grades && product.grades[gradeId];
    return g && Array.isArray(g.packs) ? g.packs : [];
  }

  function buildCard(product) {
    const grades = availableGrades(product);
    const card = document.createElement("article");
    card.className = "product-card reveal";
    card.dataset.pid = product.id;

    if (!grades.length) {
      card.innerHTML = `
        <div class="pc-media"><img src="${product.image}" alt="${product.name} pouch" loading="lazy" decoding="async" width="640" height="640"></div>
        <div class="pc-body">
          <h3 class="pc-name">${product.name}</h3>
          <p class="pc-tag">${product.tagline || ""}</p>
          <p class="pc-unavailable">Currently unavailable</p>
        </div>`;
      return card;
    }

    const gradeOpts = grades.map(g => `<option value="${g.id}">${g.label}</option>`).join("");

    card.innerHTML = `
      <div class="pc-media"><img src="${product.image}" alt="${product.name} pouch" loading="lazy" decoding="async" width="640" height="640"></div>
      <div class="pc-body">
        <h3 class="pc-name">${product.name}</h3>
        <p class="pc-tag">${product.tagline || ""}</p>

        <div class="pc-field">
          <label for="grade-${product.id}">Grade (size)</label>
          <select class="pc-select js-grade" id="grade-${product.id}">${gradeOpts}</select>
        </div>

        <div class="pc-field">
          <label for="pack-${product.id}">Pack weight</label>
          <select class="pc-select js-pack" id="pack-${product.id}"></select>
        </div>

        <div class="pc-price-row">
          <span class="pc-price js-price"></span>
        </div>

        <div class="pc-field">
          <label for="qty-${product.id}">Quantity</label>
          <div class="pc-qty">
            <button type="button" class="qty-btn js-minus" aria-label="Decrease quantity for ${product.name}">−</button>
            <input class="qty-input js-qty" id="qty-${product.id}" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Quantity for ${product.name}">
            <button type="button" class="qty-btn js-plus" aria-label="Increase quantity for ${product.name}">+</button>
          </div>
        </div>

        <div class="pc-add">
          <button type="button" class="btn btn-primary js-add">Add to order</button>
        </div>
      </div>`;

    const gradeSel = el(".js-grade", card);
    const packSel  = el(".js-pack", card);
    const priceEl  = el(".js-price", card);
    const qtyInput = el(".js-qty", card);
    const addBtn   = el(".js-add", card);

    function renderPacks() {
      const packs = packsFor(product, gradeSel.value);
      packSel.innerHTML = packs.map((p, i) =>
        `<option value="${i}">${p.weight}</option>`).join("");
      renderPrice();
    }

    function currentPack() {
      const packs = packsFor(product, gradeSel.value);
      return packs[Number(packSel.value)] || null;
    }

    function renderPrice() {
      const pack = currentPack();
      if (!pack) { priceEl.textContent = ""; return; }
      if (pack.placeholder) {
        priceEl.classList.add("placeholder");
        priceEl.textContent = "Price to be confirmed";
        addBtn.disabled = true;
        addBtn.textContent = "Coming soon";
      } else {
        priceEl.classList.remove("placeholder");
        priceEl.textContent = fmt(pack.price);
        addBtn.disabled = false;
        addBtn.textContent = "Add to order";
      }
    }

    function clampQty() {
      let v = parseInt(qtyInput.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 99) v = 99;
      qtyInput.value = v;
      return v;
    }

    gradeSel.addEventListener("change", renderPacks);
    packSel.addEventListener("change", renderPrice);
    qtyInput.addEventListener("input", () => { if (qtyInput.value !== "") clampQty(); });
    qtyInput.addEventListener("blur", clampQty);
    el(".js-minus", card).addEventListener("click", () => { qtyInput.value = Math.max(1, clampQty() - 1); });
    el(".js-plus", card).addEventListener("click", () => { qtyInput.value = Math.min(99, clampQty() + 1); });

    addBtn.addEventListener("click", () => {
      const pack = currentPack();
      if (!pack || pack.placeholder) {
        toast("Price not confirmed yet for this option.");
        return;
      }
      const qty = clampQty();
      addToCart(product, gradeSel.value, Number(packSel.value), pack, qty);
      toast(`Added ${qty} × ${product.name} (${gradeLabel(gradeSel.value)}, ${pack.weight})`);
    });

    renderPacks();
    return card;
  }

  function renderCatalogue() {
    const frag = document.createDocumentFragment();
    CFG.products.forEach(p => frag.appendChild(buildCard(p)));
    grid.appendChild(frag);
  }

  /* ---------------------------------------------------------------------------
     CART
  --------------------------------------------------------------------------- */
  function keyOf(productId, gradeId, packIdx) {
    return `${productId}|${gradeId}|${packIdx}`;
  }

  function addToCart(product, gradeId, packIdx, pack, qty) {
    const key = keyOf(product.id, gradeId, packIdx);
    const existing = cart.get(key);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
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
    qty = Math.max(1, Math.min(99, qty));
    item.qty = qty;
    renderCart();
  }

  function removeItem(key) {
    cart.delete(key);
    renderCart();
    if (cart.size === 0) toast("Order cleared");
  }

  function subtotal() {
    let s = 0;
    cart.forEach(i => { s += i.price * i.qty; });
    return s;
  }

  function totalQty() {
    let q = 0;
    cart.forEach(i => { q += i.qty; });
    return q;
  }

  const cartEmpty  = el("#cartEmpty");
  const cartFilled = el("#cartFilled");
  const cartItems  = el("#cartItems");
  const cartSubtotalEl = el("#cartSubtotal");
  const navCartCount = el("#navCartCount");

  function renderCart() {
    navCartCount.textContent = totalQty();

    if (cart.size === 0) {
      cartEmpty.hidden = false;
      cartFilled.hidden = true;
      cartItems.innerHTML = "";
      return;
    }
    cartEmpty.hidden = true;
    cartFilled.hidden = false;

    cartItems.innerHTML = "";
    cart.forEach((item, key) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      const line = item.price * item.qty;
      li.innerHTML = `
        <div class="ci-main">
          <div class="ci-name">${item.name}</div>
          <div class="ci-meta">${item.gradeLabel} · ${item.weight}</div>
          <div class="ci-unit">${fmt(item.price)} each</div>
        </div>
        <div class="ci-right">
          <div class="ci-line">${fmt(line)}</div>
          <div class="ci-controls">
            <button type="button" class="qty-btn js-ci-minus" aria-label="Decrease quantity">−</button>
            <input class="qty-input js-ci-qty" type="number" inputmode="numeric" min="1" max="99" value="${item.qty}" aria-label="Quantity for ${item.name} ${item.gradeLabel} ${item.weight}">
            <button type="button" class="qty-btn js-ci-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="ci-remove js-ci-remove" aria-label="Remove ${item.name} ${item.gradeLabel} ${item.weight}">Remove</button>
        </div>`;

      el(".js-ci-minus", li).addEventListener("click", () => setQty(key, item.qty - 1));
      el(".js-ci-plus", li).addEventListener("click", () => setQty(key, item.qty + 1));
      el(".js-ci-remove", li).addEventListener("click", () => removeItem(key));
      const qi = el(".js-ci-qty", li);
      qi.addEventListener("change", () => {
        let v = parseInt(qi.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        setQty(key, v);
      });

      cartItems.appendChild(li);
    });

    cartSubtotalEl.textContent = fmt(subtotal());
  }

  /* ---------------------------------------------------------------------------
     WHATSAPP ORDER MESSAGE
  --------------------------------------------------------------------------- */
  function buildOrderMessage() {
    const lines = [];
    lines.push(`*${CFG.brand} — New Order*`);
    lines.push("");
    let idx = 1;
    cart.forEach(item => {
      const line = item.price * item.qty;
      lines.push(`${idx}. ${item.name}`);
      lines.push(`   Grade: ${item.gradeLabel} | Pack: ${item.weight}`);
      lines.push(`   Qty: ${item.qty} × ${fmt(item.price)} = ${fmt(line)}`);
      idx++;
    });
    lines.push("");
    lines.push(`*Subtotal: ${fmt(subtotal())}*`);
    lines.push("");
    lines.push(CFG.deliveryNote);
    return lines.join("\n");
  }

  function whatsappUrl(text) {
    return `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  function placeOrder() {
    if (cart.size === 0) { toast("Add at least one item first."); return; }
    const url = whatsappUrl(buildOrderMessage());

    // Prepare fallback link
    const fallback = el("#orderFallback");
    const fallbackLink = el("#orderFallbackLink");
    fallbackLink.href = url;

    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      // popup blocked — reveal manual fallback
      fallback.hidden = false;
      toast("Pop-up blocked — use the manual link below.");
    } else {
      fallback.hidden = false; // keep fallback visible as a safety net
      toast("Opening WhatsApp… press Send to place your order.");
    }
  }

  /* ---------------------------------------------------------------------------
     UI WIRING
  --------------------------------------------------------------------------- */
  function wireStaticUI() {
    // Contact + clear + place order
    el("#contactWhatsApp").href = whatsappUrl(`Hi ${CFG.brand}, I'd like to know more about your foxnuts.`);
    el("#deliveryNote").textContent = CFG.deliveryNote;
    el("#placeOrderBtn").addEventListener("click", placeOrder);
    el("#clearCartBtn").addEventListener("click", () => { cart.clear(); renderCart(); el("#orderFallback").hidden = true; });

    // Mobile nav
    const toggle = el("#navToggle");
    const menu = el("#navMenu");
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));

    el("#year").textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------------
     TOAST
  --------------------------------------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const t = el("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------------------------------
     HERO SCROLL ANIMATION (pouch rise/rotate/settle) + reduced motion
  --------------------------------------------------------------------------- */
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
      // progress 0 (hero top at viewport top) -> 1 (hero scrolled one viewport)
      let p = (-rect.top) / vh;
      p = Math.max(0, Math.min(1, p));
      // Settle animation: as user scrolls INTO page from top, pouch is already
      // settled at p=0; create an intro by using reverse — pouch rises on load.
      const ease = p; // linear mapping fine with transitions smoothing
      // At top (p=0): fully settled. As you scroll down, gently lift & rotate out.
      const y = -ease * 40;             // drift up slightly
      const rot = ease * 8;             // small rotate
      const scale = 1 - ease * 0.06;    // subtle shrink
      const op = 1 - ease * 0.25;       // slight fade
      wrap.style.setProperty("--p-y", y.toFixed(2) + "px");
      wrap.style.setProperty("--p-rot", rot.toFixed(2) + "deg");
      wrap.style.setProperty("--p-scale", scale.toFixed(3));
      wrap.style.setProperty("--p-op", op.toFixed(3));
    }

    // Intro: pouch rises into place on load
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
    // after intro, switch to fast scrub transition
    setTimeout(() => { wrap.style.transition = "transform .15s linear, opacity .15s linear"; }, 1200);

    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  /* ---------------------------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------------------------- */
  function initReveal() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll(".reveal, .section-head, .about-copy, .about-media, .why-card");
    items.forEach(i => i.classList.add("reveal"));
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(i => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(i => io.observe(i));
  }

  /* ---------------------------------------------------------------------------
     INIT
  --------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderCatalogue();
    renderCart();
    wireStaticUI();
    initHeroAnimation();
    initReveal();
  });
})();
