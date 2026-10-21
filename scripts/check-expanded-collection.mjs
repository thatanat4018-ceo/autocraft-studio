import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filteredModels,modelPhotos,finishStyle,sceneBackground} from '../src/catalog/catalog-data.js';
const models=JSON.parse(await readFile('public/catalog/car-models.json','utf8'));
const outlined=models.filter(m=>m.lineArt&&m.outlineSource?.url.startsWith('https://petrolvibes.com/products/'));
assert.ok(outlined.length>=120,'At least120 model-specific outline previews required');
assert.equal(new Set(outlined.map(m=>m.id)).size,outlined.length);
assert.ok(filteredModels(models,{family:'wall'}).length>=120);
assert.ok(filteredModels(models,{family:'keychain'}).length>=120);
assert.ok(filteredModels(models,{type:'f1'}).length>=12);
assert.ok(filteredModels(models,{type:'f1'}).every(m=>m.f1&&!m.track));
assert.ok(!filteredModels(models,{type:'f1'}).some(m=>/Vantage F1 Edition|1948 Pickup|^F1 1997$|F1 GTR Longtail/.test(m.name)),'Road cars with F1 in the name are not Formula One race cars');
for(const id of ['model-7637970288839','model-7646231888071','model-7615712821447','campus-mercedes-w205']){
 const m=models.find(m=>m.id===id);
 assert.ok(m.keychainImageProvenance?.modelSpecific&&m.solidImageProvenance?.modelSpecific);
 assert.match(modelPhotos(m,'keychain')[0].src,/keychain-photos\/.*\.webp$/);
 assert.match(modelPhotos(m,'wall','engraved')[0].src,/wood-wall-photos\/.*\.webp$/);
 assert.notEqual(modelPhotos(m,'wall','outline')[0].src,modelPhotos(m,'wall','engraved')[0].src,'Outline and full wood must remain different images');
}
assert.ok(filteredModels(models,{type:'track'}).every(m=>m.track));
for(const brand of ['BMW','Toyota','Porsche','Lamborghini','Ferrari','Lotus','Chevrolet'])assert.ok(outlined.filter(m=>m.brand===brand).length>=6,brand+' collection incomplete');
for(const query of ['GR86','GT86','AE86','Ferrari F40','Corvette C8','Lambo Huracan','porche','covett'])assert.ok(filteredModels(models,{query}).some(m=>m.lineArt),query+' missing');
assert.equal(finishStyle('Black wood / outline cut'),'outline');
const hashes=new Set();let photos=0;
for(const m of outlined){
 assert.ok(m.outlineSource?.url.startsWith('https://petrolvibes.com/products/'));
 assert.equal(modelPhotos(m,'wall','outline').length,3,m.name+' requires isolated/light/dark views');
 assert.ok(modelPhotos(m,'wall','engraved').length);
 assert.ok(modelPhotos(m,'keychain').length);
 for(const source of [...modelPhotos(m,'wall'),...modelPhotos(m,'wall','engraved'),...modelPhotos(m,'keychain')]){
  await access('public'+source.src);
  const bytes=await readFile('public'+source.src);
  if(source.src.endsWith('.svg')){const svg=bytes.toString('utf8');assert.ok(svg.startsWith('<svg'));assert.ok(!/<script|javascript:|data:image/.test(svg),'Local vectors must not contain scripts or duplicated raster backdrops')}
  else {assert.match(source.src,/\.(webp|png|jpe?g)$/);assert.ok(bytes.length>5000,'Photographic previews must contain image data');if(source.src.endsWith('.webp')){assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP')}}
  photos++;
 }
 const raw=await readFile('public'+modelPhotos(m,'wall','outline')[0].src,'utf8');const d=raw.match(/d="([MQ][^"]+)"/)?.[1];assert.ok(d);hashes.add(createHash('sha256').update(d).digest('hex'));
}
assert.ok(hashes.size>=110,'Do not relabel one silhouette as many models');
assert.match(sceneBackground(modelPhotos(outlined[0],'wall')[1].src),/outline-room-light.jpg/);
console.log(`Expanded collection: ${outlined.length} model-specific outlines, ${hashes.size} distinct geometries, ${photos} gallery views; brand, F1, search, style and asset checks passed.`);
