const API = window.location.origin.includes('localhost') ? window.location.origin : '';
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
const money = (n) => `Rs.${Number(n || 0).toLocaleString('en-LK')}`;
let voltifySettings = { whatsappNumber: '+94700000000', freeDeliveryOver: 15000, defaultShippingCharge: 450 };

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}

function cleanPhone(phone) { return String(phone || '').replace(/[^0-9]/g, '').replace(/^0/, '94'); }
function whatsappUrl(message = 'Hi Voltify.lk, I need help with products.') {
  const phone = cleanPhone(voltifySettings.whatsappNumber || '+94700000000');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
async function loadSettings() {
  try { voltifySettings = { ...voltifySettings, ...(await api('/api/settings')) }; }
  catch (e) { console.warn(e); }
  renderWhatsappFloating();
}
function renderWhatsappFloating() {
  if (!document.body.classList.contains('site-page')) return;
  let link = qs('#whatsappFloat');
  if (!link) {
    link = document.createElement('a');
    link.id = 'whatsappFloat';
    link.className = 'whatsapp-float';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'WhatsApp';
    document.body.appendChild(link);
  }
  link.href = whatsappUrl();
}

function initTheme() {
  const saved = localStorage.getItem('voltifyTheme') || 'light';
  document.documentElement.dataset.theme = saved;
  document.body?.classList.toggle('dark-theme', saved === 'dark');
  const btn = qs('#themeToggle');
  if (btn) btn.innerHTML = `<span>${saved === 'dark' ? '🌙' : '☀️'}</span>`;
  btn?.addEventListener('click', () => {
    const next = (localStorage.getItem('voltifyTheme') || 'light') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('voltifyTheme', next);
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle('dark-theme', next === 'dark');
    btn.innerHTML = `<span>${next === 'dark' ? '🌙' : '☀️'}</span>`;
  });
}

const getCart = () => JSON.parse(localStorage.getItem('voltifyCart') || '[]');
const setCart = (cart) => { localStorage.setItem('voltifyCart', JSON.stringify(cart)); updateCartCount(); };
function updateCartCount() { qsa('[data-cart-count]').forEach((el) => { el.textContent = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0); }); }

function markImage(url, text = '') {
  return url ? `<div class="entity-mark"><img src="${url}" alt="${text}"></div>` : `<div class="entity-mark">${text || '⚡'}</div>`;
}

function priceHtml(price, discountPrice, cls = '') {
  const hasDiscount = Number(discountPrice) > 0 && Number(discountPrice) < Number(price);
  return `<div class="price ${cls}">${hasDiscount ? `<del>${money(price)}</del><strong>${money(discountPrice)}</strong>` : `<strong>${money(price)}</strong>`}</div>`;
}

function productCard(product, reason = '') {
  return `<article class="card product-card reveal">
      <div class="product-img"><img src="${product.imageUrl || '/assets/logo.png'}" alt="${product.name}"></div>
      <div class="product-meta">${product.brand} • ${product.category}</div>
      <h3>${product.name}</h3>
      <p>${product.description || 'Premium product from Voltify.lk.'}</p>
      ${reason ? `<p><small><strong>Why:</strong> ${reason}</small></p>` : ''}
      ${priceHtml(product.price, product.discountPrice)}
      <div class="row" style="margin-top:14px">
        <button class="btn small" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>Add to Cart</button>
        <a class="btn ghost small" href="/product.html?id=${product.id}">View</a>
      </div>
    </article>`;
}

window.addToCart = function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  const originalPrice = Number(product.price || 0);
  const activePrice = Number(product.discountPrice || product.price || 0);
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, brand: product.brand, category: product.category, price: activePrice, originalPrice, discountPrice: Number(product.discountPrice || 0), imageUrl: product.imageUrl, qty: 1 });
  setCart(cart);
  alert(`${product.name} added to cart`);
};

function megaImage(url, text) {
  return url ? `<span class="mega-media"><img src="${url}" alt="${text}"></span>` : `<span class="mega-media text-icon">${String(text || '⚡').slice(0, 3)}</span>`;
}
function dealCountdown(end) {
  return `<small class="deal-countdown" data-deal-end="${end || ''}">Loading deal timer...</small>`;
}
function renderMegaMenus(data) {
  qsa('[data-mega-shop]').forEach((box) => {
    const cats = (data.categories || []).slice(0, 12);
    box.innerHTML = `<div class="mega-head"><strong>Shop by category</strong><a href="/shop.html">View all</a></div><div class="mega-grid">${cats.map((c) => `<a class="mega-card" href="/shop.html?category=${encodeURIComponent(c.name)}">${megaImage(c.iconUrl, c.icon || c.name)}<span><b>${c.name}</b><small>${c.description || 'Browse products'}</small></span></a>`).join('')}</div>`;
  });
  qsa('[data-mega-brands]').forEach((box) => {
    const brands = (data.brands || []).slice(0, 12);
    box.innerHTML = `<div class="mega-head"><strong>Shop by brand</strong><a href="/#brands">View all</a></div><div class="mega-grid">${brands.map((b) => `<a class="mega-card" href="/shop.html?brand=${encodeURIComponent(b.name)}">${megaImage(b.logoUrl, b.iconText || b.name)}<span><b>${b.name}</b><small>${b.description || 'Official brand products'}</small></span></a>`).join('')}</div>`;
  });
  qsa('[data-mega-deals]').forEach((box) => {
    const deals = (data.deals || []).slice(0, 6);
    box.innerHTML = `<div class="mega-head"><strong>Live deals</strong><a href="/#deals">View deals</a></div><div class="mega-grid deals-grid">${deals.map((p) => `<a class="mega-card deal-card" href="/product.html?id=${p.id}">${megaImage(p.imageUrl, p.name)}<span><b>${p.name}</b>${priceHtml(p.price, p.discountPrice, 'mega-price')}${dealCountdown(p.dealEndsAt)}</span></a>`).join('')}</div>`;
  });
  updateDealTimers();
}
async function hydrateDropdowns() {
  try { renderMegaMenus(await api('/api/header-menu')); }
  catch (e) { console.warn(e); }
}
function updateDealTimers() {
  qsa('[data-deal-end]').forEach((el) => {
    const end = el.dataset.dealEnd ? new Date(el.dataset.dealEnd).getTime() : Date.now() + 21600000;
    const diff = Math.max(0, end - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    el.textContent = d > 0 ? `${d}d ${h}h remaining` : `${h}:${m}:${s} remaining`;
  });
}
setInterval(updateDealTimers, 1000);

function resultMini(product, reason = '') {
  return `<div class="result-mini"><img src="${product.imageUrl || '/assets/logo.png'}" alt="${product.name}"><div><strong>${product.name}</strong><br><small>${product.brand} • ${product.category}</small>${priceHtml(product.price, product.discountPrice, 'mini-price')}${reason ? `<p>${reason}</p>` : ''}<a class="btn ghost small" href="/product.html?id=${product.id}">View</a></div></div>`;
}

async function loadHome() {
  const [brands, categories] = await Promise.all([api('/api/brands'), api('/api/categories')]).catch(() => [[], []]);
  hydrateDropdowns();
  if (qs('#brandGrid')) qs('#brandGrid').innerHTML = brands.filter((b) => b.active !== false).map((b) => `<a class="card brand-card reveal" href="/shop.html?brand=${encodeURIComponent(b.name)}">${markImage(b.logoUrl, b.iconText || b.name.slice(0,2).toUpperCase())}<div><h3>${b.name}</h3><p>${b.description || 'Shop brand products'}</p></div></a>`).join('');
  if (qs('#categoryGrid')) qs('#categoryGrid').innerHTML = categories.filter((c) => c.active !== false).map((c) => `<a class="card category-card reveal" href="/shop.html?category=${encodeURIComponent(c.name)}">${markImage(c.iconUrl, c.icon || c.name.slice(0,1))}<h3>${c.name}</h3><p>${c.description || `Browse compatible ${c.name.toLowerCase()} for your devices.`}</p></a>`).join('');
  if (qs('#featuredGrid')) {
    const products = await api('/api/products?featured=true');
    qs('#featuredGrid').innerHTML = products.slice(0, 6).map((p) => productCard(p)).join('');
  }
  if (qs('#dealTimer')) startTimer();
  await initFinder();
  initAiFinder();
  initLuxuryAnimations();
}

async function initFinder() {
  if (!qs('#phoneBrand') || !qs('#phoneModel')) return;
  const devices = await api('/api/finder/devices');
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))].sort();
  const brandEl = qs('#phoneBrand'), modelEl = qs('#phoneModel');
  brandEl.innerHTML = brands.map((b) => `<option>${b}</option>`).join('') || '<option>No devices yet</option>';
  function renderModels() {
    const models = devices.filter((d) => d.brand === brandEl.value);
    modelEl.innerHTML = models.map((d) => `<option value="${d.model}">${d.model}</option>`).join('') || '<option>No models yet</option>';
  }
  brandEl.addEventListener('change', renderModels); renderModels();
  qs('#findAccessories')?.addEventListener('click', async () => {
    qs('#finderResults').innerHTML = '<p class="message">Finding compatible products...</p>';
    try {
      const data = await api(`/api/finder/search?brand=${encodeURIComponent(brandEl.value)}&model=${encodeURIComponent(modelEl.value)}`);
      const cats = (data.recommendedCategories || []).map((c) => `<span class="status">${c}</span>`).join(' ');
      const products = (data.products || []).slice(0, 4).map((p) => resultMini(p, p.reason)).join('');
      qs('#finderResults').innerHTML = `<div class="message"><strong>${data.device?.brand || brandEl.value} ${data.device?.model || modelEl.value}</strong><br>${cats}</div><div class="result-list">${products || '<p>No exact product match yet. Add compatible products or keywords from admin.</p>'}</div><a class="btn ghost small" style="margin-top:12px" href="/shop.html?search=${encodeURIComponent(`${brandEl.value} ${modelEl.value}`)}">Open shop search</a>`;
    } catch (error) { qs('#finderResults').textContent = error.message; }
  });
}

function initAiFinder() {
  if (!qs('#aiSearchBtn')) return;
  qs('#aiSearchBtn').addEventListener('click', async () => {
    const query = qs('#aiFinderInput').value.trim(); if (!query) return;
    qs('#aiFinderResults').innerHTML = '<p class="message">Voltify AI is checking products...</p>';
    try {
      const data = await api('/api/ai-search', { method: 'POST', body: JSON.stringify({ query }) });
      const products = data.products.map((p) => resultMini(p, p.reason)).join('');
      qs('#aiFinderResults').innerHTML = `<div class="message"><strong>${data.title}</strong><br>${data.summary}</div><div class="result-list">${products || '<p>No products yet. Add products with matching tags/specifications in admin.</p>'}</div>`;
    } catch (error) { qs('#aiFinderResults').textContent = error.message; }
  });
}

function initLuxuryAnimations() {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: 0.12 });
  qsa('.reveal').forEach((el) => revealObserver.observe(el));
  const showcaseObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('active', entry.intersectionRatio > 0.48)), { threshold: [0, .25, .5, .75] });
  qsa('.cinematic-product').forEach((el) => showcaseObserver.observe(el));
}

async function loadShop() {
  if (!qs('#productGrid')) return;
  const params = new URLSearchParams(location.search);
  const [brands, categories] = await Promise.all([api('/api/brands'), api('/api/categories')]); hydrateDropdowns();
  qs('#brandFilter').innerHTML += brands.filter((b) => b.active !== false).map((b) => `<option ${params.get('brand') === b.name ? 'selected' : ''}>${b.name}</option>`).join('');
  qs('#categoryFilter').innerHTML += categories.filter((c) => c.active !== false).map((c) => `<option ${params.get('category') === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
  if (params.get('search')) qs('#searchInput').value = params.get('search');
  async function render() {
    const search = qs('#searchInput').value.trim(), brand = qs('#brandFilter').value, category = qs('#categoryFilter').value;
    const query = new URLSearchParams({ ...(search && { search }), ...(brand && { brand }), ...(category && { category }), ...(params.get('newArrival') && { newArrival: params.get('newArrival') }), ...(params.get('bestSeller') && { bestSeller: params.get('bestSeller') }) });
    const products = await api(`/api/products?${query.toString()}`);
    qs('#productGrid').innerHTML = products.length ? products.map(productCard).join('') : '<div class="card"><h3>No products found</h3><p>Try another search or add products from admin panel.</p></div>';
    initLuxuryAnimations();
  }
  ['input','change'].forEach((eventName) => { qs('#searchInput').addEventListener(eventName, render); qs('#brandFilter').addEventListener(eventName, render); qs('#categoryFilter').addEventListener(eventName, render); });
  render();
}

async function loadProduct() {
  if (!qs('#productDetail')) return;
  hydrateDropdowns();
  const productId = new URLSearchParams(location.search).get('id'); if (!productId) return;
  const product = await api(`/api/products/${productId}`);
  qs('#productDetail').innerHTML = `<div class="grid two"><div class="product-img" style="height:460px"><img src="${product.imageUrl || '/assets/logo.png'}" alt="${product.name}"></div><div><div class="eyebrow">${product.brand} • ${product.category}</div><h1>${product.name}</h1><p>${product.description}</p>${priceHtml(product.price, product.discountPrice)}<p><strong>Stock:</strong> ${product.stock} available</p><p><strong>Warranty:</strong> ${product.warranty}</p><p><strong>Compatibility:</strong> ${product.compatibility}</p><p><strong>Specifications:</strong> ${product.specifications}</p><button class="btn" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>Add to Cart</button></div></div>`;
  qs('#submitReview')?.addEventListener('click', async () => {
    try { const review = await api('/api/reviews', { method: 'POST', body: JSON.stringify({ productId, customerName: qs('#reviewName').value, rating: qs('#reviewRating').value, comment: qs('#reviewText').value }) }); qs('#reviewMessage').textContent = review.message; qs('#reviewText').value = ''; }
    catch (error) { qs('#reviewMessage').textContent = error.message; }
  });
  const reviews = await api(`/api/reviews?productId=${productId}`);
  qs('#reviewList').innerHTML = reviews.length ? reviews.map((r) => `<div class="card"><strong>${'★'.repeat(r.rating)}</strong><p>${r.comment}</p><small>${r.customerName}</small></div>`).join('') : '<p>No reviews yet. Be the first to review this product.</p>';
}

function renderCart() {
  if (!qs('#cartItems')) return;
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const freeOver = Number(voltifySettings.freeDeliveryOver || 15000);
  const shipping = subtotal >= freeOver || subtotal === 0 ? 0 : Number(voltifySettings.defaultShippingCharge || 450);
  const discount = Number(localStorage.getItem('voltifyDiscount') || 0);
  const total = Math.max(0, subtotal + shipping - discount);
  qs('#cartItems').innerHTML = cart.length ? cart.map((item) => {
    const original = Number(item.originalPrice || item.price || 0);
    const active = Number(item.price || item.discountPrice || original);
    const hasDiscount = original > active;
    return `<div class="cart-item"><img src="${item.imageUrl || '/assets/logo.png'}" alt="${item.name}"><div class="cart-info"><strong>${item.name}</strong><small>${item.brand || ''} ${item.category ? '• '+item.category : ''}</small>${hasDiscount ? `<del>${money(original)}</del>` : ''}<b>${money(active)}</b></div><div class="qty-control"><button onclick="changeQty('${item.id}', -1)">−</button><span>${item.qty}</span><button onclick="changeQty('${item.id}', 1)">+</button></div><button class="btn ghost small" onclick="removeCartItem('${item.id}')">Delete</button></div>`;
  }).join('') : '<p>Your cart is empty.</p>';
  const remaining = Math.max(0, freeOver - subtotal);
  qs('#orderSummary').innerHTML = `<div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-line"><span>Shipping</span><strong>${shipping ? money(shipping) : 'Free'}</strong></div><div class="summary-line"><span>Discount</span><strong>${money(discount)}</strong></div><div class="summary-line total"><span>Total</span><strong>${money(total)}</strong></div><p>${remaining > 0 ? `Add ${money(remaining)} more for free delivery.` : 'Free delivery unlocked.'}</p>`;
  const wa = qs('#cartWhatsappBtn');
  if (wa) wa.href = whatsappUrl(`Hi Voltify.lk, I need help with my cart. Items: ${cart.map(i => `${i.name} x${i.qty}`).join(', ')}. Total: ${money(total)}`);
}
window.changeQty = function changeQty(id, delta) { const cart = getCart().map((item) => item.id === id ? { ...item, qty: Math.max(1, Number(item.qty || 1) + delta) } : item); setCart(cart); renderCart(); };
window.removeCartItem = function removeCartItem(id) { setCart(getCart().filter((item) => item.id !== id)); renderCart(); };
window.clearCart = function clearCart() { localStorage.removeItem('voltifyCart'); localStorage.removeItem('voltifyDiscount'); updateCartCount(); renderCart(); };

async function loadCart() {
  if (!qs('#cartItems')) return;
  hydrateDropdowns(); await loadSettings(); renderCart();
  qs('#clearCartBtn')?.addEventListener('click', () => { if (confirm('Clear all cart items?')) clearCart(); });
  qs('#applyCoupon')?.addEventListener('click', async () => {
    const subtotal = getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
    try { const result = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: qs('#couponCode').value, subtotal }) }); localStorage.setItem('voltifyDiscount', result.discount || 0); qs('#couponMessage').textContent = `Coupon applied. Discount: ${money(result.discount || 0)}`; renderCart(); }
    catch (error) { qs('#couponMessage').textContent = error.message; }
  });
  qs('#placeOrder')?.addEventListener('click', async () => {
    const cart = getCart(); if (!cart.length) return alert('Cart is empty');
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= Number(voltifySettings.freeDeliveryOver || 15000) ? 0 : Number(voltifySettings.defaultShippingCharge || 450);
    const discount = Number(localStorage.getItem('voltifyDiscount') || 0);
    const total = Math.max(0, subtotal + shipping - discount);
    try {
      const order = await api('/api/orders', { method: 'POST', body: JSON.stringify({ customerName: qs('#customerName').value, phone: qs('#customerPhone').value, email: qs('#customerEmail').value, district: qs('#district').value, address: qs('#customerAddress').value, paymentMethod: qs('#paymentMethod').value, items: cart, subtotal, shipping, discount, total }) });
      localStorage.removeItem('voltifyCart'); localStorage.removeItem('voltifyDiscount'); updateCartCount();
      qs('#orderSummary').innerHTML = `<strong>Order placed!</strong><br>Order ID: ${order.id}<br>Total: ${money(order.total)}<br>Status: ${order.status}`; renderCart();
    } catch (error) { alert(error.message); }
  });
}

function loadTracking() {
  if (qs('#trackBtn') || qs('#warrantyBtn')) hydrateDropdowns();
  qs('#trackBtn')?.addEventListener('click', async () => { try { const order = await api(`/api/orders/track/${encodeURIComponent(qs('#trackOrderId').value)}?phone=${encodeURIComponent(qs('#trackPhone').value)}`); qs('#trackResult').innerHTML = `<strong>${order.id}</strong><br>Status: <span class="status">${order.status}</span><br>Total: ${money(order.total)}<br>Payment: ${order.paymentMethod}`; } catch (error) { qs('#trackResult').textContent = error.message; } });
  qs('#warrantyBtn')?.addEventListener('click', async () => { try { const warranty = await api(`/api/warranty/${encodeURIComponent(qs('#warrantyOrderId').value)}`); qs('#warrantyResult').innerHTML = `<strong>${warranty.orderId}</strong><br>Status: ${warranty.status}<br>${warranty.message}`; } catch (error) { qs('#warrantyResult').textContent = error.message; } });
}

function startTimer() {
  const end = Date.now() + 1000 * 60 * 60 * 6;
  setInterval(() => { const diff = Math.max(0, end - Date.now()); const h = String(Math.floor(diff / 3600000)).padStart(2, '0'); const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'); const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'); if (qs('#dealTimer')) qs('#dealTimer').textContent = `${h}:${m}:${s}`; }, 1000);
}


// --- Voltify Pro customer accounts, gallery and invoice overrides ---
const customerToken = () => localStorage.getItem('voltifyCustomerToken') || '';
const setCustomerSession = (result) => {
  localStorage.setItem('voltifyCustomerToken', result.token);
  localStorage.setItem('voltifyCustomerUser', JSON.stringify(result.user || {}));
  refreshLoginNav();
};
function customerHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` }; }
function refreshLoginNav() {
  const link = qs('#loginNavLink');
  if (!link) return;
  const user = JSON.parse(localStorage.getItem('voltifyCustomerUser') || 'null');
  const adminUser = JSON.parse(localStorage.getItem('voltifyAdminUser') || 'null');
  if (adminUser) { link.textContent = 'Dashboard'; link.href = '/admin.html'; return; }
  if (user) { link.textContent = 'Account'; link.href = '/account.html'; return; }
  link.textContent = 'Login'; link.href = '/login.html';
}
function initLoginPage() {
  if (!qs('#loginBtn') && !qs('#registerBtn')) return;
  hydrateDropdowns();
  qs('#loginBtn')?.addEventListener('click', async () => {
    qs('#loginMessage').textContent = 'Checking login...';
    try {
      const res = await fetch(`${API}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: qs('#loginEmail').value, password: qs('#loginPassword').value }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Login failed');
      if (['admin','manager','staff'].includes(result.user.role)) {
        localStorage.setItem('voltifyAdminToken', result.token);
        localStorage.setItem('voltifyAdminUser', JSON.stringify(result.user));
        location.href = '/admin.html';
      } else {
        setCustomerSession(result);
        location.href = '/account.html';
      }
    } catch (error) { qs('#loginMessage').textContent = error.message; }
  });
  qs('#registerBtn')?.addEventListener('click', async () => {
    qs('#registerMessage').textContent = 'Creating account...';
    try {
      const res = await fetch(`${API}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: qs('#regName').value, phone: qs('#regPhone').value, email: qs('#regEmail').value, password: qs('#regPassword').value, address: qs('#regAddress').value }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Register failed');
      setCustomerSession(result);
      location.href = '/account.html';
    } catch (error) { qs('#registerMessage').textContent = error.message; }
  });
}
async function loadAccountPage() {
  if (!qs('#accountProfile')) return;
  hydrateDropdowns();
  if (!customerToken()) { location.href = '/login.html'; return; }
  try {
    const res = await fetch(`${API}/api/account`, { headers: customerHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Account failed');
    qs('#accountProfile').innerHTML = `<strong>${data.user.name}</strong><br>${data.user.email}<br>${data.user.phone || ''}`;
    qs('#accountName').value = data.user.name || '';
    qs('#accountPhone').value = data.user.phone || '';
    qs('#accountAddress').value = data.user.address || '';
    qs('#accountOrders').innerHTML = data.orders.length ? data.orders.map((o) => `<tr><td><strong>${o.id}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small></td><td>${money(o.total)}</td><td><span class="status ${String(o.status).toLowerCase()}">${o.status}</span></td><td class="invoice-actions"><a class="btn ghost small" href="/invoice.html?id=${encodeURIComponent(o.id)}">Invoice</a><a class="btn ghost small" href="/tracking.html">Track</a></td></tr>`).join('') : '<tr><td colspan="4">No orders yet.</td></tr>';
  } catch (error) {
    localStorage.removeItem('voltifyCustomerToken');
    localStorage.removeItem('voltifyCustomerUser');
    location.href = '/login.html';
  }
  qs('#saveAccountBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API}/api/account`, { method:'PUT', headers: customerHeaders(), body: JSON.stringify({ name: qs('#accountName').value, phone: qs('#accountPhone').value, address: qs('#accountAddress').value }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Save failed');
      localStorage.setItem('voltifyCustomerUser', JSON.stringify(data.user));
      qs('#accountMessage').textContent = 'Profile saved.';
      refreshLoginNav();
    } catch (error) { qs('#accountMessage').textContent = error.message; }
  });
  qs('#customerLogoutBtn')?.addEventListener('click', () => { localStorage.removeItem('voltifyCustomerToken'); localStorage.removeItem('voltifyCustomerUser'); refreshLoginNav(); location.href = '/'; });
}

function buildGallery(product) {
  const gallery = [product.imageUrl, ...(product.gallery || [])].filter(Boolean);
  const first = gallery[0] || '/assets/logo.png';
  return `<div><div class="gallery-main" id="galleryMain"><img src="${first}" alt="${product.name}"></div>${gallery.length > 1 ? `<div class="gallery-thumbs">${gallery.map((url) => `<button class="gallery-thumb" onclick="document.querySelector('#galleryMain').innerHTML='<img src=&quot;${url}&quot; alt=&quot;${product.name}&quot;>'"><img src="${url}" alt="thumb"></button>`).join('')}</div>` : ''}${product.videoUrl ? `<div class="row" style="margin-top:12px"><a class="btn ghost small" href="${product.videoUrl}" target="_blank" rel="noopener">Watch product video</a></div>` : ''}</div>`;
}
async function loadProduct() {
  if (!qs('#productDetail')) return;
  hydrateDropdowns();
  const productId = new URLSearchParams(location.search).get('id'); if (!productId) return;
  const product = await api(`/api/products/${productId}`);
  qs('#productDetail').innerHTML = `<div class="grid two">${buildGallery(product)}<div><div class="eyebrow">${product.brand} • ${product.category}</div><h1>${product.name}</h1><p>${product.description}</p>${priceHtml(product.price, product.discountPrice)}<p><strong>Stock:</strong> ${product.stock} available</p><p><strong>Warranty:</strong> ${product.warranty}</p><p><strong>Compatibility:</strong> ${product.compatibility}</p><p><strong>Specifications:</strong> ${product.specifications}</p><button class="btn primary" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>Add to Cart</button></div></div>`;
  qs('#submitReview')?.addEventListener('click', async () => {
    try { const review = await api('/api/reviews', { method: 'POST', body: JSON.stringify({ productId, customerName: qs('#reviewName').value, rating: qs('#reviewRating').value, comment: qs('#reviewText').value }) }); qs('#reviewMessage').textContent = review.message; qs('#reviewText').value = ''; }
    catch (error) { qs('#reviewMessage').textContent = error.message; }
  });
  const reviews = await api(`/api/reviews?productId=${productId}`);
  qs('#reviewList').innerHTML = reviews.length ? reviews.map((r) => `<div class="card"><strong>${'★'.repeat(r.rating)}</strong><p>${r.comment}</p><small>${r.customerName}</small></div>`).join('') : '<p>No reviews yet. Be the first to review this product.</p>';
}

async function loadCart() {
  if (!qs('#cartItems')) return;
  hydrateDropdowns(); await loadSettings(); renderCart();
  const user = JSON.parse(localStorage.getItem('voltifyCustomerUser') || 'null');
  if (user) { qs('#customerName').value = user.name || ''; qs('#customerEmail').value = user.email || ''; qs('#customerPhone').value = user.phone || ''; qs('#customerAddress').value = user.address || ''; }
  qs('#clearCartBtn')?.addEventListener('click', () => { if (confirm('Clear all cart items?')) clearCart(); });
  qs('#applyCoupon')?.addEventListener('click', async () => {
    const subtotal = getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
    try { const result = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: qs('#couponCode').value, subtotal }) }); localStorage.setItem('voltifyDiscount', result.discount || 0); qs('#couponMessage').textContent = `Coupon applied. Discount: ${money(result.discount || 0)}`; renderCart(); }
    catch (error) { qs('#couponMessage').textContent = error.message; }
  });
  qs('#placeOrder')?.addEventListener('click', async () => {
    const cart = getCart(); if (!cart.length) return alert('Cart is empty');
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= Number(voltifySettings.freeDeliveryOver || 15000) ? 0 : Number(voltifySettings.defaultShippingCharge || 450);
    const discount = Number(localStorage.getItem('voltifyDiscount') || 0);
    const total = Math.max(0, subtotal + shipping - discount);
    try {
      const headers = customerToken() ? customerHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(`${API}/api/orders`, { method:'POST', headers, body: JSON.stringify({ customerName: qs('#customerName').value, phone: qs('#customerPhone').value, email: qs('#customerEmail').value, district: qs('#district').value, address: qs('#customerAddress').value, paymentMethod: qs('#paymentMethod').value, items: cart, subtotal, shipping, discount, total }) });
      const order = await res.json(); if (!res.ok) throw new Error(order.message || 'Order failed');
      localStorage.removeItem('voltifyCart'); localStorage.removeItem('voltifyDiscount'); updateCartCount();
      qs('#orderSummary').innerHTML = `<strong>Order placed!</strong><br>Order ID: ${order.id}<br>Total: ${money(order.total)}<br>Status: ${order.status}<br><div class="row" style="margin-top:12px"><a class="btn ghost small" href="${order.invoiceUrl}">Invoice</a><a class="btn ghost small" target="_blank" href="${order.whatsappNotifyUrl}">Notify on WhatsApp</a></div>`;
      renderCart();
    } catch (error) { alert(error.message); }
  });
}
async function loadInvoicePage() {
  if (!qs('#invoiceBox')) return;
  hydrateDropdowns();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { qs('#invoiceBox').textContent = 'No order ID provided.'; return; }
  qs('#invoiceBox').innerHTML = `Invoice for <strong>${id}</strong>. Login may be required.`;
  qs('#openInvoiceBtn')?.addEventListener('click', () => {
    const token = customerToken() || localStorage.getItem('voltifyAdminToken') || '';
    if (!token) { location.href = '/login.html'; return; }
    fetch(`${API}/api/orders/${encodeURIComponent(id)}/invoice`, { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      const html = await res.text(); if (!res.ok) throw new Error(html || 'Invoice failed');
      const win = window.open('', '_blank'); win.document.write(html); win.document.close();
    }).catch((e) => qs('#invoiceBox').textContent = e.message);
  });
}

initTheme();
updateCartCount();
loadSettings();
hydrateDropdowns();
loadHome().catch(console.error);
loadShop().catch(console.error);
loadProduct().catch(console.error);
loadCart().catch(console.error);
loadTracking();
initLoginPage();
loadAccountPage().catch(console.error);
loadInvoicePage().catch(console.error);
refreshLoginNav();
initLuxuryAnimations();
