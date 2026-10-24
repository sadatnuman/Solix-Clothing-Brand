# Solix endpoint and role coverage

This map is kept with the application so backend routes are not added without a customer or studio workflow. Every route below is either connected to a visible UI, used automatically by that UI, or intentionally operational.

## Role model

| Role | Access |
| --- | --- |
| Customer | Storefront, profile, addresses, wishlist, cart, checkout, own orders/payments, reviews, returns, notifications and support |
| Staff: `catalog` | Products, images, categories, sizes, variants, collections and coupons |
| Staff: `fulfilment` | Inventory ledger/adjustment, orders, tracking, payments and returns |
| Staff: `support` | Customer directory, review moderation and support inbox |
| Admin | Every staff scope plus staff access, content/settings, customer status/reset and audit log |

The backend enforces each scope with `PermissionsGuard`. The studio sidebar hides tools outside the signed-in staff member's scopes.

## Frontend coverage

| API group | UI surface |
| --- | --- |
| `auth/*` | Login, registration, profile password change and logout; refresh runs automatically |
| `products`, suggestions, filter options, slug, related | Home, Shop, search suggestions, product details and recently viewed |
| `categories`, `sizes`, `product-variants` | Shop filters, product selection and catalog studio screens |
| `cart/*` | Guest/account bag, merge after login, quantity, remove, save for later and clear bag |
| `addresses/*` | Saved-address book and checkout selector |
| `wishlist/*` | Product quick save, cart save for later and account wishlist |
| `coupons/validate`, `admin/coupons/*` | Checkout discount and offer create/edit studio |
| `orders/*` | Checkout, order history/detail, timeline, cancel, admin status and courier tracking |
| `payments/*` | Send Money reference/proof submission, customer record and admin verification/rejection |
| `reviews/*` | Product reviews and moderation studio |
| `returns/*` | Order return/exchange request, customer aftercare list and studio workflow |
| `support-tickets/*` | Public contact, customer inbox/replies and studio support inbox |
| `notifications/*` | Account notification centre and read state |
| `collections/*` | Homepage/shop merchandising and collection studio |
| `content/*`, `store/settings` | Information pages, footer/contact identity and content/settings studio |
| `admin/inventory/*` | Low-stock queue, stock adjustment and immutable movement ledger |
| `admin/dashboard/*` | Studio revenue/order summary and sold-product report |
| `users/*` | Profile, customer directory, pause/restore and admin-assisted reset |
| `admin/staff/*` | Staff creation, scope assignment and account pause/restore |
| `admin/audit` | Admin-only audit log |

`GET /`, `GET /ready`, refresh-token rotation and the retained-payment delete rejection are operational contracts and intentionally do not need standalone pages.
