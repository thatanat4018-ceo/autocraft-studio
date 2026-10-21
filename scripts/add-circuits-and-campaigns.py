import json,math,html,csv
from pathlib import Path
from urllib.parse import urlencode
p=Path('public/catalog/car-models.json');db=json.loads(p.read_text());out=Path('public/assets/outline-catalog')
def svg(title,s):return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><title>'+html.escape(title)+'</title><defs><linearGradient id="wood" x2=".8" y2="1"><stop stop-color="#dbb983"/><stop offset="1" stop-color="#b88b52"/></linearGradient><filter id="shadow"><feDropShadow dx="3" dy="7" stdDeviation="4" flood-opacity=".2"/></filter></defs><rect width="1000" height="1000" fill="#f4f1e9"/>'+s+'</svg>'
geo=json.load(open('../output/f1-circuits-source.json'))
for feature in geo['features'][:30]:
 props=feature['properties'];coords=feature['geometry']['coordinates'];
 if feature['geometry']['type']!='LineString' or not coords:continue
 latitude=sum(p[1] for p in coords)/len(coords);points=[(p[0]*math.cos(math.radians(latitude)), -p[1]) for p in coords];xmin=min(x for x,y in points);xmax=max(x for x,y in points);ymin=min(y for x,y in points);ymax=max(y for x,y in points);sc=650/max(xmax-xmin,ymax-ymin);w=(xmax-xmin)*sc;h=(ymax-ymin)*sc
 path='M'+' L'.join(f'{(x-xmin)*sc+500-w/2:.2f},{(y-ymin)*sc+500-h/2:.2f}' for x,y in points)+' Z'
 id='circuit-'+props['id'];stem='/assets/outline-catalog/'+id;name=props['Name'];title=name+' MDF circuit digital preview'
 black=f'<path d="{path}" fill="none" stroke="#25221c" stroke-width="17" stroke-linejoin="round" filter="url(#shadow)"/>'
 solid=f'<rect x="95" y="95" width="810" height="810" rx="30" fill="url(#wood)" stroke="#93643b" stroke-width="5" filter="url(#shadow)"/><path d="{path}" fill="none" stroke="#67472c" stroke-width="8" stroke-linejoin="round"/><text x="500" y="850" text-anchor="middle" fill="#67472c" font-size="22" font-family="sans-serif">{html.escape(name)}</text>'
 key=f'<circle cx="500" cy="175" r="72" fill="none" stroke="#989c99" stroke-width="12"/><path d="M500 247V310" stroke="#939895" stroke-width="10"/><circle cx="500" cy="600" r="275" fill="url(#wood)" stroke="#93643b" stroke-width="5" filter="url(#shadow)"/><g transform="translate(175,275) scale(.65)"><path d="{path}" fill="none" stroke="#67472c" stroke-width="10" stroke-linejoin="round"/></g>'
 for variant,body in [('outline',black),('solid',solid),('keychain',key)]: (out/(id+'-'+variant+'.svg')).write_text(svg(title+' '+variant,body))
 db.append({'id':id,'brand':'Race circuits','name':name,'track':True,'aliases':[props.get('Location',''),name,'F1','track','circuit'],'featuredRank':220,'photos':{'wall':[stem+'-outline.svg'],'keychain':[stem+'-keychain.svg']},'photoStyles':{'outline':[stem+'-outline.svg'],'engraved':[stem+'-solid.svg']},'assetSource':'https://github.com/bacinger/f1-circuits','previewScope':'GeoJSON-derived circuit layout; source configuration, not an assertion of the latest race layout.'})
# Three-point geometric emblem engraved in MDF, with an independent wood outline view.
id='emblem-mercedesbenz';stem='/assets/outline-catalog/'+id
for variant in ['solid','outline','keychain']:
 key=variant=='keychain';scale=.64 if key else 1;shape='<circle cx="500" cy="500" r="295" fill="none" stroke="COLOR" stroke-width="20"/><path d="M500 205L535 480L755 648L500 540L245 648L465 480Z" fill="COLOR"/>'
 shape=shape.replace('COLOR','#28231c' if variant=='outline' else '#65462b');bg='' if variant=='outline' else '<circle cx="500" cy="500" r="330" fill="url(#wood)" stroke="#93643b" stroke-width="5"/>'
 body=f'<g transform="translate({180 if key else 0},{270 if key else 0}) scale({scale})" filter="url(#shadow)">{bg}{shape}</g>'
 if key:body+='<circle cx="500" cy="220" r="80" fill="none" stroke="#979b98" stroke-width="12"/><path d="M500 300V380" stroke="#979b98" stroke-width="10"/>'
 (out/(id+'-'+variant+'.svg')).write_text(svg('Mercedes three-point emblem MDF '+variant+' digital preview',body))
db.append({'id':id,'brand':'Mercedes','name':'Three-point star emblem / logo','badge':True,'aliases':['logo','emblem','Mercedes Benz','Benz'],'featuredRank':280,'photos':{'wall':[stem+'-outline.svg'],'keychain':[stem+'-keychain.svg']},'photoStyles':{'outline':[stem+'-outline.svg'],'engraved':[stem+'-solid.svg']}})
for m in db:
 if m['id']=='autocraft-circuit-study':m['customOnly']=True
p.write_text(json.dumps(db,ensure_ascii=False,separators=(',',':')))
links=[]
for code,source,medium,content,title in [('ig-bio','instagram','social','profile_bio','Instagram profile bio'),('ig-post-01','instagram','social','post_01','Instagram post 01'),('ig-reel-01','instagram','social','reel_01','Instagram Reel 01'),('ig-story-01','instagram','social','story_01','Instagram Story 01'),('booth-qr-01','muic_booth','qr','booth_sign_01','MUIC booth sign QR'),('ig-post-qr-01','instagram','qr','post_qr_01','QR printed in Instagram post'),('ig-reel-02','instagram','social','reel_02','Instagram Reel 02')]:
 links.append(dict(code=code,title=title,source=source,medium=medium,campaign='campus_launch',content=content,url='https://autocraft-studio.vercel.app/?'+urlencode({'utm_source':source,'utm_medium':medium,'utm_campaign':'campus_launch','utm_content':content})+'#collection'))
Path('public/campaigns').mkdir(exist_ok=True);Path('public/campaigns/links.json').write_text(json.dumps(links,indent=2))
with open('public/campaigns/links.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(links[0]));w.writeheader();w.writerows(links)
print('Circuit previews:',len([m for m in db if m.get('track') and not m.get('customOnly')]),'ready products:',len([m for m in db if not m.get('customOnly') and m.get('photos',{}).get('wall')]))
