export const studioProducts=[
{id:'gt3',name:'GT3 RS — Track Edition',category:'wall',model:'gt3',price:690,tag:'WALL ART',description:'A wide wing, a low roofline and the unmistakable stance of a track-focused coupe. A laser-cut silhouette for your room, desk wall or garage.'},
{id:'roadster',name:'Open-top Roadster',category:'wall',model:'roadster',price:590,tag:'WALL ART',description:'Open-air lines, captured in a fine laser-cut silhouette. Made for the wall above your favourite corner.'},
{id:'sedan',name:'Sport Sedan — Street Edition',category:'wall',model:'sedan',price:590,tag:'WALL ART',description:'Four doors. Plenty of character. A detailed sport sedan silhouette with clean body lines and an athletic stance.'},
{id:'formula',name:'Formula — Race Day',category:'wall',model:'formula',price:690,tag:'WALL ART',description:'An open-wheel race car captured from the side. Front wing, cockpit and rear wing drawn as a connected silhouette.'},
{id:'circuit',name:'The Racing Circuit',category:'track',model:'circuit',price:490,tag:'RACE TRACK',description:'Bring the racing line home. A sculptural circuit outline in a clean, lightweight laser-cut design.'},
{id:'car-key',name:'Little Coupe Keychain',category:'keys',model:'car-key',price:129,tag:'KEYCHAIN',description:'A tiny coupe for your keys or bag. Natural wood, dark laser engraving and a silver-colour ring.'},
{id:'bmw',name:'BMW Roundel Keychain',category:'keys',model:'bmw',price:149,tag:'KEYCHAIN',description:'Your favourite badge, cut in natural wood. The dark design comes from laser engraving.'},
{id:'mercedes',name:'Three-point Star Keychain',category:'keys',model:'mercedes',price:149,tag:'KEYCHAIN',description:'Open laser-cut geometry, warm wood grain and a silver-colour split ring.'},
{id:'audi',name:'Four Rings Keychain',category:'keys',model:'audi',price:169,tag:'KEYCHAIN',description:'Four connected wooden rings with dark laser-cut edges. A small detail that goes everywhere.'},
{id:'honda',name:'Honda Emblem Keychain',category:'keys',model:'honda',price:129,tag:'KEYCHAIN',description:'A familiar emblem laser engraved on natural wood, ready for your keys or backpack.'},
{id:'toyota',name:'Toyota Emblem Keychain',category:'keys',model:'toyota',price:129,tag:'KEYCHAIN',description:'A wooden emblem keychain with fine dark engraving and silver-colour hardware.'}
];
let references=[];
try{const response=await fetch('/catalog/petrol-reference.json');if(!response.ok)throw new Error('Catalog unavailable');references=await response.json()}catch(e){console.error(e);document.querySelector('#resultCount').textContent='Reference catalog unavailable — reload to try again'}
export const keychainProducts=studioProducts.filter(p=>p.category==='keys');
export const products=[...references,...keychainProducts];
export const isWall=p=>p.category==='wall'||p.category==='track';
