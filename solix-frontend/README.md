# Solix storefront

Next.js 16 storefront and administration studio for Solix. The interface uses a cream, ink and olive design system and includes responsive catalog filters, product details, authentication, cart, checkout, order and payment status, profile management, and the complete studio workflow.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The default API is `http://localhost:3000`; change `NEXT_PUBLIC_API_URL` when the NestJS server runs elsewhere. The frontend runs at [http://localhost:3001](http://localhost:3001).

## Verification

```bash
npm run lint
npm run build -- --webpack
```

Checkout requires an account. Delivery is free in this version. bKash and Nagad appear only when their recipient numbers are configured by the backend, and the customer submits a Send Money transaction ID for manual verification.
