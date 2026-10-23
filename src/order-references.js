// Files stay in memory until checkout; private reference images never enter localStorage.
export function prepareOrderReferences(cart,referencesByLine,fallback=[]){
 const files=[],indexes=new Map();
 const items=cart.map(item=>{if(!item.custom)return {...item,referenceIndexes:[]};
  const references=referencesByLine.get(item.lineId)||fallback;
  if(!references.length)throw new Error('Attach a reference image for '+item.name+'. Images need to be attached again after a page refresh.');
  const referenceIndexes=references.map(file=>{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use JPG, PNG or WebP reference images.');if(!indexes.has(file)){indexes.set(file,files.length);files.push(file);}return indexes.get(file);});
  return {...item,referenceIndexes};
 });
 if(files.length>3||files.reduce((n,f)=>n+f.size,0)>4*1024*1024)throw new Error('An order can include up to 3 reference images, 4 MB total. Split additional custom designs into another order.');
 return {items,files};
}
