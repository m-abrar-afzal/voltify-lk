const API = window.location.origin.includes('localhost') ? window.location.origin : '';
const token = () => localStorage.getItem('voltifyAdminToken') || '';
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });
const money = (n) => `Rs.${Number(n || 0).toLocaleString('en-LK')}`;
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: options.headers || authHeaders(), ...options });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}

async function publicApi(path) {
  return api(path, { headers: { 'Content-Type': 'application/json' } });
}

async function uploadFile(inputSelector, previewSelector) {
  const file = qs(inputSelector)?.files?.[0];
  if (!file) return qs(previewSelector)?.dataset.url || '';
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: form });
  if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
  const data = await res.json();
  return data.url;
}

async function uploadFiles(inputSelector, previewSelector) {
  const input = qs(inputSelector);
  const existing = JSON.parse(qs(previewSelector)?.dataset.urls || '[]');
  const files = [...(input?.files || [])];
  if (!files.length) return existing;
  const uploaded = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: form });
    if (!res.ok) throw new Error((await res.json()).message || 'Gallery upload failed');
    uploaded.push((await res.json()).url);
  }
  return [...existing, ...uploaded];
}

function renderGalleryPreview(urls = []) {
  if (!qs('#galleryPreview')) return;
  qs('#galleryPreview').dataset.urls = JSON.stringify(urls || []);
  qs('#galleryPreview').innerHTML = urls.length ? `<div class="gallery-admin-grid">${urls.map((url) => `<img src="${url}" alt="gallery">`).join('')}</div>` : 'Gallery images preview';
}

function previewInput(inputSelector, previewSelector, fallbackText) {
  qs(inputSelector)?.addEventListener('change', () => {
    const files = [...(qs(inputSelector).files || [])];
    if (files.length > 1 && previewSelector === '#galleryPreview') {
      qs(previewSelector).innerHTML = `<div class="gallery-admin-grid">${files.map((file) => `<img src="${URL.createObjectURL(file)}" alt="preview">`).join('')}</div>`;
      return;
    }
    const file = files[0];
    if (file) qs(previewSelector).innerHTML = `<img src="${URL.createObjectURL(file)}" alt="preview">`;
    else qs(previewSelector).innerHTML = fallbackText;
  });
}

function iconCell(url, text) {
  return `<div class="icon-chip">${url ? `<img src="${url}" alt="icon">` : (text || '⚡')}</div>`;
}

async function login() {
  const btn = qs('#adminLoginBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    qs('#loginMessage').textContent = 'Checking login...';
    try {
      const result = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: qs('#adminEmail').value, password: qs('#adminPassword').value })
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message || 'Login failed');
        return r.json();
      });
      localStorage.setItem('voltifyAdminToken', result.token);
      localStorage.setItem('voltifyAdminUser', JSON.stringify(result.user));
      location.href = '/admin.html';
    } catch (error) {
      qs('#loginMessage').textContent = error.message;
    }
  });
}

async function guard() {
  if (!location.pathname.endsWith('/admin.html')) return true;
  if (!token()) { location.href = '/admin-login.html'; return false; }
  try { await api('/api/me'); return true; }
  catch { localStorage.removeItem('voltifyAdminToken'); location.href = '/admin-login.html'; return false; }
}

function tabs() {
  qsa('.side-link[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('.side-link').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      qsa('.admin-section').forEach((s) => s.classList.remove('active'));
      qs(`#tab-${btn.dataset.tab}`).classList.add('active');
      qs('#adminTitle').textContent = btn.textContent;
    });
  });
  qs('#logoutBtn')?.addEventListener('click', () => { localStorage.removeItem('voltifyAdminToken'); location.href = '/admin-login.html'; });
}

async function loadDashboard() {
  if (!qs('#statsGrid')) return;
  const stats = await api('/api/admin/stats');
  qs('#statsGrid').innerHTML = [
    ['Revenue', money(stats.revenue)], ['Orders', stats.orders], ['Products', stats.products], ['Customers', stats.customers]
  ].map(([label, value]) => `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`).join('');
  qs('#lowStockList').innerHTML = stats.lowStock.length ? stats.lowStock.map((p) => `<p><strong>${p.name}</strong><br>${p.stock} left</p>`).join('') : '<p>No low stock products.</p>';
  qs('#activityList').innerHTML = stats.activityLogs.length ? stats.activityLogs.map((l) => `<p><strong>${l.action}</strong><br>${l.details}<br><small>${new Date(l.createdAt).toLocaleString()}</small></p>`).join('') : '<p>No activity yet.</p>';
  qs('#reportRevenue') && (qs('#reportRevenue').textContent = money(stats.revenue));
  qs('#reportOrders') && (qs('#reportOrders').textContent = stats.orders);
  qs('#reportProducts') && (qs('#reportProducts').textContent = stats.products);
}

async function populateProductSelects() {
  if (!qs('#pBrand') || !qs('#pCategory')) return;
  const [brands, categories] = await Promise.all([publicApi('/api/brands'), publicApi('/api/categories')]);
  const brandCurrent = qs('#pBrand').value;
  const catCurrent = qs('#pCategory').value;
  qs('#pBrand').innerHTML = '<option value="">Select brand</option>' + brands.filter((b) => b.active !== false).map((b) => `<option>${b.name}</option>`).join('');
  qs('#pCategory').innerHTML = '<option value="">Select category</option>' + categories.filter((c) => c.active !== false).map((c) => `<option>${c.name}</option>`).join('');
  qs('#pBrand').value = brandCurrent;
  qs('#pCategory').value = catCurrent;
}

async function loadProducts() {
  if (!qs('#adminProductRows')) return;
  const products = await publicApi('/api/products');
  qs('#adminProductRows').innerHTML = products.map((p) => `<tr><td><strong>${p.name}</strong><br><small>${p.sku || ''}</small></td><td>${p.brand}</td><td>${money(p.discountPrice || p.price)}<br><small>${p.showInMenu === false ? 'Hidden from header' : 'Header #' + (p.menuOrder ?? 999)}</small></td><td>${p.stock}</td><td><button class="btn ghost small" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button> <button class="btn danger small" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`).join('');
}

window.editProduct = function editProduct(p) {
  qs('#productId').value = p.id;
  qs('#pName').value = p.name || '';
  qs('#pBrand').value = p.brand || '';
  qs('#pCategory').value = p.category || '';
  qs('#pSku').value = p.sku || '';
  qs('#pPrice').value = p.price || 0;
  qs('#pDiscount').value = p.discountPrice || 0;
  qs('#pStock').value = p.stock || 0;
  qs('#pWarranty').value = p.warranty || '';
  qs('#pDescription').value = p.description || '';
  qs('#pSpecs').value = p.specifications || '';
  qs('#pCompatibility').value = p.compatibility || '';
  qs('#pTags').value = (p.tags || []).join(', ');
  qs('#pFeatured').checked = Boolean(p.featured);
  qs('#pNew').checked = Boolean(p.newArrival);
  qs('#pBest').checked = Boolean(p.bestSeller);
  qs('#pTrending').checked = Boolean(p.trending);
  qs('#pShowMenu') && (qs('#pShowMenu').checked = p.showInMenu !== false);
  qs('#pMenuOrder') && (qs('#pMenuOrder').value = p.menuOrder ?? '');
  qs('#pDealEndsAt') && (qs('#pDealEndsAt').value = p.dealEndsAt ? new Date(p.dealEndsAt).toISOString().slice(0,16) : '');
  qs('#pVideo').value = p.videoUrl || '';
  qs('#imagePreview').innerHTML = p.imageUrl ? `<img src="${p.imageUrl}" alt="preview">` : 'Main image preview';
  qs('#imagePreview').dataset.url = p.imageUrl || '';
  renderGalleryPreview(p.gallery || []);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await api(`/api/products/${id}`, { method: 'DELETE' });
  await loadProducts();
  await loadDashboard();
};

function clearProductForm() {
  ['#productId','#pName','#pSku','#pPrice','#pDiscount','#pStock','#pWarranty','#pDescription','#pSpecs','#pCompatibility','#pTags','#pVideo'].forEach((id) => qs(id) && (qs(id).value = ''));
  ['#pBrand','#pCategory'].forEach((id) => qs(id) && (qs(id).value = ''));
  ['#pFeatured','#pNew','#pBest','#pTrending'].forEach((id) => qs(id) && (qs(id).checked = false));
  qs('#pShowMenu') && (qs('#pShowMenu').checked = true);
  qs('#pMenuOrder') && (qs('#pMenuOrder').value = '');
  qs('#pDealEndsAt') && (qs('#pDealEndsAt').value = '');
  if (qs('#imagePreview')) { qs('#imagePreview').innerHTML = 'Main image preview'; qs('#imagePreview').dataset.url = ''; }
  renderGalleryPreview([]);
  if (qs('#mainImage')) qs('#mainImage').value = '';
  if (qs('#galleryImages')) qs('#galleryImages').value = '';
}

function productForm() {
  if (!qs('#saveProductBtn')) return;
  previewInput('#mainImage', '#imagePreview', 'Main image preview');
  previewInput('#galleryImages', '#galleryPreview', 'Gallery images preview');
  qs('#clearProductBtn').addEventListener('click', clearProductForm);
  qs('#saveProductBtn').addEventListener('click', async () => {
    try {
      qs('#productMessage').textContent = 'Saving product...';
      const imageUrl = await uploadFile('#mainImage', '#imagePreview');
      const gallery = await uploadFiles('#galleryImages', '#galleryPreview');
      const body = {
        name: qs('#pName').value,
        brand: qs('#pBrand').value,
        category: qs('#pCategory').value,
        sku: qs('#pSku').value,
        price: Number(qs('#pPrice').value || 0),
        discountPrice: Number(qs('#pDiscount').value || 0),
        stock: Number(qs('#pStock').value || 0),
        warranty: qs('#pWarranty').value,
        description: qs('#pDescription').value,
        specifications: qs('#pSpecs').value,
        compatibility: qs('#pCompatibility').value,
        tags: qs('#pTags').value.split(',').map((x) => x.trim()).filter(Boolean),
        featured: qs('#pFeatured').checked,
        newArrival: qs('#pNew').checked,
        bestSeller: qs('#pBest').checked,
        trending: qs('#pTrending').checked,
        showInMenu: qs('#pShowMenu') ? qs('#pShowMenu').checked : true,
        menuOrder: Number(qs('#pMenuOrder')?.value || 999),
        dealEndsAt: qs('#pDealEndsAt')?.value ? new Date(qs('#pDealEndsAt').value).toISOString() : '',
        imageUrl,
        gallery,
        videoUrl: qs('#pVideo').value
      };
      const id = qs('#productId').value;
      await api(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      qs('#productMessage').textContent = 'Product saved successfully.';
      clearProductForm();
      await loadProducts();
      await loadDashboard();
    } catch (error) { qs('#productMessage').textContent = error.message; }
  });
}

async function loadOrders() {
  if (!qs('#orderRows')) return;
  const orders = await api('/api/orders');
  qs('#orderRows').innerHTML = orders.length ? orders.map((o) => `<tr><td><strong>${o.id}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small><br><small>${(o.items || []).length} item(s)</small></td><td>${o.customerName}<br>${o.phone}<br>${o.district}</td><td>${money(o.total)}</td><td><span class="status ${String(o.status).toLowerCase()}">${o.status}</span></td><td><select onchange="updateOrderStatus('${o.id}', this.value)"><option>${o.status}</option><option>Pending</option><option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Returned</option></select><div class="admin-actions" style="margin-top:8px"><button class="btn ghost small" onclick="printOrderDoc('${o.id}','invoice')">Invoice</button><button class="btn ghost small" onclick="printOrderDoc('${o.id}','packing')">Packing Slip</button><a class="btn ghost small" target="_blank" href="https://wa.me/${String(o.phone || '').replace(/[^0-9]/g,'').replace(/^0/,'94')}?text=${encodeURIComponent('Hi from Voltify.lk. Your order '+o.id+' is '+o.status)}">WhatsApp</a></div></td></tr>`).join('') : '<tr><td colspan="5">No orders yet.</td></tr>';
}

window.updateOrderStatus = async function updateOrderStatus(id, status) {
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  await loadOrders();
  await loadDashboard();
};

window.printOrderDoc = async function printOrderDoc(id, type = 'invoice') {
  const path = type === 'packing' ? `/api/orders/${id}/packing-slip` : `/api/orders/${id}/invoice`;
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` } });
  const html = await res.text();
  if (!res.ok) return alert(html || 'Print failed');
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

async function loadReviews() {
  if (!qs('#reviewRows')) return;
  const reviews = await publicApi('/api/reviews?status=all');
  qs('#reviewRows').innerHTML = reviews.length ? reviews.map((r) => `<tr><td>${r.customerName}</td><td>${'★'.repeat(r.rating)}</td><td>${r.comment}</td><td><span class="status ${r.status}">${r.status}</span></td><td><button class="btn small" onclick="moderateReview('${r.id}','approved')">Approve</button> <button class="btn danger small" onclick="moderateReview('${r.id}','rejected')">Reject</button></td></tr>`).join('') : '<tr><td colspan="5">No reviews yet.</td></tr>';
}

window.moderateReview = async function moderateReview(id, status) {
  await api(`/api/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  await loadReviews();
  await loadDashboard();
};

function clearBrandForm() {
  ['#brandId','#brandName','#brandIconText','#brandDescription'].forEach((id) => qs(id) && (qs(id).value = ''));
  qs('#brandActive') && (qs('#brandActive').checked = true);
  qs('#brandShowMenu') && (qs('#brandShowMenu').checked = true);
  qs('#brandMenuOrder') && (qs('#brandMenuOrder').value = '');
  qs('#brandLogoPreview') && (qs('#brandLogoPreview').innerHTML = 'Brand logo preview', qs('#brandLogoPreview').dataset.url = '');
  if (qs('#brandLogoFile')) qs('#brandLogoFile').value = '';
}

function clearCategoryForm() {
  ['#categoryId','#categoryName','#categoryIcon','#categoryDescription'].forEach((id) => qs(id) && (qs(id).value = ''));
  qs('#categoryActive') && (qs('#categoryActive').checked = true);
  qs('#categoryShowMenu') && (qs('#categoryShowMenu').checked = true);
  qs('#categoryMenuOrder') && (qs('#categoryMenuOrder').value = '');
  qs('#categoryIconPreview') && (qs('#categoryIconPreview').innerHTML = 'Category icon preview', qs('#categoryIconPreview').dataset.url = '');
  if (qs('#categoryIconFile')) qs('#categoryIconFile').value = '';
}

async function loadBrandsCategories() {
  if (!qs('#brandList')) return;
  const [brands, categories] = await Promise.all([publicApi('/api/brands'), publicApi('/api/categories')]);
  qs('#brandList').innerHTML = brands.map((b) => `<tr><td>${iconCell(b.logoUrl, b.iconText || b.name.slice(0,2).toUpperCase())}</td><td><strong>${b.name}</strong><br><small>${b.description || ''}</small><br><span class="status">${b.active === false ? 'Inactive' : 'Active'}</span> <span class="status">${b.showInMenu === false ? 'Header hidden' : 'Header #' + (b.menuOrder ?? 999)}</span></td><td><div class="admin-actions"><button class="btn ghost small" onclick='editBrand(${JSON.stringify(b).replace(/'/g, "&#39;")})'>Edit</button><button class="btn danger small" onclick="deleteBrand('${b.id}')">Delete</button></div></td></tr>`).join('');
  qs('#categoryList').innerHTML = categories.map((c) => `<tr><td>${iconCell(c.iconUrl, c.icon || c.name.slice(0,1))}</td><td><strong>${c.name}</strong><br><small>${c.description || ''}</small><br><span class="status">${c.active === false ? 'Inactive' : 'Active'}</span> <span class="status">${c.showInMenu === false ? 'Header hidden' : 'Header #' + (c.menuOrder ?? 999)}</span></td><td><div class="admin-actions"><button class="btn ghost small" onclick='editCategory(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button><button class="btn danger small" onclick="deleteCategory('${c.id}')">Delete</button></div></td></tr>`).join('');
  await populateProductSelects();
}

window.editBrand = function editBrand(b) {
  qs('#brandId').value = b.id;
  qs('#brandName').value = b.name || '';
  qs('#brandIconText').value = b.iconText || '';
  qs('#brandDescription').value = b.description || '';
  qs('#brandActive').checked = b.active !== false;
  qs('#brandShowMenu') && (qs('#brandShowMenu').checked = b.showInMenu !== false);
  qs('#brandMenuOrder') && (qs('#brandMenuOrder').value = b.menuOrder ?? '');
  qs('#brandLogoPreview').dataset.url = b.logoUrl || '';
  qs('#brandLogoPreview').innerHTML = b.logoUrl ? `<img src="${b.logoUrl}" alt="brand logo">` : 'Brand logo preview';
};

window.editCategory = function editCategory(c) {
  qs('#categoryId').value = c.id;
  qs('#categoryName').value = c.name || '';
  qs('#categoryIcon').value = c.icon || '';
  qs('#categoryDescription').value = c.description || '';
  qs('#categoryActive').checked = c.active !== false;
  qs('#categoryShowMenu') && (qs('#categoryShowMenu').checked = c.showInMenu !== false);
  qs('#categoryMenuOrder') && (qs('#categoryMenuOrder').value = c.menuOrder ?? '');
  qs('#categoryIconPreview').dataset.url = c.iconUrl || '';
  qs('#categoryIconPreview').innerHTML = c.iconUrl ? `<img src="${c.iconUrl}" alt="category icon">` : 'Category icon preview';
};

window.deleteBrand = async function deleteBrand(id) {
  if (!confirm('Delete this brand? Products using this brand will remain, but the brand card will be removed.')) return;
  await api(`/api/brands/${id}`, { method: 'DELETE' });
  await loadBrandsCategories();
};

window.deleteCategory = async function deleteCategory(id) {
  if (!confirm('Delete this category? Products using this category will remain, but the category card will be removed.')) return;
  await api(`/api/categories/${id}`, { method: 'DELETE' });
  await loadBrandsCategories();
};

function brandCategoryForms() {
  if (!qs('#saveBrandBtn')) return;
  previewInput('#brandLogoFile', '#brandLogoPreview', 'Brand logo preview');
  previewInput('#categoryIconFile', '#categoryIconPreview', 'Category icon preview');
  qs('#clearBrandBtn')?.addEventListener('click', clearBrandForm);
  qs('#clearCategoryBtn')?.addEventListener('click', clearCategoryForm);

  qs('#saveBrandBtn')?.addEventListener('click', async () => {
    try {
      qs('#brandMessage').textContent = 'Saving brand...';
      const logoUrl = await uploadFile('#brandLogoFile', '#brandLogoPreview');
      const body = { name: qs('#brandName').value, iconText: qs('#brandIconText').value, description: qs('#brandDescription').value, logoUrl, active: qs('#brandActive').checked, showInMenu: qs('#brandShowMenu') ? qs('#brandShowMenu').checked : true, menuOrder: Number(qs('#brandMenuOrder')?.value || 999) };
      const id = qs('#brandId').value;
      await api(id ? `/api/brands/${id}` : '/api/brands', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      qs('#brandMessage').textContent = 'Brand saved.';
      clearBrandForm();
      await loadBrandsCategories();
    } catch (error) { qs('#brandMessage').textContent = error.message; }
  });

  qs('#saveCategoryBtn')?.addEventListener('click', async () => {
    try {
      qs('#categoryMessage').textContent = 'Saving category...';
      const iconUrl = await uploadFile('#categoryIconFile', '#categoryIconPreview');
      const body = { name: qs('#categoryName').value, icon: qs('#categoryIcon').value, description: qs('#categoryDescription').value, iconUrl, active: qs('#categoryActive').checked, showInMenu: qs('#categoryShowMenu') ? qs('#categoryShowMenu').checked : true, menuOrder: Number(qs('#categoryMenuOrder')?.value || 999) };
      const id = qs('#categoryId').value;
      await api(id ? `/api/categories/${id}` : '/api/categories', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      qs('#categoryMessage').textContent = 'Category saved.';
      clearCategoryForm();
      await loadBrandsCategories();
    } catch (error) { qs('#categoryMessage').textContent = error.message; }
  });
}

function clearDeviceForm() {
  ['#deviceId','#deviceBrand','#deviceModel','#deviceCategories','#deviceKeywords','#deviceNotes'].forEach((id) => qs(id) && (qs(id).value = ''));
}

async function loadDevices() {
  if (!qs('#deviceRows')) return;
  const devices = await publicApi('/api/finder/devices');
  qs('#deviceRows').innerHTML = devices.map((d) => `<tr><td><strong>${d.brand}</strong><br>${d.model}<br><small>${(d.keywords || []).join(', ')}</small></td><td>${(d.categories || []).map((c) => `<span class="status">${c}</span>`).join(' ')}</td><td><div class="admin-actions"><button class="btn ghost small" onclick='editDevice(${JSON.stringify(d).replace(/'/g, "&#39;")})'>Edit</button><button class="btn danger small" onclick="deleteDevice('${d.id}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="3">No devices yet.</td></tr>';
}

window.editDevice = function editDevice(d) {
  qs('#deviceId').value = d.id;
  qs('#deviceBrand').value = d.brand || '';
  qs('#deviceModel').value = d.model || '';
  qs('#deviceCategories').value = (d.categories || []).join(', ');
  qs('#deviceKeywords').value = (d.keywords || []).join(', ');
  qs('#deviceNotes').value = d.notes || '';
};

window.deleteDevice = async function deleteDevice(id) {
  if (!confirm('Delete this finder device?')) return;
  await api(`/api/finder/devices/${id}`, { method: 'DELETE' });
  await loadDevices();
};

function finderForms() {
  if (!qs('#saveDeviceBtn')) return;
  qs('#clearDeviceBtn')?.addEventListener('click', clearDeviceForm);
  qs('#saveDeviceBtn')?.addEventListener('click', async () => {
    try {
      qs('#deviceMessage').textContent = 'Saving device...';
      const body = {
        brand: qs('#deviceBrand').value,
        model: qs('#deviceModel').value,
        categories: qs('#deviceCategories').value.split(',').map((x) => x.trim()).filter(Boolean),
        keywords: qs('#deviceKeywords').value.split(',').map((x) => x.trim()).filter(Boolean),
        notes: qs('#deviceNotes').value
      };
      const id = qs('#deviceId').value;
      await api(id ? `/api/finder/devices/${id}` : '/api/finder/devices', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      qs('#deviceMessage').textContent = 'Device saved.';
      clearDeviceForm();
      await loadDevices();
    } catch (error) { qs('#deviceMessage').textContent = error.message; }
  });
}

async function loadSuppliers() {
  if (!qs('#supplierList')) return;
  const suppliers = await api('/api/suppliers');
  qs('#supplierList').innerHTML = suppliers.map((s) => `<div class="card" style="margin-bottom:10px"><strong>${s.name}</strong><p>${s.contactPerson || ''} ${s.phone || ''}<br>${s.email || ''}<br>${s.notes || ''}</p></div>`).join('');
}

function supplierForm() {
  qs('#addSupplierBtn')?.addEventListener('click', async () => {
    await api('/api/suppliers', { method: 'POST', body: JSON.stringify({
      name: qs('#supName').value,
      contactPerson: qs('#supContact').value,
      phone: qs('#supPhone').value,
      email: qs('#supEmail').value,
      address: qs('#supAddress').value,
      notes: qs('#supNotes').value
    }) });
    ['#supName','#supContact','#supPhone','#supEmail','#supAddress','#supNotes'].forEach((id) => qs(id).value = '');
    await loadSuppliers();
  });
}

async function settings() {
  if (!qs('#saveSettingsBtn')) return;
  const current = await publicApi('/api/settings');
  qs('#settingWhatsapp').value = current.whatsappNumber || '';
  qs('#settingNotifyEmail') && (qs('#settingNotifyEmail').value = current.notificationEmail || '');
  qs('#settingFreeDelivery').value = current.freeDeliveryOver || 0;
  qs('#settingShipping').value = current.defaultShippingCharge || 0;
  qs('#settingInvoicePrefix') && (qs('#settingInvoicePrefix').value = current.invoicePrefix || 'VTF');
  qs('#settingCOD').checked = Boolean(current.codEnabled);
  qs('#settingPayHere').checked = Boolean(current.payhereEnabled);
  qs('#settingEmailNotify') && (qs('#settingEmailNotify').checked = Boolean(current.emailNotificationsEnabled));
  qs('#settingWhatsappNotify') && (qs('#settingWhatsappNotify').checked = current.whatsappNotificationsEnabled !== false);
  qs('#saveSettingsBtn').addEventListener('click', async () => {
    await api('/api/settings', { method: 'PUT', body: JSON.stringify({
      whatsappNumber: qs('#settingWhatsapp').value,
      notificationEmail: qs('#settingNotifyEmail')?.value || '',
      freeDeliveryOver: Number(qs('#settingFreeDelivery').value || 0),
      defaultShippingCharge: Number(qs('#settingShipping').value || 0),
      invoicePrefix: qs('#settingInvoicePrefix')?.value || 'VTF',
      codEnabled: qs('#settingCOD').checked,
      payhereEnabled: qs('#settingPayHere').checked,
      emailNotificationsEnabled: Boolean(qs('#settingEmailNotify')?.checked),
      whatsappNotificationsEnabled: qs('#settingWhatsappNotify') ? qs('#settingWhatsappNotify').checked : true
    }) });
    qs('#settingsMessage').textContent = 'Settings saved.';
  });
}

function exportCsv() {
  qs('#exportCsvBtn')?.addEventListener('click', async () => {
    const [products, orders] = await Promise.all([publicApi('/api/products'), api('/api/orders')]);
    const lines = ['type,id,name,total,status'];
    products.forEach((p) => lines.push(`product,${p.id},"${p.name}",${p.discountPrice || p.price},stock:${p.stock}`));
    orders.forEach((o) => lines.push(`order,${o.id},"${o.customerName}",${o.total},${o.status}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'voltify-report.csv';
    a.click();
  });
}


async function loadNotifications() {
  if (!qs('#notificationList')) return;
  const notes = await api('/api/notifications');
  qs('#notificationList').innerHTML = notes.length ? notes.map((n) => `<div class="notification-item"><strong>${n.title}</strong><p>${n.message}</p><small>${n.type} • ${new Date(n.createdAt).toLocaleString()}</small></div>`).join('') : '<p>No notifications yet.</p>';
}

async function initAdmin() {
  login();
  if (!(await guard())) return;
  tabs();
  productForm();
  brandCategoryForms();
  finderForms();
  supplierForm();
  exportCsv();
  await Promise.all([loadDashboard(), populateProductSelects(), loadProducts(), loadOrders(), loadReviews(), loadBrandsCategories(), loadDevices(), loadSuppliers(), loadNotifications(), settings()]);
}

initAdmin().catch((error) => {
  console.error(error);
  if (qs('.admin-main')) alert(error.message);
});
