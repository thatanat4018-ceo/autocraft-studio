# AutoCraft Studio

Automotive MDF storefront: model-specific car/F1/circuit/emblem previews, engraved wooden keychains, full-body wood wall art and black outline wall art. Includes cart, customer accounts, custom reference uploads, private design approval, quotes, delivery/pickup, order history, source-tagged campaign links and owner analytics.

## Run and check

Node.js 22+. `npm ci`, `npm run build`. `node scripts/check-commerce.mjs`, `node scripts/check-catalog.mjs`, `node scripts/check-expanded-collection.mjs`, `node scripts/check-requests.mjs`. For a loopback-only test environment: `node scripts/preview-commerce.mjs` (ephemeral in-memory storage, no real orders or payments). `npm run dev` previews the frontend; account/order APIs require the server preview or production.

## Production

Frontend: https://autocraft-studio.vercel.app. Vercel config builds `dist/client` and forwards explicitly permitted customer API routes to the original private Sites/R2 backend. Keep that backend live. Owner dashboard: `/admin` redirects to the trusted original Sites origin. Legacy pre-account requests stay in `/studio` and are not automatically linked to an account by an unverified email address.

The original Worker backend must be deployed only with the trusted Sites identity integration and private BUCKET binding. Do not deploy its identity-header check directly on another host. No credentials or customer data belong in Git. GitHub source is uploaded separately from production CLI deployment; automatic Git integration is not enabled.

Prices are centralized in `src/pricing.js`: keychain THB 79, black outline wall THB 199, full wood wall THB 249. Backend embeds this table at build time; never trust client price fields. Custom +THB 50 per design; shipping +THB 50 per order; MUIC pickup free by appointment. No payment is charged by this app.

See [implementation plan](docs/implementation-plan.md) and [API/measurement/operations](docs/api-and-measurement.md). Digital images are previews, not finished-stock photos. Model references and circuit data provenance are stored in catalog metadata. Manufacturing drawings need bridge/kerf/material review and test cutting; previews are not certified machine-ready toolpaths.
