import json,html,cv2,numpy as np,urllib.request
from PIL import Image
from pathlib import Path
ROOT=Path('/Users/notmacbookpro/Documents/ChatGPT/Digital Marketing/output/wood-outline-120');SITE=Path.cwd();OUT=SITE/'public/assets/outline-catalog';OUT.mkdir(exist_ok=True)
code=(ROOT/'build_previews.py').read_text();code=code[code.index('DEFS='):code.index('\nmodels=json.loads')];exec(code)
models=json.loads((ROOT/'expanded-traced.json').read_text());dbp=SITE/'public/catalog/car-models.json';db=json.loads(dbp.read_text())
for m in models:
 if not m.get('outline'):continue
 id=m['id'];o=m['outline'];w,h=o['width'],o['height'];p=o['path'];stem='/assets/outline-catalog/'+id
 mask=np.array(Image.open(ROOT/'masks'/(id+'.png')));pts=np.column_stack(np.where(mask<128)[::-1]).astype(np.int32);hull=cv2.convexHull(pts).reshape(-1,2);back='M'+' '.join(f'{a},{b}' for a,b in hull)+'Z'
 def solid(room=None):
  tw=330 if room else 800;x=310 if room else 100;y=(410 if room else 500)-h/w*tw/2;sc=tw/w;bg='' if room else '<rect width="1000" height="1000" fill="#f4f1e9"/>'
  return svg(m['brand']+' '+m['name']+' full natural MDF engraved wall art digital preview',bg+f'<g filter="url(#shadow)" transform="translate({x},{y}) scale({sc})"><path d="{back}" fill="#795333" stroke="#795333" stroke-width="2" transform="translate(1,2)"/><path d="{back}" fill="url(#wood)" stroke="#956638" stroke-width="1"/><path d="{p}" fill="#684629" fill-rule="evenodd"/></g>')
 for suffix,content in [('wall',line(m)),('room-light',line(m,room='light')),('room-dark',line(m,room='dark')),('natural',line(m,True)),('keychain',keychain(m)),('solid',solid()),('solid-room-light',solid('light')),('solid-room-dark',solid('dark'))]:
  (OUT/f'{id}-{suffix}.svg').write_text(content)
 row=next((x for x in db if x['id']==id),None)
 if not row:row={'id':id,'name':m['name'],'brand':m['brand'],'references':[]};db.append(row)
 row.update(name=m['name'],brand=m['brand'],lineArt=True,f1=bool(m['f1']),photos={'wall':[stem+'-wall.svg',stem+'-room-light.svg',stem+'-room-dark.svg'],'keychain':[stem+'-keychain.svg']},photoStyles={'outline':[stem+'-wall.svg',stem+'-room-light.svg',stem+'-room-dark.svg'],'naturalOutline':[stem+'-natural.svg'],'engraved':[stem+'-solid.svg',stem+'-solid-room-light.svg',stem+'-solid-room-dark.svg']},outlineSource={'url':m['reference'],'title':m['title']},featuredRank=row.get('featuredRank',250+m['rank']))
# Brand artwork from Simple Icons: render as engraved wooden objects, not vendor product photography.
brands=[('BMW','bmw'),('Mercedes','mercedesbenz'),('Audi','audi'),('Honda','honda'),('Toyota','toyota'),('Porsche','porsche'),('Ferrari','ferrari'),('Lamborghini','lamborghini'),('Volkswagen','volkswagen'),('Nissan','nissan'),('Mazda','mazda'),('Subaru','subaru'),('Ford','ford'),('Hyundai','hyundai'),('Kia','kia'),('Mini','mini'),('Tesla','tesla'),('Chevrolet','chevrolet'),('Lexus','lexus'),('Lotus','lotus')]
import re
for brand,slug in brands:
 try:
  raw=urllib.request.urlopen('https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/'+slug+'.svg',timeout=15).read().decode();path=re.search(r'<path d="([^"]+)"',raw).group(1)
 except Exception as e:print('Logo unavailable:',brand);continue
 id='emblem-'+slug;stem='/assets/outline-catalog/'+id
 def emblem(kind):
  key=kind=='keychain';black=kind=='outline';cy=600 if key else 500;r=245 if key else 330;scale=(r*1.45)/24;x=500-12*scale;y=cy-12*scale
  base=f'<rect width="1000" height="1000" fill="#f4f1e9"/><g filter="url(#shadow)"><circle cx="500" cy="{cy+5}" r="{r}" fill="#7c5532"/><circle cx="500" cy="{cy}" r="{r}" fill="url(#wood)" stroke="#8e6539" stroke-width="3"/>'
  if black:base=f'<rect width="1000" height="1000" fill="#f4f1e9"/><g filter="url(#shadow)"><circle cx="500" cy="{cy}" r="{r}" fill="none" stroke="#25221c" stroke-width="17"/>'
  base+=f'<path d="{path}" transform="translate({x},{y}) scale({scale})" fill="'+('#25221c' if black else '#654325')+'"/></g>'
  if key:base+='<path d="M500 360V280" stroke="#9a9d98" stroke-width="13"/><circle cx="500" cy="210" r="82" fill="none" stroke="url(#silver)" stroke-width="12"/><circle cx="500" cy="354" r="11" fill="#f4f1e9" stroke="#785331" stroke-width="3"/>'
  return svg(brand+' emblem '+kind+' MDF product preview',base)
 for kind in ['keychain','solid','outline']:(OUT/(id+'-'+kind+'.svg')).write_text(emblem(kind))
 row=next((x for x in db if x['id']==id),None)
 if row is None:row={'id':id};db.append(row)
 row.update(name='Emblem / logo',brand=brand,badge=True,aliases=['logo','emblem','badge',brand],featuredRank=300,photos={'wall':[stem+'-outline.svg'],'keychain':[stem+'-keychain.svg']},photoStyles={'outline':[stem+'-outline.svg'],'engraved':[stem+'-solid.svg']},assetSource='https://simpleicons.org/')
# Keep all models with customer-facing photos complete across both product sizes and both wall finishes.
# Incomplete legacy entries are custom-directory entries until their exact previews are prepared.
for row in db:
 if not row.get('lineArt') and not row.get('badge') and not row.get('track') and row.get('photos'):
  if not row.get('photoStyles',{}).get('outline'):row['customOnly']=True
for row in db:
 if row.get('badge') and not row['id'].startswith('emblem-'):row['customOnly']=True
 row['aliases']=list(dict.fromkeys(row.get('aliases',[])+([row['brand'],row['name']])))
dbp.write_text(json.dumps(db,ensure_ascii=False,separators=(',',':')))
print('Model-specific full sets:',len(models),'Emblems:',sum(m['id'].startswith('emblem-') for m in db))
