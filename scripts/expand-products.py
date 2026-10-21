import json,sys,re,concurrent.futures,importlib.util,html
from pathlib import Path
ROOT=Path('/Users/notmacbookpro/Documents/ChatGPT/Digital Marketing/output/wood-outline-120')
spec=importlib.util.spec_from_file_location('trace',ROOT/'trace_outlines.py');trace=importlib.util.module_from_spec(spec);spec.loader.exec_module(trace)
db=json.loads(Path('public/catalog/car-models.json').read_text());done=json.loads((ROOT/'traced.json').read_text());ids={x['id'] for x in done}
def eligible(r):
 t=r['title'].lower();return 'metal' in t and 'wall art' in t and not any(x in t for x in ['neon','acrylic','top view','front','back view','angle','frame'])
priority=['Mercedes','BMW','Honda','Toyota','Audi','Volkswagen','Nissan','Mitsubishi','Mazda','Subaru','Ford','Suzuki','Lexus','Porsche','Lamborghini','Ferrari','Lotus','Chevrolet','McLaren','Aston Martin','Bentley','Mini','Hyundai','Kia','Peugeot','Renault','Alfa Romeo','Dodge','Jaguar']
candidates=[]
for m in sorted(db,key=lambda x:priority.index(x['brand']) if x['brand'] in priority else 100):
 if m['id'] in ids or m.get('badge') or m.get('track'):continue
 refs=[r for r in m.get('references',[]) if eligible(r)]
 if not refs:continue
 r=refs[0]
 candidates.append(dict(id=m['id'],name=m['name'],brand=m['brand'],reference=r['url'],title=r['title'],images=r['images'],rank=200+len(candidates),f1=bool(m.get('f1'))))
# Round-robin brands keeps the expansion broad rather than 80 BMW generations.
selected=[]
for turn in range(30):
 for b in priority:
  group=[x for x in candidates if x['brand']==b]
  if turn<len(group):selected.append(group[turn])
selected=selected[:110]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 result=list(ex.map(trace.process,selected))
good=[m for m in result if m.get('outline')];print('New traced models:',len(good),flush=True)
(ROOT/'expanded-traced.json').write_text(json.dumps(done+good,ensure_ascii=False,separators=(',',':'),default=int))
