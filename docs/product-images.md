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
