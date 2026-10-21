"""Rebuild tagged checkout links and matching QR images for a verified live origin."""
import csv,json,os
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
import qrcode
import qrcode.image.svg
origin=os.environ.get('AUTOCRAFT_PUBLIC_ORIGIN','https://autocraft-studio-campus.thatanat4018.chatgpt.site')
base=urlsplit(origin)
if base.scheme!='https' or not base.netloc or base.path not in ('','/'):
 raise ValueError('Use an HTTPS website origin')
p=Path('public/campaigns');links=json.loads((p/'links.json').read_text())
for link in links:
 old=urlsplit(link['url']);link['url']=urlunsplit((base.scheme,base.netloc,old.path or '/',old.query,old.fragment))
 qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=8,border=4);qr.add_data(link['url']);qr.make(fit=True)
 qr.make_image(fill_color='black',back_color='white').save(p/(link['code']+'.png'))
 qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(p/(link['code']+'.svg'))
(p/'links.json').write_text(json.dumps(links,indent=2))
with (p/'links.csv').open('w',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=list(links[0]));writer.writeheader();writer.writerows(links)
print('Updated',len(links),'tagged links and matching QR assets to',origin)
