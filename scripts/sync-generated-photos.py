"""Install reviewed generated-photo manifests; never synthesize vehicle geometry."""
import json
from pathlib import Path
p=Path('public/catalog/car-models.json'); rows=json.loads(p.read_text()); byid={r['id']:r for r in rows}
for f in Path('../output/keychain-photos').glob('*.json'):
 a=json.loads(f.read_text())
 if not isinstance(a,dict) or not a.get('id'):continue
 r=byid.get(a['id']); solid=f.name.startswith('wall-'); asset=Path('public/assets/wood-wall-photos' if solid else 'public/assets/keychain-photos')/(a['id']+'.webp')
 if r and asset.exists():
  if solid:r['photoStyles']['engraved']=['/assets/wood-wall-photos/'+asset.name]
  else:r['photos']['keychain']=['/assets/keychain-photos/'+asset.name]
  r['solidImageProvenance' if solid else 'keychainImageProvenance']={'method':'AI-generated photographic MDF product visualization','modelSpecific':True,'generatedAt':'2026-10-21'}
p.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
print(sum(bool(r.get('keychainImageProvenance')) for r in rows),'car keychain photographic previews installed')
