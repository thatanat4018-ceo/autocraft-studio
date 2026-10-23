"""Optimize a built-in ImageGen output and atomically install a versioned asset."""
import json,sys
from pathlib import Path
from PIL import Image
a=json.loads(sys.argv[1]); root=Path(__file__).resolve().parent.parent
variant=a['variant']; assert variant in ('keychain','solid','outline')
assert Path(a['assetFilename']).name==a['assetFilename'] and a['assetFilename'].endswith('.webp')
directory={'keychain':'keychain-photos','solid':'wood-wall-photos','outline':'wood-outline-photos'}[variant]
output=root.parent/'output/keychain-photos';output.mkdir(exist_ok=True)
target=root/'public/assets'/directory/a['assetFilename'];target.parent.mkdir(exist_ok=True)
im=Image.open(a['path']).convert('RGB');im.thumbnail((1000,1000))
temporary=output/(a['id']+'-'+variant+'-install.tmp.webp');im.save(temporary,'WEBP',quality=90,method=6);temporary.replace(target)
manifest=output/(('wall-' if variant=='solid' else 'outline-' if variant=='outline' else '')+a['id']+'.json')
tmp=manifest.with_suffix('.tmp');tmp.write_text(json.dumps(a,ensure_ascii=False));tmp.replace(manifest)
print(str(target))
