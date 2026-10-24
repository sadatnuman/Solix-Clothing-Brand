# Solix API

NestJS 11 API for the Solix storefront and studio. Data is stored in MongoDB Atlas through Mongoose. Orders keep product snapshots, checkout prices are calculated on the server, stock changes run in transactions, and repeat submissions use an idempotency key.

## Local setup

1. In Atlas, create or resume a cluster, create a database user, and add your current IP under **Network Access**.
2. Copy `.env.example` to `.env`. Put the Atlas URI in `MONGODB_URI`; URL-encode reserved characters in the database password. Keep `.env` private.
3. Set a long `JWT_SECRET`. Add `BKASH_NUMBER` or `NAGAD_NUMBER` only when customers may send money to that number. These are manual **Send Money** methods; Solix does not call a payment gateway.
4. Install and seed:

```bash
npm install
npm run seed
npm run start:dev
```

The seed is safe to run again. It preserves existing accounts and stock while creating any missing demo catalog records. When `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, it creates the initial studio account.

## Verification

```bash
npm run lint
npm run test
npm run test:integration
npm run build
```

The integration suite starts an isolated MongoDB replica set and verifies authentication, access control, catalog routes, carts, transactional checkout, duplicate checkout protection, stock contention, rollback, cancellation and manual payment verification.

Uploaded JPEG, PNG and WebP files are limited to 2 MB and served from `/uploads`. The store uses its website inbox for support and notifications; no SMTP service is required.
