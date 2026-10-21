export const PAGE_SIZE=12;
export function searchText(m){return `${m.brand} ${m.name} ${(m.aliases||[]).join(' ')}`.toLowerCase().normalize('NFKC')}
export function matchesModel(m,query){const terms=query.toLowerCase().trim().replace(/mercedes[- ]benz|\bbenz\b|เบนซ์/g,'mercedes').replace(/\bporche\b/g,'porsche').replace(/\blambo\b/g,'lamborghini').replace(/\bcorvett?\b|\bcovett\b/g,'corvette').replace(/บีเอ็ม/g,'bmw').split(/\s+/).filter(Boolean);return terms.every(t=>searchText(m).includes(t))}
export function rankModel(m){if(m.featuredRank!=null)return m.featuredRank;const b=m.brand,n=m.name; if(b==='BMW'&&/F30|G20|E90|E46/.test(n))return 20;if(b==='Mercedes'&&/C[ -]?(180|200|220|250|300)|W20[456]|CLA/.test(n))return 30;if(b==='Honda'&&/Civic|City|Accord/.test(n)&&!/Type R|TCR/.test(n))return 40;if(b==='Toyota'&&/Corolla|Yaris|Camry/.test(n)&&!/GR|AE86/.test(n))return 45;if(b==='Audi'&&/^A[345]/.test(n))return 50;if(m.track)return 90;return 100}
export function modelPhotos(m,family,style='all'){
 let sources=m?.photos?.[family]||[];
 if(family==='wall'&&style!=='all')sources=m?.photoStyles?.[style]||(style==='engraved'&&!m?.lineArt?sources:[]);
 return sources.map(src=>({src,concept:true,background:sceneBackground(src)}));
}
export function sceneBackground(src){return src?.includes('-room-light.svg')?'url(/assets/catalog/outline-room-light.jpg)':src?.includes('-room-dark.svg')?'url(/assets/catalog/outline-room-dark.jpg)':'none'}
export function finishStyle(finish){return finish==='Black wood / outline cut'?'outline':finish==='Natural wood / outline cut'?'naturalOutline':'engraved'}
export function filteredModels(models,{query='',brand='all',family='wall',f1Only=false,sort='featured',scope='previews',style='all',type='all'}={}){
 let list=models.filter(m=>!m.customOnly&&(m.photos?.[family]?.length)&&(brand==='all'||m.brand===brand)&&(!f1Only||m.f1||m.track)&&(type==='f1'?m.f1&&!m.track:type==='track'?m.track:type==='logo'?m.badge:true)&&(family!=='wall'||style==='all'||modelPhotos(m,family,style).length)&&matchesModel(m,query));
 if(scope==='previews'&&!query.trim()){const seen=new Set();list=list.filter(m=>{const key=modelPhotos(m,family,style)[0]?.src;if(seen.has(key))return false;seen.add(key);return true})}
 return list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='brand'?a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name):rankModel(a)-rankModel(b)||a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name))
}
export function pageNumbers(page,total){const start=Math.max(1,Math.min(page-2,total-4));return [...new Set([1,...Array.from({length:Math.min(5,total)},(_,i)=>start+i),total])].sort((a,b)=>a-b)}
