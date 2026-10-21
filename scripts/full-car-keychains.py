import json,html,cv2,numpy as np,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
ROOT=Path('/Users/notmacbookpro/Documents/ChatGPT/Digital Marketing/output/wood-outline-120');out=Path('public/assets/outline-catalog');dbp=Path('public/catalog/car-models.json');db=json.loads(dbp.read_text());rows={m['id']:m for m in db};traced=json.loads((ROOT/'expanded-traced.json').read_text())
# W205 is independently traced from the existing AutoCraft wood concept, not a relabelled coupe.
wp=out/'campus-mercedes-w205-wall.svg'
if wp.exists():
 import re
 text=wp.read_text();d=re.search(r'<path id="shared-path-0" d="([^"]+)"',text)
 if not d:d=re.search(r'<path d="([^"]+)"',text)
 mask=np.array(Image.open(ROOT/'masks/campus-mercedes-w205.png'));traced.append({'id':'campus-mercedes-w205','brand':'Mercedes','name':'C-Class W205 · C180 / C200','f1':False,'outline':{'width':mask.shape[1],'height':mask.shape[0],'path':d.group(1)}})
manifest=[]
for m in traced:
 if not m.get('outline') or m['id'] not in rows:continue
 o=m['outline'];w,h=o['width'],o['height'];p=o['path'];mask=np.array(Image.open(ROOT/'masks'/(m['id']+'.png')));ink=(mask<128).astype(np.uint8)*255
 # Fit the upper wheel arches. Padding allows circle centres below the wall-art crop.
 padded=cv2.copyMakeBorder(ink,0,int(h*.8),0,0,cv2.BORDER_CONSTANT,value=0)
 circles=cv2.HoughCircles(padded,cv2.HOUGH_GRADIENT,1,max(20,w*.18),param1=100,param2=14,minRadius=max(8,int(h*.15)),maxRadius=max(12,int(h*.65)))
 candidates=[] if circles is None else [tuple(map(float,c)) for c in circles[0] if .5*h<c[1]<1.35*h]
 wheels=[]
 for a,b,default in [(.14,.34,.23),(.71,.91,.81)]:
  group=[c for c in candidates if a*w<c[0]<b*w and .20*h<c[2]<.55*h]
  if group:
   def score(c):
    x,y,r=c;hits=0
    for angle in np.linspace(math.pi,2*math.pi,30):
     xx=int(x+r*math.cos(angle));yy=int(y+r*math.sin(angle))
     if 0<=xx<w and 0<=yy<h and np.any(ink[max(0,yy-2):min(h,yy+3),max(0,xx-2):min(w,xx+3)]):hits+=1
    return hits-abs(x/w-default)*65-abs(y/h-.96)*8
   wheel=max(group,key=score)
  else:wheel=(default*w,.94*h,.34*h)
  wheels.append(wheel)
 # Align full tyres to a common road baseline and keep each car's fitted wheelbase.
 radius=sum(r for x,y,r in wheels)/2;radius=max(.29*h,min(.45*h,radius));cy=.97*h;wheels=[(x,cy,radius) for x,y,r in wheels];base=cy+radius
 pts=np.column_stack(np.where(ink>0)[::-1]).astype(np.int32);hull=cv2.convexHull(pts).reshape(-1,2);back='M'+' '.join(f'{a},{b}' for a,b in hull)+'Z';overallH=max(h,base)+12;sc=760/w;x=120;y=530-overallH*sc/2
 wood='url(#wood)';burn='#654324';body=f'<path d="{back}"/>'+''.join(f'<circle cx="{cx}" cy="{cy}" r="{r+5}"/>' for cx,cy,r in wheels)
 art=f'<g transform="translate({x},{y}) scale({sc})" filter="url(#shadow)"><g fill="#795034" stroke="#795034" stroke-width="7" stroke-linejoin="round" transform="translate(1.2,3)">{body}</g><g fill="{wood}" stroke="#986a3c" stroke-width="2" stroke-linejoin="round">{body}</g><path d="{p}" fill="{burn}" fill-rule="evenodd"/>'
 for cx,cy,r in wheels:
  art+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#wood)" stroke="{burn}" stroke-width="3.1"/><circle cx="{cx}" cy="{cy}" r="{r*.77}" fill="none" stroke="{burn}" stroke-width="2"/><circle cx="{cx}" cy="{cy}" r="{r*.66}" fill="none" stroke="{burn}" stroke-width="1.5"/>'
  spokes=8 if m.get('f1') else 5 if m['brand'] in ['Ferrari','Porsche','Lamborghini'] else 10
  for i in range(spokes):
   a=2*math.pi*i/spokes;xx=cx+math.cos(a)*r*.65;yy=cy+math.sin(a)*r*.65;art+=f'<path d="M{cx},{cy}L{xx:.2f},{yy:.2f}" stroke="{burn}" stroke-width="1.9"/>'
  art+=f'<circle cx="{cx}" cy="{cy}" r="{r*.16}" fill="url(#wood)" stroke="{burn}" stroke-width="1.8"/>'
 art+='</g>'
 # Attachment is anchored at the car's rear upper body with a real closed metal ring and chain.
 tx=120+w*.83*sc;ty=y+h*.28*sc;rx=min(860,tx+90);ry=max(120,ty-170)
 tab=f'<circle cx="{tx}" cy="{ty}" r="20" fill="url(#wood)" stroke="#91643a" stroke-width="3"/><circle cx="{tx}" cy="{ty}" r="8" fill="#f2eee6" stroke="#795034" stroke-width="2"/>'
 chain=''
 for i in range(6):
  t=i/5;cx=tx+(rx-tx)*t;cy=ty+(ry+63-ty)*t;chain+=f'<ellipse cx="{cx}" cy="{cy}" rx="10" ry="15" transform="rotate(28 {cx} {cy})" fill="none" stroke="url(#silver)" stroke-width="6"/>'
 ring=f'<circle cx="{rx}" cy="{ry}" r="66" fill="none" stroke="#919692" stroke-width="10"/><circle cx="{rx}" cy="{ry}" r="63" fill="none" stroke="url(#silver)" stroke-width="5"/>'
 defs='<defs><linearGradient id="wood" x2=".8" y2="1"><stop stop-color="#e0bd88"/><stop offset=".55" stop-color="#d0a66f"/><stop offset="1" stop-color="#b98c55"/></linearGradient><linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef0e9"/><stop offset=".3" stop-color="#7a817e"/><stop offset=".5" stop-color="#e4e6df"/><stop offset="1" stop-color="#777e7a"/></linearGradient><filter id="shadow" x="-15%" y="-20%" width="140%" height="160%"><feDropShadow dx="1" dy="4" stdDeviation="2" flood-opacity=".2"/></filter></defs>'
 title=html.escape(m['brand']+' '+m['name']+' full-car wooden keychain preview with complete wheels')
 s=f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><title>{title}</title>{defs}<rect width="1000" height="1000" fill="#f4f1e9"/>{art}{tab}{chain}{ring}</svg>'
 (out/(m['id']+'-keychain.svg')).write_text(s);rows[m['id']]['keychainScope']='Full-car engraving with complete wheels and solid wood backing; variant, wheels and final line details confirmed before production.';manifest.append({'id':m['id'],'wheels':[{'cx':round(cx,2),'cy':round(cy,2),'radius':round(r,2)} for cx,cy,r in wheels]})
dbp.write_text(json.dumps(db,ensure_ascii=False,separators=(',',':')));Path('../output/full-car-keychains-manifest.json').write_text(json.dumps(manifest,indent=2));print('Updated full-car keychains:',len(manifest))
