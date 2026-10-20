import json
from pathlib import Path
p=Path('public/catalog/car-models.json');models=json.loads(p.read_text())
items=[
 ('model-15948389712250','bmw-e90',8,['E90','320d','320i','325i','325d']),
 ('model-15000308908410','bmw-e46',9,['E46 sedan','318i','320i','323i']),
 ('model-8598861119825','benz-w204',10,['C204','C180 coupe','C200 coupe','W204 coupe']),
 ('model-8363992875345','benz-cla',11,['C118','CLA200','CLA250','CLA 200','CLA 250']),
 ('model-7648923058375','civic-fc',12,['FC','Civic FC','Civic sedan 2016','Civic turbo']),
 ('autocraft-civic-fd','civic-fd',13,['Civic FD','FD','2008 Civic sedan']),
 ('autocraft-city-gn','city-gn',14,['City GN','Honda City','City turbo']),
 ('model-7648033341639','gr-yaris',15,['GR Yaris','GRYaris','2020','three door'])
]
new={'autocraft-civic-fd':('Honda','Civic FD · Sedan 2008'),'autocraft-city-gn':('Honda','City GN · Sedan 2020')}
for id,slug,rank,aliases in items:
 m=next((m for m in models if m['id']==id),None)
 if not m:
  brand,name=new[id];m={'id':id,'brand':brand,'name':name,'references':[]};models.append(m)
 paths={family:['/assets/catalog/'+slug+'-'+family+'-v3.jpg'] for family in ['wall','keychain']}
 if not all(Path('public'+src).exists() for paths0 in paths.values() for src in paths0):continue
 m.update(photos=paths,featuredRank=rank,conceptGeneration=True)
 m['aliases']=list(dict.fromkeys(m.get('aliases',[])+aliases))
# Preserve the actual same-body preview for an identically named generation.
for exact,target in [('E90 2012','model-15948389712250'),('325d E90 2008','model-15948389712250'),('E46 Sedan','model-15000308908410'),('GR86 2023','model-7615712821447'),('GR86 2025','model-7615712821447'),('CLE 53 2024','model-16115715572090'),('CLE53 Coupe AMG 2025','model-16115715572090')]:
 m=next((m for m in models if m['name']==exact),None);base=next(m for m in models if m['id']==target)
 if m and base.get('photos'):
  m['photos']=base['photos'];m['previewScope']='Base-generation preview; exact facelift and trim approved before cutting.';m['conceptGeneration']=True
next(m for m in models if m['id']=='autocraft-circuit-study')['featuredRank']=90
p.write_text(json.dumps(models,ensure_ascii=False,separators=(',',':')))
print('Wood preview models:',sum(bool(m.get('photos')) for m in models))
