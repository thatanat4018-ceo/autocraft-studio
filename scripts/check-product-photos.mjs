// Content-based release audit: portable across Git checkouts and deployments.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const rows=JSON.parse(await fs.readFile('public/catalog/car-models.json','utf8'));
const cars=rows.filter(m=>m.lineArt&&!m.customOnly);
const failures=[];let complete=0,reviewed=0;
const evidence=JSON.parse(await fs.readFile('docs/product-photo-reviews.json','utf8').catch(()=>'{}'));
for(const m of cars){
 const images={keychain:m.photos?.keychain?.[0],solid:m.photoStyles?.engraved?.[0],outline:m.photoStyles?.outline?.[0]};
 const hashes={};let ok=true;
 for(const [kind,url] of Object.entries(images)){
  if(!url?.startsWith('/assets/')||url.includes('..')){failures.push(`${m.id}: missing ${kind}`);ok=false;continue;}
  try{const data=await fs.readFile(path.join('public',url));hashes[kind]=crypto.createHash('sha256').update(data).digest('hex');
   if(kind!=='outline'&&(!/\.webp$/.test(url)||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP')){failures.push(`${m.id}: ${kind} must be a generated WebP photograph`);ok=false;}
  }catch{failures.push(`${m.id}: missing file ${url}`);ok=false;}
 }
 if(!m.keychainImageProvenance?.modelSpecific||!m.solidImageProvenance?.modelSpecific){ok=false;failures.push(`${m.id}: missing model-specific image provenance`);}
 if(images.keychain===images.solid||images.outline===images.solid){ok=false;failures.push(`${m.id}: variants reuse the same image`);}
 if(ok)complete++;
 if(ok&&evidence[m.id]?.keychain===hashes.keychain&&evidence[m.id]?.solid===hashes.solid)reviewed++;
 else failures.push(`${m.id}: current photographs still need visual review evidence`);
}
console.log(JSON.stringify({cars:cars.length,photographed:complete,visuallyReviewed:reviewed,issues:failures.length},null,2));
if(process.argv.includes('--require-complete')&&(cars.length<200||failures.length)){console.error(failures.join('\n'));process.exitCode=1;}
