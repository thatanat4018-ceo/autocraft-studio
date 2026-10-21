import json,importlib.util
from pathlib import Path
ROOT=Path('/Users/notmacbookpro/Documents/ChatGPT/Digital Marketing/output/wood-outline-120')
spec=importlib.util.spec_from_file_location('trace',ROOT/'trace_outlines.py');t=importlib.util.module_from_spec(spec);spec.loader.exec_module(t)
from PIL import Image
im=Image.open('public/assets/catalog/mercedes-w205-wall-warm.jpg').crop((96,115,1140,465)).resize((700,235));canvas=Image.new('RGB',(1000,1000),'white');canvas.paste(im,(150,350));tmp=ROOT/'w205-staged.png';canvas.save(tmp);r=t.extract(tmp)
if not r:raise Exception('No trace found; preserve original asset.')
mask=r.pop('mask');Image.fromarray(255-mask).save(ROOT/'masks/campus-mercedes-w205.png')
m={'id':'campus-mercedes-w205','brand':'Mercedes','name':'C-Class W205 · C180 / C200','outline':r,'f1':False,'rank':1,'reference':'https://autocraft-studio.vercel.app/','title':'AutoCraft existing generated W205 material preview'}
# Reuse local rendering functions on this one independently sourced material preview.
RENDER=Path('scripts/render-expanded-products.py').read_text();prefix=RENDER[:RENDER.index('\nmodels=json.loads')];exec(prefix)
models=[m];dbp=Path('public/catalog/car-models.json');db=json.loads(dbp.read_text());loop=RENDER[RENDER.index('for m in models:'):RENDER.index('# Brand artwork')];exec(loop)
row=next(m for m in db if m['id']=='campus-mercedes-w205');row.pop('customOnly',None);row['conceptGeneration']=True;row['outlineSource']={'url':'https://autocraft-studio.vercel.app/','title':'AutoCraft generated W205 concept; final variant must be approved before cutting'};row['photoStyles'].pop('naturalOutline',None);dbp.write_text(json.dumps(db,ensure_ascii=False,separators=(',',':')))
print('Prepared W205 three-type previews from existing wood concept.')
