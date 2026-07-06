# ResellBD — Supplier Reseller Platform

Bangladesh-focused reseller platform where **you are the supplier** and resellers sell your products.

## Features

- **Product catalog** with reseller prices
- **Reseller accounts** — browse catalog, add products to their shop with custom selling price
- **Order creation** — connects to Pathao (mock mode without API keys)
- **Wallet system** — profit credited on delivery, delivery charge deducted on return
- **Payment requests** — reseller requests payout, super admin marks as paid via bKash

## Quick Start

```bash
npm install
npm run db:setup   # migrate + seed
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@resellbd.com | admin123 |
| Reseller | reseller@demo.com | reseller123 |

## User Flow

### Reseller
1. Register / Login
2. **Catalog** — see all products with reseller price
3. **My Shop** — add products with your selling price (profit = selling - reseller price)
4. **Orders** — create order for customer → Pathao booking (auto)
5. **Wallet** — profit added when admin marks DELIVERED; delivery charge deducted on RETURNED
6. Request payment → admin pays via bKash

### Super Admin (Supplier)
1. **Products** — add products with reseller price & return delivery charge
2. **Orders** — update status (DELIVERED triggers profit, RETURNED deducts charge)
3. **Payment Requests** — approve & mark paid

## Pathao Integration

Set in `.env`:

```env
PATHAO_CLIENT_ID=your_client_id
PATHAO_CLIENT_SECRET=your_secret
PATHAO_STORE_ID=your_store_id
```

Without credentials, orders get a mock tracking ID for development.

## Tech Stack

- Next.js 16 (App Router)
- Prisma 7 + SQLite (swap to PostgreSQL for production)
- Tailwind CSS
- JWT session cookies

## Environment

Copy `.env` and set:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-long-random-secret"
```

## Production Notes

- Switch SQLite → PostgreSQL
- Set strong `JWT_SECRET`
- Configure real Pathao Merchant API credentials
- Add image upload (S3/Cloudinary) for product photos
