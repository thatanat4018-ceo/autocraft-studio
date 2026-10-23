import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const rows=JSON.parse(await fs.readFile('public/catalog/car-models.json','utf8'));
const state=JSON.parse(await fs.readFile('../output/photo-review/reviews.json','utf8'));
const evidence={};
for(const m of rows.filter(m=>m.lineArt&&!m.customOnly)){
 const review=state.approved[m.id];if(!review)continue;
 const files=[m.photos?.keychain?.[0],m.photoStyles?.engraved?.[0]];if(files.some(x=>!x))continue;
 const stats=await Promise.all(files.map(x=>fs.stat(path.join('public',x))));
 if(stats.map(s=>s.mtimeMs+':'+s.size).join('|')!==review.version)continue;
 const hashes=await Promise.all(files.map(async x=>crypto.createHash('sha256').update(await fs.readFile(path.join('public',x))).digest('hex')));
 evidence[m.id]={keychain:hashes[0],solid:hashes[1],reviewedAt:review.reviewedAt};
}
await fs.writeFile('docs/product-photo-reviews.json',JSON.stringify(evidence,null,2)+'\n');
console.log(`${Object.keys(evidence).length} current visual reviews exported with content hashes`);
