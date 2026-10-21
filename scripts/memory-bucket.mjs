// Ephemeral R2-compatible fixture for local tests only. Never used in production.
export class MemoryBucket{
 map=new Map();
 async put(key,value){const bytes=typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value);this.map.set(key,bytes.slice());}
 async get(key){const b=this.map.get(key);if(!b)return null;return {body:new ReadableStream({start(c){c.enqueue(b.slice());c.close()}}),json:async()=>JSON.parse(new TextDecoder().decode(b)),text:async()=>new TextDecoder().decode(b)};}
 async delete(key){this.map.delete(key);}
 async list({prefix='',limit=1000,cursor}={}){const keys=[...this.map.keys()].filter(k=>k.startsWith(prefix)&&(!cursor||k>cursor)).sort(),part=keys.slice(0,limit);return {objects:part.map(key=>({key})),truncated:keys.length>limit,cursor:part.at(-1)};}
}
