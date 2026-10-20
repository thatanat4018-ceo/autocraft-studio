import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {filteredModels,modelPhotos,pageNumbers} from '../src/catalog/catalog-data.js';
const models=JSON.parse(await readFile('public/catalog/car-models.json','utf8'));
assert.equal(filteredModels(models)[0].brand,'BMW');
assert.ok(filteredModels(models,{query:'BMW 320d F30 LCI'}).some(m=>m.name.includes('F30')));
assert.ok(filteredModels(models,{query:'Benz W205'}).some(m=>m.name.includes('W205')));
assert.ok(filteredModels(models,{query:'Civic FE'}).some(m=>m.name.includes('FE')));
assert.ok(filteredModels(models,{query:'Monaco',f1Only:true}).some(m=>m.track));
assert.deepEqual(pageNumbers(1,91),[1,2,3,4,5,91]);
assert.deepEqual(pageNumbers(91,91),[1,87,88,89,90,91]);
for(const family of ['wall','keychain'])for(const m of filteredModels(models,{family})){assert.ok(modelPhotos(m,family).length,`${m.name}: photo missing`)}
for(const m of models.filter(m=>m.photos))for(const family of ['wall','keychain'])for(const src of m.photos[family])await access('public'+src);
for(const family of ['wall','keychain']){const previews=filteredModels(models,{family});assert.ok(previews.length>=6);assert.ok(previews.every(m=>modelPhotos(m,family).every(p=>p.src.startsWith('/assets/'))));}
assert.deepEqual(modelPhotos({references:[{images:['https://example.test/neon.jpg']}]},'wall'),[],'Reference metal/neon images must never become product photos');
assert.ok(filteredModels(models,{scope:'all'}).length>2000);
console.log('Catalog: search aliases, regular-car ordering, track search, numbered pages and all photo paths passed.');
