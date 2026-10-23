# Product image contract

Each listed car offers three distinct previews under the same model ID:

- Black outline wall art: open line silhouette, standard length 30 cm.
- Full wood wall art: solid natural MDF, complete car including wheels, laser-engraved details, standard length 30 cm.
- Keychain: solid natural MDF, complete vehicle including wheels, engraved detail, reinforced eyelet, silver-colour chain and ring, approximately 6 cm.

The photographic previews are AI-generated product visualizations, not photographs of manufactured stock. The product page distinguishes these from the traced outline references. Final engraving is confirmed before production.

`public/catalog/car-models.json` holds one model record, its search aliases, body/generation hints (`photoVehicle`), separate image galleries and image provenance. `src/product-detail.js` selects the right gallery and price when the shopper changes product or finish. Never reuse a wall-art half silhouette as a keychain or attach generic wheels to it.

Optimized project images live in `public/assets/keychain-photos/` and `public/assets/wood-wall-photos/`. The original generated files remain available separately. The local generation manifests are outside the public application in `output/keychain-photos`; they contain working filesystem paths and are not published. `scripts/sync-generated-photos.py` installs successful manifests without changing model IDs, prices or customer orders.

Model naming has been audited against the existing outline references for ambiguous entries including Corvette C3 1982, Civic EG hatchback, Mazda 3 hatchback, BRZ ZD8, 240SX S13 fastback and modern Alpine A110. Road cars with F1 in their names are excluded from the Formula One filter. Duplicate generic F1 listings remain in the source directory for compatibility but point to a model-specific listing and are hidden from the prepared collection.

Generated raster previews are not machine cutting instructions. The design approval stage remains necessary to confirm the actual cutting/engraving paths, material and dimensions.

The release review compares all three previews per car, including roof configuration, door count and major generation features. Corrections use a versioned image filename so an older browser cache cannot retain an incorrect preview. `scripts/install-generated-photo.py` only compresses actual ImageGen output; it never constructs vehicle geometry.

Run `node scripts/export-product-photo-reviews.mjs` after local visual review, then `node scripts/check-product-photos.mjs --require-complete` before publishing the completed photographic collection. Review evidence uses SHA-256 file hashes, so it remains valid after a Git checkout while changed photographs require a new review. The local review server is a development tool and must never be deployed as a customer or admin API.

The former generic-wheel keychain generator and unreferenced legacy keychain/solid previews are retired outside the public application. Preserve the black outline files still referenced by the catalog.
