try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not loaded; using hosting environment variables.');
}


const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'voltify-dev-secret';

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const FRONTEND_DIR = path.join(ROOT, '..', 'frontend');

if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const now = () => new Date().toISOString();

const seedBrands = () => [
  { id: 'b-apple', name: 'Apple', iconText: 'AP', logoUrl: '', description: 'Premium Apple compatible accessories', active: true },
  { id: 'b-samsung', name: 'Samsung', iconText: 'SM', logoUrl: '', description: 'Samsung charging and protection essentials', active: true },
  { id: 'b-baseus', name: 'Baseus', iconText: 'BS', logoUrl: '', description: 'Fast charging and travel accessories', active: true },
  { id: 'b-anker', name: 'Anker', iconText: 'AK', logoUrl: '', description: 'Power banks and charging solutions', active: true },
  { id: 'b-ugreen', name: 'UGREEN', iconText: 'UG', logoUrl: '', description: 'Cables, adapters and hubs', active: true },
  { id: 'b-jbl', name: 'JBL', iconText: 'JB', logoUrl: '', description: 'Audio accessories', active: true },
  { id: 'b-remax', name: 'Remax', iconText: 'RX', logoUrl: '', description: 'Affordable mobile accessories', active: true },
  { id: 'b-joyroom', name: 'Joyroom', iconText: 'JR', logoUrl: '', description: 'Chargers, cables and audio accessories', active: true },
  { id: 'b-oraimo', name: 'Oraimo', iconText: 'OR', logoUrl: '', description: 'Power, audio and smart wearables', active: true },
  { id: 'b-nothing', name: 'Nothing', iconText: 'NO', logoUrl: '', description: 'Minimal tech accessories', active: true },
  { id: 'b-hoco', name: 'Hoco', iconText: 'HC', logoUrl: '', description: 'Mobile accessories and chargers', active: true },
  { id: 'b-ldnio', name: 'LDNIO', iconText: 'LD', logoUrl: '', description: 'Chargers and power strips', active: true },
  { id: 'b-xo', name: 'XO', iconText: 'XO', logoUrl: '', description: 'Cables and charging accessories', active: true },
  { id: 'b-xiaomi', name: 'Xiaomi', iconText: 'MI', logoUrl: '', description: 'Smart electronics and accessories', active: true },
  { id: 'b-awei', name: 'Awei', iconText: 'AW', logoUrl: '', description: 'Audio and mobile accessories', active: true }
];

const seedCategories = () => [
  { id: 'c-power-banks', name: 'Power Banks', icon: '🔋', iconUrl: '', description: 'Portable power for phones, tablets and laptops.', active: true },
  { id: 'c-earbuds', name: 'Earbuds', icon: '🎧', iconUrl: '', description: 'Wireless audio, ANC earbuds and gaming earbuds.', active: true },
  { id: 'c-airpods', name: 'AirPods', icon: '◖◗', iconUrl: '', description: 'AirPods and AirPods compatible accessories.', active: true },
  { id: 'c-chargers', name: 'Chargers', icon: '⚡', iconUrl: '', description: 'PD, GaN, wireless and wall chargers.', active: true },
  { id: 'c-cables', name: 'Charging Cables', icon: '⌁', iconUrl: '', description: 'USB-C, Lightning, Type-C and fast charging cables.', active: true },
  { id: 'c-cases', name: 'Phone Cases', icon: '🛡️', iconUrl: '', description: 'Protection cases and MagSafe compatible cases.', active: true },
  { id: 'c-wireless', name: 'Wireless Chargers', icon: '◎', iconUrl: '', description: 'Qi and MagSafe style wireless charging.', active: true },
  { id: 'c-smart-watches', name: 'Smart Watches', icon: '⌚', iconUrl: '', description: 'Wearables for fitness, calls and daily use.', active: true },
  { id: 'c-laptop-accessories', name: 'Laptop Accessories', icon: '💻', iconUrl: '', description: 'Hubs, adapters, sleeves and laptop chargers.', active: true }
];

const seedDevices = () => [
  { id: 'd-iphone-15', brand: 'Apple', model: 'iPhone 15', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables', 'Wireless Chargers'], keywords: ['iPhone 15', 'USB-C', 'MagSafe', '20W', 'Apple'], notes: '', createdAt: now() },
  { id: 'd-iphone-15-pro-max', brand: 'Apple', model: 'iPhone 15 Pro Max', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables', 'Wireless Chargers'], keywords: ['iPhone 15 Pro Max', 'USB-C', 'MagSafe', '20W', 'Apple'], notes: '', createdAt: now() },
  { id: 'd-iphone-14', brand: 'Apple', model: 'iPhone 14', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables', 'Wireless Chargers'], keywords: ['iPhone 14', 'Lightning', 'MagSafe', '20W', 'Apple'], notes: '', createdAt: now() },
  { id: 'd-galaxy-s24', brand: 'Samsung', model: 'Galaxy S24', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables', 'Wireless Chargers'], keywords: ['Galaxy S24', 'Samsung', 'USB-C', '25W', 'PD'], notes: '', createdAt: now() },
  { id: 'd-galaxy-s24-ultra', brand: 'Samsung', model: 'Galaxy S24 Ultra', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables'], keywords: ['Galaxy S24 Ultra', 'Samsung', 'USB-C', '45W', 'PD'], notes: '', createdAt: now() },
  { id: 'd-redmi-note-13', brand: 'Xiaomi', model: 'Redmi Note 13', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables'], keywords: ['Redmi Note 13', 'Xiaomi', 'USB-C', 'fast charging'], notes: '', createdAt: now() },
  { id: 'd-nothing-phone-2', brand: 'Nothing', model: 'Phone 2', categories: ['Chargers', 'Phone Cases', 'Power Banks', 'Screen Protectors', 'Charging Cables'], keywords: ['Nothing Phone 2', 'USB-C', 'PD', 'wireless charging'], notes: '', createdAt: now() },
  { id: 'd-macbook-air-m1', brand: 'Apple', model: 'MacBook Air M1', categories: ['Power Banks', 'Chargers', 'Charging Cables', 'Laptop Accessories'], keywords: ['MacBook Air M1', 'laptop', 'USB-C PD', '45W', '65W', '100W'], notes: 'Useful for AI search when users ask for laptop charging power banks.', createdAt: now() }
];

const seedProducts = () => [
  {
    id: 'p-1001', name: 'Baseus 20W USB-C Fast Charger', brand: 'Baseus', category: 'Chargers', price: 5490, discountPrice: 4990, stock: 18, sku: 'VTF-CHG-20W-001', warranty: '6 months',
    description: 'Compact fast charger suitable for modern USB-C devices. Add your real product images from the admin panel.',
    specifications: '20W output, USB-C port, compact body, Sri Lanka plug variant where available.',
    compatibility: 'iPhone 15, iPhone 14 with USB-C/Lightning cable, Samsung, Xiaomi, Nothing and USB-C supported devices.',
    tags: ['fast-charging', 'usb-c', 'iphone', 'samsung', '20w'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: true, bestSeller: false, trending: true, createdAt: now()
  },
  {
    id: 'p-1002', name: 'MagSafe Compatible Clear Case', brand: 'Apple', category: 'Phone Cases', price: 3990, discountPrice: 3490, stock: 9, sku: 'VTF-CASE-MAG-001', warranty: '7 days checking warranty',
    description: 'Premium protection case placeholder listing. Replace with your real stock details.',
    specifications: 'Clear finish, raised edges, MagSafe compatible ring.', compatibility: 'Select iPhone models. Add exact model compatibility in admin.', tags: ['case', 'magsafe', 'iphone 15', 'iphone 14'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: false, bestSeller: true, trending: false, createdAt: now()
  },
  {
    id: 'p-1003', name: 'Anker 10000mAh Slim Power Bank', brand: 'Anker', category: 'Power Banks', price: 11990, discountPrice: 10990, stock: 6, sku: 'VTF-PB-10K-001', warranty: '1 year',
    description: 'Slim daily carry power bank for phones, earbuds and travel.', specifications: '10000mAh capacity, USB-C input/output, LED indicator.', compatibility: 'Phones, earbuds and USB-powered accessories.', tags: ['power-bank', 'travel', 'phone', 'usb-c'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: true, bestSeller: true, trending: true, createdAt: now()
  },
  {
    id: 'p-1004', name: 'UGREEN 20000mAh 65W Laptop Power Bank', brand: 'UGREEN', category: 'Power Banks', price: 28990, discountPrice: 26990, stock: 5, sku: 'VTF-PB-65W-001', warranty: '1 year',
    description: 'High capacity USB-C PD power bank designed for phones and many USB-C laptops.', specifications: '20000mAh, 65W USB-C PD, multi-port output, laptop and phone charging support.', compatibility: 'MacBook Air M1, USB-C laptops, iPhone 15, Samsung Galaxy, Xiaomi, Nothing devices.', tags: ['power-bank', 'laptop', 'macbook', 'phone', '65w', 'usb-c pd', 'multi device'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: true, bestSeller: true, trending: true, createdAt: now()
  },
  {
    id: 'p-1005', name: 'JBL Tune Wireless Earbuds', brand: 'JBL', category: 'Earbuds', price: 18990, discountPrice: 16990, stock: 8, sku: 'VTF-AUD-JBL-001', warranty: '1 year',
    description: 'Wireless earbuds placeholder with premium audio positioning.', specifications: 'Wireless audio, touch controls, charging case, long battery life.', compatibility: 'Bluetooth smartphones, tablets and laptops.', tags: ['earbuds', 'bluetooth', 'audio', 'jbl'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: false, bestSeller: true, trending: true, createdAt: now()
  },
  {
    id: 'p-1006', name: 'Xiaomi Smart Watch Active', brand: 'Xiaomi', category: 'Smart Watches', price: 22990, discountPrice: 20990, stock: 7, sku: 'VTF-WATCH-MI-001', warranty: '1 year',
    description: 'Smart watch placeholder for fitness, call and notification use cases.', specifications: 'Large display, fitness tracking, call notifications, long battery.', compatibility: 'Android and iOS smartphones.', tags: ['smart watch', 'wearable', 'fitness', 'xiaomi'], imageUrl: '/assets/logo.png', gallery: [], videoUrl: '', featured: true, newArrival: true, bestSeller: false, trending: true, createdAt: now()
  }
];

const defaultDb = () => ({
  users: [{ id: 'u-admin', name: 'Voltify Admin', email: process.env.ADMIN_EMAIL || 'admin@voltify.lk', passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@12345', 10), role: 'admin', createdAt: now() }],
  brands: seedBrands(),
  categories: seedCategories(),
  devices: seedDevices(),
  products: seedProducts(),
  reviews: [], orders: [],
  coupons: [
    { code: 'VOLTIFY500', type: 'fixed', value: 500, minimumSpend: 5000, active: true },
    { code: 'BLUE10', type: 'percentage', value: 10, minimumSpend: 10000, active: true },
    { code: 'FREESHIP', type: 'shipping', value: 0, minimumSpend: 15000, active: true }
  ],
  suppliers: [{ id: 's-1', name: 'Main Supplier', contactPerson: '', phone: '', email: '', address: '', notes: 'Replace with real supplier details.', createdAt: now() }],
  settings: { freeDeliveryOver: 15000, defaultShippingCharge: 450, payhereEnabled: false, codEnabled: true, whatsappNumber: '+94700000000', notificationEmail: 'orders@voltify.lk', emailNotificationsEnabled: false, whatsappNotificationsEnabled: true, invoicePrefix: 'VTF' },
  notifications: [],
  activityLogs: []
});

function writeDb(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function mergeMissingById(current = [], seed = []) {
  const ids = new Set(current.map((x) => x.id));
  return [...current, ...seed.filter((x) => !ids.has(x.id))];
}
function ensureDbShape(db) {
  const seed = defaultDb();
  db.users = db.users || seed.users;
  db.brands = mergeMissingById(db.brands || [], seed.brands).map((b, i) => ({ iconText: b.name?.slice(0, 2).toUpperCase(), logoUrl: '', active: true, showInMenu: true, menuOrder: i + 1, ...b }));
  db.categories = mergeMissingById(db.categories || [], seed.categories).map((c, i) => ({ icon: c.name?.slice(0, 1), iconUrl: '', active: true, showInMenu: true, menuOrder: i + 1, ...c }));
  db.devices = mergeMissingById(db.devices || [], seed.devices);
  db.products = mergeMissingById(db.products || [], seed.products).map((p, i) => ({ showInMenu: true, menuOrder: i + 1, dealEndsAt: '', gallery: [], videoUrl: '', ...p }));
  db.reviews = db.reviews || [];
  db.orders = db.orders || [];
  db.notifications = db.notifications || [];
  db.coupons = db.coupons || seed.coupons;
  db.suppliers = db.suppliers || seed.suppliers;
  db.settings = { ...seed.settings, ...(db.settings || {}) };
  db.activityLogs = db.activityLogs || [];
  return db;
}
function readDb() {
  if (!fs.existsSync(DATA_FILE)) writeDb(defaultDb());
  const db = ensureDbShape(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  writeDb(db);
  return db;
}
function id(prefix) { return `${prefix}-${crypto.randomBytes(5).toString('hex')}`; }
function logActivity(actor, action, details = '') {
  const db = readDb();
  db.activityLogs.unshift({ id: id('log'), actor: actor?.email || 'system', action, details, createdAt: now() });
  db.activityLogs = db.activityLogs.slice(0, 100);
  writeDb(db);
}

function addNotification(db, type, title, message, meta = {}) {
  db.notifications = db.notifications || [];
  const note = { id: id('note'), type, title, message, meta, read: false, createdAt: now() };
  db.notifications.unshift(note);
  db.notifications = db.notifications.slice(0, 250);
  return note;
}

function orderInvoiceHtml(order, db, type = 'invoice') {
  const isPacking = type === 'packing';
  const rows = (order.items || []).map((item) => `<tr><td>${item.name}<br><small>${item.brand || ''} ${item.category || ''}</small></td><td>${item.qty}</td>${isPacking ? '' : `<td>Rs.${Number(item.price || 0).toLocaleString('en-LK')}</td><td>Rs.${(Number(item.price || 0) * Number(item.qty || 0)).toLocaleString('en-LK')}</td>`}</tr>`).join('');
  const title = isPacking ? 'Packing Slip' : 'Invoice';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title} ${order.id}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:36px}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #0ea5e9;padding-bottom:20px}.brand{font-size:28px;font-weight:900}.blue{color:#0077ff}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #e2e8f0;text-align:left;padding:12px}th{background:#f1f5f9}.total{margin-left:auto;width:320px;margin-top:24px}.line{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}.grand{font-size:22px;font-weight:900;color:#0077ff}.print{position:fixed;right:18px;top:18px;padding:10px 16px;border:0;border-radius:999px;background:#0077ff;color:white;font-weight:800}@media print{.print{display:none}}</style></head><body><button class="print" onclick="window.print()">Print / Save PDF</button><div class="top"><div><div class="brand">VOLTIFY<span class="blue">.LK</span></div><div>Powering the Future</div><div>WhatsApp: ${db.settings.whatsappNumber || ''}</div></div><div><h1>${title}</h1><strong>${order.id}</strong><br>${new Date(order.createdAt).toLocaleString()}<br>Status: ${order.status}</div></div><h3>Customer</h3><p><strong>${order.customerName || ''}</strong><br>${order.phone || ''}<br>${order.email || ''}<br>${order.address || ''}<br>${order.district || ''}</p><table><thead><tr><th>Item</th><th>Qty</th>${isPacking ? '' : '<th>Price</th><th>Total</th>'}</tr></thead><tbody>${rows}</tbody></table>${isPacking ? '<p><strong>Pack carefully and verify quantities before dispatch.</strong></p>' : `<div class="total"><div class="line"><span>Subtotal</span><strong>Rs.${Number(order.subtotal || 0).toLocaleString('en-LK')}</strong></div><div class="line"><span>Shipping</span><strong>Rs.${Number(order.shipping || 0).toLocaleString('en-LK')}</strong></div><div class="line"><span>Discount</span><strong>Rs.${Number(order.discount || 0).toLocaleString('en-LK')}</strong></div><div class="line grand"><span>Total</span><strong>Rs.${Number(order.total || 0).toLocaleString('en-LK')}</strong></div></div>`}</body></html>`;
}

function makeToken(user) { return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' }); }
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Login required.' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) return res.status(403).json({ message: 'You do not have permission.' });
      req.user = payload;
      next();
    } catch (error) { return res.status(401).json({ message: 'Invalid or expired token.' }); }
  };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only images and short videos are allowed.'));
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(FRONTEND_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Voltify.lk API' }));
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) return res.status(401).json({ message: 'Invalid email or password.' });
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: makeToken(user), user: safeUser });
});
app.get('/api/me', auth(), (req, res) => res.json({ user: req.user }));

app.post('/api/auth/register', (req, res) => {
  const db = readDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password || password.length < 6) return res.status(400).json({ message: 'Name, valid email and password with 6+ characters required.' });
  if (db.users.some((u) => String(u.email).toLowerCase() === email)) return res.status(409).json({ message: 'This email already has an account.' });
  const user = { id: id('u'), name: req.body.name || 'Voltify Customer', email, phone: req.body.phone || '', address: req.body.address || '', passwordHash: bcrypt.hashSync(password, 10), role: 'customer', createdAt: now() };
  db.users.push(user);
  addNotification(db, 'customer', 'New customer account', `${user.name} registered with ${user.email}`, { userId: user.id });
  writeDb(db);
  const { passwordHash, ...safe } = user;
  res.status(201).json({ user: safe, token: makeToken(user) });
});
app.get('/api/account', auth(), (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  const { passwordHash, ...safe } = user;
  const orders = db.orders.filter((o) => o.userId === user.id || (user.phone && o.phone === user.phone) || (user.email && o.email === user.email));
  res.json({ user: safe, orders });
});
app.put('/api/account', auth(), (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  ['name','phone','address'].forEach((key) => { if (req.body[key] !== undefined) user[key] = req.body[key]; });
  user.updatedAt = now();
  writeDb(db);
  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

app.post('/api/uploads', auth(['admin', 'manager', 'staff']), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const url = `/uploads/${req.file.filename}`;
  logActivity(req.user, 'upload_file', url);
  res.status(201).json({ url, filename: req.file.filename, mimetype: req.file.mimetype });
});

app.get('/api/brands', (req, res) => res.json(readDb().brands));
app.post('/api/brands', auth(['admin', 'manager']), (req, res) => {
  const db = readDb();
  const brand = { id: id('brand'), name: '', iconText: '', logoUrl: '', description: '', active: true, showInMenu: true, menuOrder: 999, createdAt: now(), ...req.body };
  db.brands.unshift(brand); writeDb(db); logActivity(req.user, 'create_brand', brand.name); res.status(201).json(brand);
});
app.put('/api/brands/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const index = db.brands.findIndex((b) => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Brand not found.' });
  db.brands[index] = { ...db.brands[index], ...req.body, updatedAt: now() }; writeDb(db); logActivity(req.user, 'update_brand', db.brands[index].name); res.json(db.brands[index]);
});
app.delete('/api/brands/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const before = db.brands.length; db.brands = db.brands.filter((b) => b.id !== req.params.id);
  if (before === db.brands.length) return res.status(404).json({ message: 'Brand not found.' });
  writeDb(db); logActivity(req.user, 'delete_brand', req.params.id); res.json({ ok: true });
});

app.get('/api/categories', (req, res) => res.json(readDb().categories));
app.post('/api/categories', auth(['admin', 'manager']), (req, res) => {
  const db = readDb();
  const category = { id: id('cat'), name: '', icon: '', iconUrl: '', description: '', active: true, showInMenu: true, menuOrder: 999, createdAt: now(), ...req.body };
  db.categories.unshift(category); writeDb(db); logActivity(req.user, 'create_category', category.name); res.status(201).json(category);
});
app.put('/api/categories/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const index = db.categories.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Category not found.' });
  db.categories[index] = { ...db.categories[index], ...req.body, updatedAt: now() }; writeDb(db); logActivity(req.user, 'update_category', db.categories[index].name); res.json(db.categories[index]);
});
app.delete('/api/categories/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const before = db.categories.length; db.categories = db.categories.filter((c) => c.id !== req.params.id);
  if (before === db.categories.length) return res.status(404).json({ message: 'Category not found.' });
  writeDb(db); logActivity(req.user, 'delete_category', req.params.id); res.json({ ok: true });
});


app.get('/api/header-menu', (req, res) => {
  const db = readDb();
  const order = (a, b) => Number(a.menuOrder ?? 999) - Number(b.menuOrder ?? 999) || String(a.name || '').localeCompare(String(b.name || ''));
  const categories = db.categories.filter((c) => c.active !== false && c.showInMenu !== false).sort(order);
  const brands = db.brands.filter((b) => b.active !== false && b.showInMenu !== false).sort(order);
  const fallbackEnd = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const deals = db.products
    .filter((p) => p.showInMenu !== false && (Number(p.discountPrice || 0) > 0 || p.bestSeller || p.featured || p.trending))
    .sort((a, b) => Number(a.menuOrder ?? 999) - Number(b.menuOrder ?? 999))
    .slice(0, 12)
    .map((p) => ({ ...p, dealEndsAt: p.dealEndsAt || fallbackEnd }));
  res.json({ categories, brands, deals });
});

app.get('/api/finder/devices', (req, res) => res.json(readDb().devices));
app.post('/api/finder/devices', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const device = { id: id('dev'), brand: '', model: '', categories: [], keywords: [], notes: '', createdAt: now(), ...req.body };
  db.devices.unshift(device); writeDb(db); logActivity(req.user, 'create_finder_device', `${device.brand} ${device.model}`); res.status(201).json(device);
});
app.put('/api/finder/devices/:id', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const index = db.devices.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Device not found.' });
  db.devices[index] = { ...db.devices[index], ...req.body, updatedAt: now() }; writeDb(db); logActivity(req.user, 'update_finder_device', `${db.devices[index].brand} ${db.devices[index].model}`); res.json(db.devices[index]);
});
app.delete('/api/finder/devices/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const before = db.devices.length; db.devices = db.devices.filter((d) => d.id !== req.params.id);
  if (before === db.devices.length) return res.status(404).json({ message: 'Device not found.' });
  writeDb(db); logActivity(req.user, 'delete_finder_device', req.params.id); res.json({ ok: true });
});

function textOfProduct(p) {
  return [p.name, p.brand, p.category, p.description, p.specifications, p.compatibility, ...(p.tags || [])].join(' ').toLowerCase();
}
function scoreProduct(product, words = [], categoryBoosts = []) {
  const text = textOfProduct(product);
  let score = 0;
  words.forEach((w) => { if (w && text.includes(String(w).toLowerCase())) score += 4; });
  categoryBoosts.forEach((c) => { if (String(product.category).toLowerCase().includes(String(c).toLowerCase())) score += 6; });
  if (product.bestSeller) score += 1;
  if (product.featured) score += 1;
  return score;
}

app.get('/api/finder/search', (req, res) => {
  const { brand = '', model = '' } = req.query;
  const db = readDb();
  const device = db.devices.find((d) => d.brand.toLowerCase() === String(brand).toLowerCase() && d.model.toLowerCase() === String(model).toLowerCase());
  const words = [brand, model, ...(device?.keywords || [])].filter(Boolean);
  const cats = device?.categories || ['Chargers', 'Power Banks', 'Phone Cases', 'Charging Cables', 'Wireless Chargers'];
  let ranked = db.products.map((p) => ({ ...p, _score: scoreProduct(p, words, cats) }))
    .filter((p) => p._score > 0 || cats.some((c) => String(p.category).toLowerCase() === String(c).toLowerCase()))
    .sort((a, b) => b._score - a._score)
    .map((p) => ({ ...p, reason: p._score > 0 ? 'Matched your device keywords, category or compatibility details.' : 'Recommended category match.' }));
  res.json({ device: device || { brand, model, categories: cats, keywords: words }, recommendedCategories: cats, products: ranked });
});

app.post('/api/ai-search', (req, res) => {
  const query = String(req.body.query || '').toLowerCase();
  const db = readDb();
  const categoryBoosts = [];
  const words = query.split(/[^a-z0-9+.-]+/i).filter(Boolean);
  let summary = 'Matched products based on product names, tags, specifications and compatibility.';
  if (/laptop|macbook|notebook|computer/.test(query)) { categoryBoosts.push('Power Banks', 'Chargers', 'Laptop Accessories'); words.push('laptop', 'macbook', '65w', '100w', 'usb-c pd', 'pd'); summary = 'For laptop + phone charging, prioritize USB-C PD power banks or GaN chargers with 45W, 65W or higher output and multiple ports.'; }
  if (/phone|iphone|samsung|galaxy|xiaomi|nothing/.test(query)) { categoryBoosts.push('Power Banks', 'Chargers', 'Charging Cables'); words.push('phone', 'iphone', 'samsung', 'usb-c'); }
  if (/same time|together|multi|multiple|two devices/.test(query)) { words.push('multi', 'multi device', 'multi-port'); summary += ' Multi-port support is important because you asked for more than one device.'; }
  if (/earbud|airpod|audio|music|call|gaming/.test(query)) { categoryBoosts.push('Earbuds', 'AirPods'); words.push('earbuds', 'bluetooth', 'audio', 'gaming'); }
  if (/watch|fitness|wearable/.test(query)) { categoryBoosts.push('Smart Watches'); words.push('smart watch', 'fitness', 'wearable'); }
  if (/case|protect|cover/.test(query)) { categoryBoosts.push('Phone Cases'); words.push('case', 'protect', 'magsafe'); }
  const products = db.products.map((p) => ({ ...p, _score: scoreProduct(p, words, categoryBoosts) }))
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map((p) => ({ ...p, reason: p._score > 8 ? 'Strong match for your need.' : 'Related match based on category, tags or specifications.' }));
  res.json({ title: 'Voltify AI Recommendation', summary, products });
});

app.get('/api/products', (req, res) => {
  const { brand, category, search, featured, newArrival, bestSeller } = req.query;
  let products = readDb().products;
  if (brand) products = products.filter((p) => p.brand.toLowerCase() === String(brand).toLowerCase());
  if (category) products = products.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (featured) products = products.filter((p) => Boolean(p.featured));
  if (newArrival) products = products.filter((p) => Boolean(p.newArrival));
  if (bestSeller) products = products.filter((p) => Boolean(p.bestSeller));
  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter((p) => textOfProduct(p).includes(q) || q.split(/\s+/).some((part) => part.length > 2 && textOfProduct(p).includes(part)));
  }
  res.json(products);
});
app.get('/api/products/:id', (req, res) => {
  const product = readDb().products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});
app.post('/api/products', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const product = { id: id('p'), name: '', brand: '', category: '', price: 0, discountPrice: 0, stock: 0, sku: '', warranty: '', description: '', specifications: '', compatibility: '', tags: [], imageUrl: '', gallery: [], videoUrl: '', featured: false, newArrival: false, bestSeller: false, trending: false, showInMenu: true, menuOrder: 999, dealEndsAt: '', createdAt: now(), ...req.body };
  db.products.unshift(product); writeDb(db); logActivity(req.user, 'create_product', product.name); res.status(201).json(product);
});
app.put('/api/products/:id', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found.' });
  db.products[index] = { ...db.products[index], ...req.body, updatedAt: now() }; writeDb(db); logActivity(req.user, 'update_product', db.products[index].name); res.json(db.products[index]);
});
app.delete('/api/products/:id', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const before = db.products.length; db.products = db.products.filter((p) => p.id !== req.params.id);
  if (db.products.length === before) return res.status(404).json({ message: 'Product not found.' });
  writeDb(db); logActivity(req.user, 'delete_product', req.params.id); res.json({ ok: true });
});

app.get('/api/reviews', (req, res) => {
  const { status = 'approved', productId } = req.query;
  let reviews = readDb().reviews;
  if (status !== 'all') reviews = reviews.filter((r) => r.status === status);
  if (productId) reviews = reviews.filter((r) => r.productId === productId);
  res.json(reviews);
});
app.post('/api/reviews', (req, res) => {
  const db = readDb();
  const review = { id: id('rev'), productId: req.body.productId, customerName: req.body.customerName || 'Customer', rating: Number(req.body.rating || 5), comment: req.body.comment || '', photos: req.body.photos || [], status: 'pending', createdAt: now() };
  db.reviews.unshift(review); writeDb(db); res.status(201).json({ ...review, message: 'Review submitted. It will appear after admin approval.' });
});
app.patch('/api/reviews/:id', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const review = db.reviews.find((r) => r.id === req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  review.status = req.body.status || review.status; review.reply = req.body.reply || review.reply || ''; review.updatedAt = now(); writeDb(db); logActivity(req.user, 'moderate_review', `${review.id}: ${review.status}`); res.json(review);
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const db = readDb(); const coupon = db.coupons.find((c) => c.code.toLowerCase() === String(code || '').toLowerCase() && c.active);
  if (!coupon) return res.status(404).json({ valid: false, message: 'Coupon not found.' });
  if (Number(subtotal) < coupon.minimumSpend) return res.status(400).json({ valid: false, message: `Minimum spend is Rs.${coupon.minimumSpend}.` });
  let discount = 0; if (coupon.type === 'fixed') discount = coupon.value; if (coupon.type === 'percentage') discount = Math.round(Number(subtotal) * (coupon.value / 100)); if (coupon.type === 'shipping') discount = 0;
  res.json({ valid: true, coupon, discount });
});
app.post('/api/orders', (req, res) => {
  const db = readDb();
  let user = null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) {
    try { const payload = jwt.verify(token, JWT_SECRET); user = db.users.find((u) => u.id === payload.id); } catch {}
  }
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ message: 'Cart is empty.' });
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.id);
    if (!product) return res.status(400).json({ message: `Product not found: ${item.name || item.id}` });
    if (Number(product.stock || 0) < Number(item.qty || 1)) return res.status(400).json({ message: `${product.name} has only ${product.stock} in stock.` });
  }
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.id);
    product.stock = Math.max(0, Number(product.stock || 0) - Number(item.qty || 1));
  }
  const order = { id: `${db.settings.invoicePrefix || 'VTF'}-${Date.now().toString().slice(-8)}`, userId: user?.id || '', customerName: req.body.customerName || user?.name || '', phone: req.body.phone || user?.phone || '', email: req.body.email || user?.email || '', district: req.body.district || '', address: req.body.address || user?.address || '', paymentMethod: req.body.paymentMethod || 'COD', items, subtotal: Number(req.body.subtotal || 0), shipping: Number(req.body.shipping || db.settings.defaultShippingCharge), discount: Number(req.body.discount || 0), total: Number(req.body.total || 0), status: 'Pending', createdAt: now(), notifications: [] };
  const adminMessage = `New order ${order.id} from ${order.customerName || order.phone}. Total Rs.${Number(order.total || 0).toLocaleString('en-LK')}`;
  const note = addNotification(db, 'order', 'New order received', adminMessage, { orderId: order.id });
  order.notifications.push(note.id);
  if (db.settings.emailNotificationsEnabled) order.notifications.push('email-placeholder');
  if (db.settings.whatsappNotificationsEnabled) order.notifications.push('whatsapp-ready');
  db.orders.unshift(order);
  writeDb(db);
  logActivity({ email: order.email || order.phone || 'guest' }, 'create_order', order.id);
  res.status(201).json({ ...order, invoiceUrl: `/invoice.html?id=${encodeURIComponent(order.id)}`, whatsappNotifyUrl: `https://wa.me/${String(db.settings.whatsappNumber || '').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(adminMessage)}` });
});
app.get('/api/orders', auth(['admin', 'manager', 'staff']), (req, res) => res.json(readDb().orders));
app.patch('/api/orders/:id', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  Object.assign(order, req.body, { updatedAt: now() }); writeDb(db); logActivity(req.user, 'update_order', `${order.id}: ${order.status}`); res.json(order);
});
app.get('/api/orders/track/:orderId', (req, res) => {
  const db = readDb(); const order = db.orders.find((o) => o.id.toLowerCase() === req.params.orderId.toLowerCase());
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (req.query.phone && String(order.phone).slice(-4) !== String(req.query.phone).slice(-4)) return res.status(403).json({ message: 'Phone number does not match this order.' });
  res.json(order);
});
app.get('/api/warranty/:orderId', (req, res) => {
  const db = readDb(); const order = db.orders.find((o) => o.id.toLowerCase() === req.params.orderId.toLowerCase());
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ orderId: order.id, status: order.status === 'Delivered' ? 'Active after delivery' : 'Pending delivery', message: 'Warranty expiry should be calculated from delivered date using each product warranty period.' });
});

app.get('/api/orders/:id', auth(), (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!['admin','manager','staff'].includes(req.user.role) && order.userId !== req.user.id && order.email !== req.user.email) return res.status(403).json({ message: 'Not allowed to view this order.' });
  res.json(order);
});
app.get('/api/orders/:id/invoice', auth(), (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).send('Order not found.');
  if (!['admin','manager','staff'].includes(req.user.role) && order.userId !== req.user.id && order.email !== req.user.email) return res.status(403).send('Not allowed.');
  res.type('html').send(orderInvoiceHtml(order, db, 'invoice'));
});
app.get('/api/orders/:id/packing-slip', auth(['admin','manager','staff']), (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).send('Order not found.');
  res.type('html').send(orderInvoiceHtml(order, db, 'packing'));
});
app.get('/api/notifications', auth(['admin','manager','staff']), (req, res) => res.json(readDb().notifications || []));
app.get('/api/suppliers', auth(['admin', 'manager', 'staff']), (req, res) => res.json(readDb().suppliers));
app.post('/api/suppliers', auth(['admin', 'manager']), (req, res) => {
  const db = readDb(); const supplier = { id: id('sup'), ...req.body, createdAt: now() }; db.suppliers.unshift(supplier); writeDb(db); logActivity(req.user, 'create_supplier', supplier.name); res.status(201).json(supplier);
});
app.get('/api/admin/stats', auth(['admin', 'manager', 'staff']), (req, res) => {
  const db = readDb(); const revenue = db.orders.reduce((sum, o) => sum + Number(o.total || 0), 0); const lowStock = db.products.filter((p) => Number(p.stock) <= 5); const pendingReviews = db.reviews.filter((r) => r.status === 'pending'); const pendingOrders = db.orders.filter((o) => ['Pending', 'Processing', 'Packed'].includes(o.status));
  res.json({ revenue, orders: db.orders.length, products: db.products.length, customers: new Set(db.orders.map((o) => o.phone).filter(Boolean)).size, lowStock, pendingReviews, pendingOrders, topProducts: db.products.filter((p) => p.bestSeller).slice(0, 5), activityLogs: db.activityLogs.slice(0, 20) });
});
app.get('/api/settings', (req, res) => res.json(readDb().settings));
app.put('/api/settings', auth(['admin']), (req, res) => {
  const db = readDb(); db.settings = { ...db.settings, ...req.body }; writeDb(db); logActivity(req.user, 'update_settings', 'website settings'); res.json(db.settings);
});
app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
app.listen(PORT, () => { readDb(); console.log(`Voltify.lk running at http://localhost:${PORT}`); console.log(`Admin login: http://localhost:${PORT}/admin-login.html`); });
