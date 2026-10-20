import json,re
from pathlib import Path
p=Path('public/catalog/car-models.json');models=json.loads(p.read_text());by={m['id']:m for m in models}
items=[('model-7637970288839','3 Series F30 · 320d / 320i','BMW','bmw-f30',0,['320d','320i','318i','328i','330e','F30','LCI','3 series','sedan']),('campus-mercedes-w205','C-Class W205 · C180 / C200','Mercedes','mercedes-w205',1,['Benz','Mercedes-Benz','C180','C200','C220d','C250','W205','C class','sedan']),('model-8603039203665','3 Series G20 · 320d / 330e','BMW','bmw-g20',2,['320d','330e','330i','M340i','G20','LCI','3 series','sedan']),('model-7646231888071','Civic FE · e:HEV / RS','Honda','honda-civic-fe',3,['FE','2021','2022','2023','2024','2025','2026','RS','eHEV','e:HEV','sedan'])]
for id,name,brand,stem,rank,aliases in items:
 m=by.get(id)
 if not m:m={'id':id,'name':name,'brand':brand,'references':[],'f1':False};models.insert(0,m)
 m.update(name=name,featuredRank=rank,aliases=aliases,conceptGeneration=True,photos={'wall':[f'/assets/catalog/{stem}-wall-warm.jpg',f'/assets/catalog/{stem}-wall-dark.jpg'],'keychain':[f'/assets/catalog/{stem}-keychain.jpg']})
for m in models:
 if m['id']=='model-7648923058375':m['aliases']=['FC','Civic FC','2016','2017','2018','2019','2020','Turbo'];m['featuredRank']=6
 if m['id']=='model-7629009191111':m['aliases']=['E90','320d','320i','325i','LCI'];m['featuredRank']=4
 if m['id']=='model-8598861119825':m['aliases']=['Benz','Mercedes-Benz','W204','C class','coupe'];m['featuredRank']=5
 if m['brand']=='Mercedes':m['aliases']=list(set(m.get('aliases',[])+['benz','Mercedes-Benz']))
# Track references remain clearly labelled source photographs, not MDF samples.
raw=json.loads(Path('../output/petrol-catalog/products-raw.json').read_text());tracks={}
for product in raw:
 title=product['title'];tags=' '.join(product.get('tags',[])).lower()
 if not ('race track' in title.lower() or 'race track' in tags or 'circuit' in tags):continue
 if 'custom' in title.lower():continue
 name=re.sub(r'\s*(?:Black Edition\s*)?(?:Neon Race Track|Race Track.*|Acrylic Print.*|Metal Wall Art.*)$','',title,flags=re.I).strip()
 images=[x['src'] for x in product.get('images',[]) if x.get('src')]
 if not images:continue
 key=name.casefold();ref={'url':'https://petrolvibes.com/products/'+product['handle'],'title':title,'images':images}
 if key in tracks:tracks[key]['references'].append(ref)
 else:tracks[key]={'id':'track-'+str(product['id']),'name':name,'brand':'Racing circuits','references':[ref],'f1':bool(re.search('Monaco|Silverstone|Spa|Suzuka|Monza|Singapore|Bahrain|Yas Marina|Abu Dhabi|Albert Park|Interlagos|Circuit of the Americas|Hungaroring|Imola|Zandvoort|Barcelona',name,re.I)),'track':True,'aliases':['circuit','track','race track','สนาม','สนามแข่ง']}
models=[m for m in models if not m.get('track')]+list(tracks.values());p.write_text(json.dumps(models,ensure_ascii=False,separators=(',',':')))
print('Designs',len(models),'tracks',len(tracks))
