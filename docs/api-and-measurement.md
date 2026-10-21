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

The owner signs in through the original trusted Sites authentication at `/admin`. The Vercel bridge never forwards owner identity and does not proxy admin mutations. Do not send a client-provided owner email header on another host.

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
