import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filteredModels,modelPhotos,finishStyle,sceneBackground} from '../src/catalog/catalog-data.js';
const models=JSON.parse(await readFile('public/catalog/car-models.json','utf8'));
const outlined=models.filter(m=>m.lineArt);
assert.ok(outlined.length>=120,'At least120 model-specific outline previews required');
assert.equal(new Set(outlined.map(m=>m.id)).size,outlined.length);
assert.ok(filteredModels(models,{family:'wall'}).length>=120);
assert.ok(filteredModels(models,{family:'keychain'}).length>=120);
assert.ok(filteredModels(models,{type:'f1'}).length>=12);
assert.ok(filteredModels(models,{type:'f1'}).every(m=>m.f1&&!m.track));
assert.ok(filteredModels(models,{type:'track'}).every(m=>m.track));
for(const brand of ['BMW','Toyota','Porsche','Lamborghini','Ferrari','Lotus','Chevrolet'])assert.ok(outlined.filter(m=>m.brand===brand).length>=6,brand+' collection incomplete');
for(const query of ['GR86','GT86','AE86','Ferrari F40','Corvette C8','Lambo Huracan','porche','covett'])assert.ok(filteredModels(models,{query}).some(m=>m.lineArt),query+' missing');
assert.equal(finishStyle('Black wood / outline cut'),'outline');
const hashes=new Set();let photos=0;
for(const m of outlined){
 assert.ok(m.outlineSource?.url.startsWith('https://petrolvibes.com/products/'));
 assert.equal(modelPhotos(m,'wall','outline').length,3,m.name+' requires isolated/light/dark views');
 assert.ok(modelPhotos(m,'wall','naturalOutline').length);
 assert.ok(modelPhotos(m,'keychain').length);
 for(const source of [...modelPhotos(m,'wall'),...modelPhotos(m,'wall','naturalOutline'),...modelPhotos(m,'keychain')]){
  await access('public'+source.src);const svg=await readFile('public'+source.src,'utf8');assert.ok(svg.startsWith('<svg'));assert.ok(!/<script|javascript:|data:image/.test(svg),'Local vectors must not contain scripts or duplicated raster backdrops');photos++;
 }
 const raw=await readFile('public'+m.outlineVector,'utf8');const d=raw.match(/d="([MQ][^"]+)"/)?.[1];assert.ok(d);hashes.add(createHash('sha256').update(d).digest('hex'));
}
assert.ok(hashes.size>=110,'Do not relabel one silhouette as many models');
assert.match(sceneBackground(modelPhotos(outlined[0],'wall')[1].src),/outline-room-light.jpg/);
console.log(`Expanded collection: ${outlined.length} model-specific outlines, ${hashes.size} distinct geometries, ${photos} gallery views; brand, F1, search, style and asset checks passed.`);
