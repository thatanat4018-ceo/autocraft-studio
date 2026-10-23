# AutoCraft API and measurement map

All customer APIs are same-origin HTTPS under `/api/`. JSON responses and private images use no-store. Account sessions use a random HttpOnly, Secure, SameSite=Lax cookie; only its hash is stored. Passwords use per-account salts and PBKDF2 SHA-256. Recovery codes rotate after use and revoke prior sessions. Email is not verified and no reset email is sent.

## Customer endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST JSON | Name, email, password (12–128 characters), account-processing consent; optional attribution. Returns user, session cookie and one-time recovery code. |
| `/api/auth/login` | POST JSON | Email/password sign-in. |
| `/api/auth/recover` | POST JSON | Email + recovery code + new password; rotates recovery code and revokes old sessions. |
| `/api/auth/me` | GET | Current account or null. |
| `/api/auth/logout` | POST | Revoke the active session. |
| `/api/orders` | POST multipart | Signed-in checkout; server validates SKU, quantity, price, size, custom fee, reference uploads and delivery/address. UUID idempotency key prevents double orders on retry. |
| `/api/orders` | GET | Only the signed-in customer's orders. |
| `/api/orders/:id` | GET | Customer-owned order details/history/quote. |
| `/api/orders/:id/photos/:index` | GET | Private customer reference. |
| `/api/orders/:id/designs/:index` | GET | Private studio design option. |
| `/api/orders/:id/approve` | POST JSON | Select a posted design option. |
| `/api/orders/:id/revision` | POST JSON | Request a design change with a message. |
| `/api/orders/:id/accept-quote` | POST JSON | Accept final price after design approval. |
| `/api/events` | POST JSON | Consented browser page_view, view_item, add_to_cart, begin_checkout or engaged events. Server rejects client-supplied purchase/signup events. |

Order multipart fields: orderId, items (JSON array: modelId, variant=keychain/solid/outline, quantity, width, custom, notes), name, contact, delivery=pickup/shipping, address and phone if shipping, notes, consent=yes, attribution (optional JSON), photos (up to 3 JPG/PNG/WebP images, 4 MB total). Price submitted by the client is ignored. Custom fee is THB 50 once per distinct custom cart line. Shipping is THB 50 once per order. Pickup is free at the MUIC building by appointment.

## Owner-only endpoints (original Sites origin)

The owner signs in at `/admin` using the dedicated studio username/password or the original trusted Sites owner authentication. Studio credentials are separate from customer accounts, including customer signups using the owner email. Password login uses a salted PBKDF2-SHA256 verifier in runtime secrets, an eight-hour HttpOnly/Secure/SameSite=Strict cookie and a revocable server-side session. Login is limited by IP and global window; all mutations require same-origin. Rotating `STUDIO_ADMIN_PASSWORD_HASH` revokes existing password sessions. The Vercel bridge never forwards owner identity and does not proxy admin mutations. Do not send a client-provided owner email header on another host.

- GET `/api/admin/orders`
- PATCH `/api/admin/orders/:id`: status, customer-facing reply, final total, HTTPS payment link, verified payment reference, carrier and tracking. Design and final-quote approval are required before payment verification; fulfilment requires verified payment.
- POST multipart `/api/admin/orders/:id/designs`: private design images. Replacement is allowed only before design approval. Customer references/designs are never copied into the public catalog.
- GET `/api/admin/analytics?days=42&cursor=...`: page through anonymous measurement events in batches of 200; dashboard combines pages and deduplicates browser/session IDs. No email, contact, address, upload or password appears in analytics exports. Operational order totals are separate from consented traffic cohorts.

## Attribution and limitations

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content` identify each placement/creative. Presets and printable QR files live at `/campaigns.html`. First touch lasts up to 30 days; last touch updates on a new tagged campaign or 30-minute session. Browser IDs are pseudonymous; clearing storage or changing devices creates new visitors. Shared/forwarded links retain their tag. Instagram captions, screenshots and referrers cannot automatically identify the exact original post; use a different working link/QR for each placement. Native Instagram reach, likes, comments, shares, saves and views must be recorded from Instagram Insights separately.

GA4, Meta Pixel and Clarity are not configured: no measurement IDs, external account access, or recording permission was provided. The first-party dashboard is functional independently. Optional browser measurement can be declined without preventing account creation or checkout. Trackable conversions and all operational orders are deliberately distinct; do not divide all unconsented orders by consented sessions and call it an unbiased conversion rate.

## Custom operating procedure

1. Review request and reference; first design/response target is within 24 hours, not a guaranteed production/delivery date.
2. Upload private design options through owner dashboard; notify customer manually using their chosen contact channel.
3. Customer selects a design or requests revisions in My Account.
4. Confirm final quote (including any custom size adjustment); customer accepts it.
5. Send HTTPS payment link. Opening it is not payment.
6. Independently verify payment, record reference, then start production. This creates the paid-order/revenue event once.
7. Set ready-for-pickup and agree a MUIC appointment, or add carrier/tracking and mark shipped.

No automated payment gateway, payment webhook, email/LINE messaging, refund automation, or verified-email recovery is connected. Do not manufacture demo or QA orders.

### Studio login API

- `GET /api/admin/auth/me`: authentication state, access method and password-login availability; never returns credentials.
- `POST /api/admin/auth/login`: `{username,password}`; sets the isolated studio cookie on success.
- `POST /api/admin/auth/logout`: revokes the current password session and expires its cookie.
- Runtime configuration: `STUDIO_ADMIN_USERNAME`, secret `STUDIO_ADMIN_PASSWORD_HASH` in `pbkdf2-sha256$100000$<64-hex-salt>$<64-hex-derived-key>` format. Configure through Sites environment tools and deploy; never commit the password or verifier. Preserve `STUDIO_OWNER_EMAIL` for owner fallback.
- Admin operations remain available on the native Sites host. The Vercel customer bridge does not proxy admin APIs.

### Unified sales workspace and custom studio

`/custom` is the public custom design page. All new submissions use the account/cart/checkout flow and `POST /api/orders`; adding to a cart alone does not submit a request. Per-line `referenceIndexes` bind uploaded references to each custom design; the server rejects invalid indexes and validates file types and totals. Reference files remain in browser memory until checkout and must be attached again after a refresh.

`GET /api/admin/workspace` requires studio authorization and returns account orders plus earlier `requests/` inquiries, without request tracking-token hashes. The admin page supports order type, stage and search filters, private references, replies, quotes, verified payment and shipping updates. Earlier inquiries retain their original tracking links and reply API; they are labelled separately and excluded from verified revenue. Summary counts are operational totals, separate from consented campaign analytics.

### Per-link and combined campaign reports

The registry at `/campaigns/links.json` contains seven placements: IG bio, post 01, Reels 01/02, Story 01, MUIC booth QR and QR inside an IG post. Each has unique `utm_content`; current PNG/SVG QR assets point to the public Vercel storefront. Existing printed native-site links continue to work against the same backend, but browser identity is separate across domains.

Admin → Campaign performance shows each registered placement even with zero visits, placement-type groups and deduplicated overall totals. A browser visiting multiple placements is counted once overall. Event IDs are deduplicated across response pages. Conversion means distinct sessions with an order submission divided by measured sessions; several orders in one session do not exceed 100%. Later payment confirmations do not create new visits. Operational orders/revenue are separate from consented attribution.

Engagement requires ten active visible-page seconds. Provisional exits use the last observed browser event per session, not payment events; they are not GA4 bounce or confirmed exit counts. The 42-day view compares six-week class targets. Summary CSV, per-link CSV and copyable report text are available. Formula-leading text is escaped in CSV.

Owner-only `POST /api/admin/analytics/test-cleanup` accepts `{campaign,confirm}` where both exactly match `qa_YYYYMMDD_<8 lowercase hex>`. It deletes only events whose last-touch campaign equals that explicitly named QA campaign, writes a cleanup audit, requires same-origin and refuses normal campaign names. It does not delete customer accounts, orders, files or other traffic. Use a separate QA campaign for live tests, then verify no QA events remain.
