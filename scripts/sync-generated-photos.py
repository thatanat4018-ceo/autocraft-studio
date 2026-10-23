"""Install reviewed generated-photo manifests; never synthesize vehicle geometry."""
import json
from pathlib import Path
p=Path('public/catalog/car-models.json'); rows=json.loads(p.read_text()); byid={r['id']:r for r in rows}
for f in Path('../output/keychain-photos').glob('*.json'):
 a=json.loads(f.read_text())
 if not isinstance(a,dict) or not a.get('id'):continue
 r=byid.get(a['id']); solid=f.name.startswith('wall-'); outline=f.name.startswith('outline-'); asset=Path('public/assets/wood-outline-photos' if outline else 'public/assets/wood-wall-photos' if solid else 'public/assets/keychain-photos')/a.get('assetFilename',a['id']+'.webp')
 if r and asset.exists():
  if outline:
   r['photoStyles']['outline']=['/assets/wood-outline-photos/'+name for name in a.get('galleryFilenames',[asset.name])]
   r['photos']['wall']=list(r['photoStyles']['outline'])
  elif solid:r['photoStyles']['engraved']=['/assets/wood-wall-photos/'+asset.name]
  else:r['photos']['keychain']=['/assets/keychain-photos/'+asset.name]
  r['outlineImageProvenance' if outline else 'solidImageProvenance' if solid else 'keychainImageProvenance']={'method':'AI-generated photographic MDF product visualization','modelSpecific':True,'generatedAt':'2026-10-21'}
temporary=Path('../output/keychain-photos/catalog.next.json')
temporary.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
temporary.replace(p)
print(sum(bool(r.get('keychainImageProvenance')) for r in rows),'car keychain photographic previews installed')
