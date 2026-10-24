# Solix Clothing Brand

Solix is a full-stack, single-brand clothing commerce application for Bangladesh. It combines an editorial storefront with product discovery, secure account management, cart and checkout, manual Send Money verification, order aftercare, and a role-based administration studio.

**Live application:** [solix-bangladesh.netlify.app](https://solix-bangladesh.netlify.app)

**API health:** [solix-backend-tqrt.onrender.com/ready](https://solix-backend-tqrt.onrender.com/ready)

## Technology

| Layer | Technology |
| --- | --- |
| Storefront and admin UI | Next.js 16, React 19 |
| API | NestJS 11, TypeScript |
| Database | MongoDB Atlas with Mongoose |
| Authentication | HTTP-only access and rotating refresh-token cookies |
| Production uploads | Cloudinary |
| Frontend hosting | Netlify |
| Backend hosting | Render |

The repository is a two-application monorepo:

```text
Solix-Clothing-Brand/
├── solix-frontend/   # Next.js storefront and admin studio
├── solix-backend/    # NestJS API, schemas, seed and tests
├── docs/             # Supporting project documentation
├── netlify.toml      # Frontend deployment configuration
└── render.yaml       # Backend deployment blueprint
```

## Features

### Storefront

- Responsive editorial homepage with product, collection, brand and store sections
- Search, suggestions, sorting, pagination and category, collection, colour, size, price, availability and discount filters
- Product galleries, colour and size variants, stock, SKU, quantity controls, fit, care and size guidance
- Guest cart and recently viewed products, with authenticated cart merging
- Account-based wishlist, saved addresses, notifications and support inbox
- Coupon validation, server-calculated totals and stock-safe checkout
- Cash on Delivery and manual bKash or Nagad **Send Money** submission
- Order history, status timeline, tracking, invoice, cancellation, return and size-exchange requests
- FAQ, size guide, delivery, returns, privacy, terms, contact and branded error pages
- Product metadata, canonical URLs, Open Graph preview, sitemap, robots and structured data

### Admin studio

- Dashboard, catalog, products, variants, categories, collections and sizes
- Product, category and collection image upload
- Stock adjustment, low-stock queue and immutable inventory movements
- Orders, manual payment verification, returns and exchanges
- Customers, staff permissions, reviews, coupons and support tickets
- Site content, store settings and audit log

### Roles

| Role | Access |
| --- | --- |
| `customer` | Profile, addresses, cart, checkout, wishlist, orders, reviews, returns, notifications and support |
| `staff` | Explicitly assigned catalog, fulfilment or support permissions |
| `admin` | Full admin studio, staff management and all operational settings |

New registrations become active customer accounts immediately. The application does not send verification, OTP, password-reset, newsletter or transactional email. An administrator can set a temporary password when account recovery is required.

## Requirements

- Node.js 22 or newer
- npm
- A MongoDB Atlas cluster
- Cloudinary account for persistent production uploads

## Local setup

Clone the repository and install both applications:

```bash
git clone https://github.com/sadatnuman/Solix-Clothing-Brand.git
cd Solix-Clothing-Brand

cd solix-backend
npm ci
cp .env.example .env

cd ../solix-frontend
npm ci
cp .env.example .env.local
```

### Backend environment

Edit `solix-backend/.env`:

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://DATABASE_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/solix?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3001

# Leave a number blank to disable that Send Money option.
BKASH_NUMBER=
NAGAD_NUMBER=

# Used by the idempotent seed to create or update the first admin.
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-at-least-8-characters

# Local development stores files under solix-backend/uploads.
UPLOAD_PROVIDER=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Atlas must allow connections from the development machine, and the database user must have read/write access to the selected database. URL-encode reserved characters in the database password.

### Frontend environment

Edit `solix-frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
SERVER_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`NEXT_PUBLIC_API_URL` is used by browser requests in development. `SERVER_API_URL` is used for server-rendered product metadata and the sitemap. `NEXT_PUBLIC_SITE_URL` controls canonical and social URLs.

### Seed the catalog

The seed is idempotent: it can be run again without intentionally duplicating the demo catalog. It adds categories, sizes, clothing products, colour/size variants, stock, store content and the configured administrator.

```bash
cd solix-backend
npm run seed
```

Do not commit real credentials or either local environment file.

## Run locally

Start the API:

```bash
cd solix-backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd solix-frontend
npm run dev
```

Open:

- Storefront: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3000](http://localhost:3000)
- Readiness: [http://localhost:3000/ready](http://localhost:3000/ready)
- Admin studio: [http://localhost:3001/admin](http://localhost:3001/admin)

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured before running the seed to sign in as administrator.

## API conventions

- MongoDB identifiers are returned as string `id` values.
- Single-resource responses generally use `{ data: ... }`.
- List responses use `{ data: [...], meta: { page, limit, total, pages } }` where pagination applies.
- Authentication tokens are stored in secure HTTP-only cookies and are never returned for browser storage.
- Checkout totals, discounts and stock are recalculated by the API.
- Checkout accepts an idempotency key to prevent duplicate orders.
- Manual payment transaction references are unique and require staff or admin verification.

Key public route groups include `/products`, `/categories`, `/collections`, `/sizes`, `/auth`, `/cart`, `/orders`, `/payments`, `/wishlist`, `/reviews`, `/returns`, `/notifications` and `/support-tickets`. Administrative routes are under `/admin/*` and enforce role and permission guards.

## Validation

Run backend checks:

```bash
cd solix-backend
npm run lint
npm run build
npm test -- --runInBand
npm run test:integration
```

Run frontend checks:

```bash
cd solix-frontend
npm run lint
npm run build
```

Integration tests that use MongoDB transactions require a replica set. MongoDB Atlas already provides one; local tests can use a replica-set-compatible MongoDB test environment.

## Production deployment

### Render backend

`render.yaml` configures the `solix-backend` service:

```text
Root directory: solix-backend
Build command: npm ci && npm run build
Start command: npm run start:prod
Health check: /ready
```

Configure these variables in Render:

```text
NODE_ENV=production
MONGODB_URI
JWT_SECRET
FRONTEND_URL=https://YOUR_NETLIFY_SITE.netlify.app
BKASH_NUMBER
NAGAD_NUMBER
ADMIN_EMAIL
ADMIN_PASSWORD
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Netlify frontend

`netlify.toml` builds the frontend from `solix-frontend`. Configure:

```text
NEXT_PUBLIC_API_URL=/api
SERVER_API_URL=https://YOUR_RENDER_SERVICE.onrender.com
NEXT_PUBLIC_SITE_URL=https://YOUR_NETLIFY_SITE.netlify.app
```

Next.js proxies browser `/api/*` requests to `SERVER_API_URL`. This keeps login and refresh cookies first-party on the storefront domain. After the final Netlify URL is known, update Render's `FRONTEND_URL` and redeploy the backend.

Production uploads use Cloudinary because Render's local filesystem is ephemeral. Static catalog artwork bundled under `solix-frontend/public` is served directly by Netlify.

## Payment model

This release has no live card or mobile-financial-service gateway.

- **Cash on Delivery:** the order proceeds through the fulfilment workflow.
- **bKash/Nagad Send Money:** the customer sends money to the configured number and submits the transaction reference, with optional proof. Staff or admin verifies or rejects the submission.
- An empty `BKASH_NUMBER` or `NAGAD_NUMBER` disables that option.

Payment and order statuses are kept consistent by the backend. Stock changes for checkout, cancellation, return and exchange are recorded through inventory movements.

## Security notes

- Passwords are hashed with bcrypt and hashes are excluded from API responses.
- Access and refresh cookies are HTTP-only; production cookies are secure.
- Refresh sessions can be rotated and revoked.
- DTO validation rejects unknown input fields.
- Helmet, CORS, rate limiting, upload type/size checks and role/permission guards protect the API.
- Secrets belong in local `.env` files or hosting dashboards, never in Git.

## Free-tier behaviour

- Render's free service can sleep after inactivity, so the first request may take about a minute.
- Netlify and Cloudinary are subject to their free usage limits.
- The project currently uses free hosting subdomains and MongoDB Atlas free-tier storage.

## License

This repository is a private-brand application for Solix. No open-source license is granted unless a license file is added explicitly.
