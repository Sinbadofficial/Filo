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

## Steadfast Integration

```env
STEADFAST_API_KEY=your_api_key
STEADFAST_SECRET_KEY=your_secret_key
```

## bKash Auto-Verify

```env
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
```

Admin can verify payout TrxID at `/admin/payments` or via `POST /api/bkash/verify`.

## SMS / WhatsApp Notifications

```env
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=ResellBD
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
```

Without credentials, notifications log to console (mock mode).

## Flutter Mobile App

See `mobile/README.md` for the reseller Flutter app.

## New in this version

- Product image upload (`/api/upload`)
- Steadfast courier API integration
- bKash payment auto-verify on payout
- Multi-item orders (one order, multiple products)
- SMS/WhatsApp notifications on order events
- Flutter reseller app scaffold in `mobile/`

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
