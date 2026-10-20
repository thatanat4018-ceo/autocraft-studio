# AutoCraft Studio

Automotive MDF wall art and wooden keychain storefront. 120 model-specific outline previews, search, filters, pagination, custom requests, and private order tracking.

## Local development

Node.js 22+, `npm ci`, then `npm run dev`. `npm run build` outputs the frontend to `dist/client`.

## Production on Vercel

Import this repository. `vercel.json` configures the build and customer API proxy. Customers do not need to log in.

The customer request API uses the existing AutoCraft Sites backend and private storage. Keep that service online; this deployment does not migrate stored requests or uploads. Owner management remains on the original authenticated `/studio` page. The Vercel proxy forwards only customer request creation, private-token tracking, images, and health checks; owner identity headers and owner mutations are never forwarded. Uploads are limited to 4 MB total for Vercel function limits.

No payment gateway is connected. Requests await a quote and approval; the owner sends a payment link manually.

`worker/` retains the original Sites-specific backend for reference. Its trusted Sites identity header must not be used as authentication on another host. Do not deploy that backend directly without replacing owner authentication and configuring private storage.

Product images are digital wood previews. Vector studies require manufacturing review, bridges, kerf, and material testing before laser cutting.
