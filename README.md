# Voltify.lk Render Fixed Pro Update

This version includes the cleaned light/dark customer website, admin dashboard, cart, account login, invoice/packing-slip print, stock reduction, notifications and product gallery uploads.

## Run locally

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Open:

- Website: http://localhost:5000
- Login: http://localhost:5000/login.html
- Admin dashboard: http://localhost:5000/admin.html

Default admin:

- Email: admin@voltify.lk
- Password: Admin@12345

## Render settings

Use exactly:

- Root Directory: `backend`
- Build Command: `npm install --no-audit --no-fund`
- Start Command: `npm start`

Environment variables:

```txt
NODE_VERSION=20.18.0
PORT=10000
JWT_SECRET=change_this_to_a_long_random_secret
ADMIN_EMAIL=admin@voltify.lk
ADMIN_PASSWORD=Admin@12345
```

## Added in this update

- Cleaner dark mode and light mode
- Sun/moon theme toggle
- Header menu visibility fixes
- Refined button styling and hover animations
- Customer login/register/account page
- Customer order history
- Printable invoice page with “Save as PDF” support
- Admin invoice print
- Admin packing slip print
- Stock auto-reduction after checkout
- Admin notification records for new orders/customers
- WhatsApp order support link
- Email notification setting placeholder
- Product gallery with multiple image upload
- Product detail gallery thumbnails

## Important production note

This is still using local JSON storage and local uploads. For a real shop, upgrade next to PostgreSQL + Prisma and Cloudinary so product data and uploaded images persist safely after hosting redeploys.
