/* The Cat Caddy — lightweight cart + checkout handoff.
 * The site is static, so payment happens on a hosted checkout.
 * To go live, fill in ONE of the checkout options in STORE_CONFIG below.
 */
const STORE_CONFIG = {
  product: {
    id: 'cat-caddy',
    name: 'The Cat Caddy™',
    variant: 'Royal Purple / Chrome',
    price: 249.00,            // TODO(Will): confirm launch price
    maxQty: 5,
    url: 'the-cat-caddy.html',
  },
  // Option A — Shopify: cart permalink https://{shopifyDomain}/cart/{variantId}:{qty}
  shopifyDomain: '',          // e.g. 'thecatcaddy.myshopify.com'
  shopifyVariantId: '',       // numeric variant ID
  // Option B — Stripe Payment Link (enable "adjustable quantity" on the link)
  stripePaymentLink: '',      // e.g. 'https://buy.stripe.com/xxxx'
};

const CART_KEY = 'catcaddy_cart_v1';
const money = n => '$' + n.toFixed(2).replace(/\.00$/, '');

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
}
let memoryCart = readCart();
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(memoryCart)); } catch (e) { /* private mode: keep in memory */ }
  render();
}
function qtyInCart() { return memoryCart[STORE_CONFIG.product.id] || 0; }
function setQty(q) {
  const p = STORE_CONFIG.product;
  q = Math.max(0, Math.min(p.maxQty, parseInt(q, 10) || 0));
  if (q === 0) delete memoryCart[p.id]; else memoryCart[p.id] = q;
  saveCart();
}
function addToCart(q) { setQty(qtyInCart() + q); openDrawer(); }

function checkoutUrl(q) {
  const c = STORE_CONFIG;
  if (c.shopifyDomain && c.shopifyVariantId) return `https://${c.shopifyDomain}/cart/${c.shopifyVariantId}:${q}`;
  if (c.stripePaymentLink) return c.stripePaymentLink;
  return '';
}
function checkout(msgEl) {
  const url = checkoutUrl(qtyInCart());
  if (url) { window.location.href = url; return; }
  if (msgEl) {
    msgEl.innerHTML = `Checkout opens shortly. Leave your email and we’ll hold your spot in the first run.
      <form class="signup" data-signup action="https://formspree.io/f/xwpkjkpb" method="POST" style="margin-top:.75rem">
        <input type="hidden" name="_subject" value="Cat Caddy reservation (${qtyInCart()} units)">
        <input type="hidden" name="quantity" value="${qtyInCart()}">
        <input type="email" name="email" placeholder="Your email" aria-label="Email" required>
        <button type="submit" class="btn-primary">Hold Mine</button>
      </form>`;
    msgEl.classList.add('show');
  }
}

/* ---------- cart markup (drawer + cart page share it) ---------- */
function cartItemsHTML() {
  const p = STORE_CONFIG.product, q = qtyInCart();
  if (!q) {
    return `<div class="cart-empty"><p>Your cart is empty.</p>
      <a class="btn-secondary" href="${p.url}">Shop The Cat Caddy</a></div>`;
  }
  return `<div class="line-item">
      <div class="ph ph-square" data-label="Image"></div>
      <div>
        <h3>${p.name}</h3>
        <div class="li-meta">${p.variant}</div>
        <div class="qty" role="group" aria-label="Quantity">
          <button type="button" data-cart-dec aria-label="Decrease quantity">&minus;</button>
          <input type="number" value="${q}" min="1" max="${p.maxQty}" data-cart-qty aria-label="Quantity">
          <button type="button" data-cart-inc aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="li-remove" data-cart-remove>Remove</button>
      </div>
      <div class="li-price">${money(p.price * q)}</div>
    </div>`;
}
function totalsHTML() {
  const q = qtyInCart(), sub = STORE_CONFIG.product.price * q;
  if (!q) return '';
  return `<p class="ship-progress">&#10003; Free US shipping included</p>
    <div class="totals"><span>Subtotal</span><span>${money(sub)}</span></div>
    <div class="totals"><span>Shipping</span><span>Free</span></div>
    <div class="totals"><span>Tax</span><span>Calculated at checkout</span></div>
    <div class="totals grand"><span>Total</span><span>${money(sub)}</span></div>
    <button type="button" class="btn-primary btn-block" data-checkout>Secure Checkout</button>
    <p class="checkout-msg" data-checkout-msg role="status"></p>
    <p class="secure">&#128274; Encrypted checkout &middot; Shop Pay, Apple Pay &amp; cards</p>`;
}

function injectDrawer() {
  if (document.querySelector('.drawer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="drawer-overlay" data-drawer-close></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">
      <div class="drawer-head"><h2 id="drawer-title">Your Cart</h2>
        <button type="button" class="drawer-close" data-drawer-close aria-label="Close cart">&times;</button></div>
      <div class="drawer-body" data-cart-items></div>
      <div class="drawer-foot" data-cart-totals></div>
    </aside>`);
}
function openDrawer() {
  if (document.body.dataset.page === 'cart') return;
  document.querySelector('.drawer').classList.add('open');
  document.querySelector('.drawer').setAttribute('aria-hidden', 'false');
  document.querySelector('.drawer-overlay').classList.add('open');
  document.querySelector('.drawer-close').focus();
}
function closeDrawer() {
  document.querySelector('.drawer').classList.remove('open');
  document.querySelector('.drawer').setAttribute('aria-hidden', 'true');
  document.querySelector('.drawer-overlay').classList.remove('open');
}

function render() {
  const q = qtyInCart();
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = q; });
  document.querySelectorAll('[data-cart-items]').forEach(el => { el.innerHTML = cartItemsHTML(); });
  document.querySelectorAll('[data-cart-totals]').forEach(el => { el.innerHTML = totalsHTML(); });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-open-cart],[data-drawer-close],[data-cart-inc],[data-cart-dec],[data-cart-remove],[data-checkout],[data-add-to-cart],[data-pdp-inc],[data-pdp-dec]');
  if (!t) return;
  if (t.matches('[data-open-cart]')) { e.preventDefault(); openDrawer(); }
  else if (t.matches('[data-drawer-close]')) closeDrawer();
  else if (t.matches('[data-cart-inc]')) setQty(qtyInCart() + 1);
  else if (t.matches('[data-cart-dec]')) setQty(Math.max(1, qtyInCart() - 1));
  else if (t.matches('[data-cart-remove]')) setQty(0);
  else if (t.matches('[data-checkout]')) checkout(t.parentElement.querySelector('[data-checkout-msg]'));
  else if (t.matches('[data-add-to-cart]')) {
    const input = document.querySelector('[data-pdp-qty]');
    addToCart(input ? parseInt(input.value, 10) || 1 : 1);
  }
  else if (t.matches('[data-pdp-inc],[data-pdp-dec]')) {
    const input = document.querySelector('[data-pdp-qty]');
    const v = (parseInt(input.value, 10) || 1) + (t.matches('[data-pdp-inc]') ? 1 : -1);
    input.value = Math.max(1, Math.min(STORE_CONFIG.product.maxQty, v));
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-cart-qty]')) setQty(Math.max(1, parseInt(e.target.value, 10) || 1));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

/* gallery placeholder thumbs */
document.addEventListener('click', e => {
  const th = e.target.closest('.gallery-thumbs .ph');
  if (!th) return;
  document.querySelectorAll('.gallery-thumbs .ph').forEach(x => x.classList.remove('active'));
  th.classList.add('active');
  const main = document.querySelector('.gallery-main .ph');
  if (main) main.dataset.label = th.dataset.full || th.dataset.label;
});

/* sticky add-to-cart once the buy box scrolls away */
function initStickyAtc() {
  const bar = document.querySelector('.sticky-atc'), box = document.querySelector('[data-buybox-atc]');
  if (!bar || !box || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([en]) => {
    bar.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0);
  }).observe(box);
}

/* email capture (Formspree) — show inline confirmation instead of redirect */
document.addEventListener('submit', async e => {
  const f = e.target;
  if (!f.matches('[data-signup]')) return;
  e.preventDefault();
  const btn = f.querySelector('button');
  btn.disabled = true;
  try {
    const r = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
    f.innerHTML = r.ok
      ? '<p style="color:var(--gold);width:100%;text-align:center">You’re on the list. We’ll email you when The Cat Caddy ships.</p>'
      : '<p style="width:100%;text-align:center">Something went wrong. Please try again.</p>';
  } catch (err) { btn.disabled = false; }
});

injectDrawer();
render();
initStickyAtc();
