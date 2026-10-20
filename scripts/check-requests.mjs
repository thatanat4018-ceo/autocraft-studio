import assert from 'node:assert/strict';
import worker from '../worker/index.js';
class Bucket{data=new Map();async put(key,value){this.data.set(key,typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value))}async get(key){const value=this.data.get(key);return value?{json:async()=>JSON.parse(new TextDecoder().decode(value)),body:value}:null}async delete(key){this.data.delete(key)}async list({prefix}){return {objects:[...this.data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}}}
const env={BUCKET:new Bucket(),STUDIO_OWNER_EMAIL:'owner@example.test'},origin='https://store.example.test';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));
const id=crypto.randomUUID(),token='ab'.repeat(24);
function form(extra={},image=true){const f=new FormData();for(const [k,v]of Object.entries({requestId:id,requestToken:token,name:'Test customer',contactMethod:'email',contact:'customer@example.test',kind:'wall',model:'BMW M4',width:'50',quantity:'1',finish:'Natural wood / outline cut',custom:'yes',consent:'yes',...extra}))f.set(k,v);if(image)f.set('photos',new File([png],'reference.png',{type:'image/png'}));return f}
const send=(data,headers={})=>worker.fetch(new Request(origin+'/api/requests',{method:'POST',headers:{origin,...headers},body:data}),env,{});
let res=await send(form());assert.equal(res.status,201);assert.equal((await res.json()).status,'awaiting_review');assert.equal(env.BUCKET.data.size,2);
res=await send(form());assert.equal(res.status,200);assert.equal(env.BUCKET.data.size,2,'idempotent retry must not duplicate uploads');
res=await worker.fetch(new Request(origin+'/api/requests/'+id),env,{});assert.equal(res.status,404,'anonymous lookup cannot expose a request');
res=await worker.fetch(new Request(origin+'/api/requests/'+id,{headers:{authorization:'Bearer '+token}}),env,{});assert.equal(res.status,200);assert.equal((await res.json()).model,'BMW M4');
res=await worker.fetch(new Request(origin+'/api/studio/requests'),env,{});assert.equal(res.status,403);
res=await worker.fetch(new Request(origin+'/api/studio/requests',{headers:{'oai-authenticated-user-email':env.STUDIO_OWNER_EMAIL}}),env,{});const list=await res.json();assert.equal(list.requests.length,1);assert.equal(list.requests[0].tokenHash,undefined);
res=await send(form({requestId:crypto.randomUUID(),width:'0'}));assert.equal(res.status,400);
res=await send(form({requestId:crypto.randomUUID()},false));assert.equal(res.status,400,'custom reference required');
const svgForm=form({requestId:crypto.randomUUID()},false);svgForm.set('photos',new File(['<svg onload="alert(1)"></svg>'],'bad.svg',{type:'image/svg+xml'}));res=await send(svgForm);assert.equal(res.status,400);
res=await send(form({requestId:crypto.randomUUID()}),{origin:'https://other.example.test'});assert.equal(res.status,403);
const patch=body=>worker.fetch(new Request(origin+'/api/requests/'+id,{method:'PATCH',headers:{origin,'content-type':'application/json','oai-authenticated-user-email':env.STUDIO_OWNER_EMAIL},body:JSON.stringify(body)}),env,{});
res=await patch({status:'quote_sent',reply:'Your wooden design is ready for review.',paymentUrl:'javascript:alert(1)'});assert.equal(res.status,400);
res=await patch({status:'quote_sent',reply:'Your wooden design is ready for review.',paymentUrl:'https://payment.example.test/order'});assert.equal(res.status,200);
res=await worker.fetch(new Request(origin+'/api/requests/'+id,{headers:{authorization:'Bearer '+token}}),env,{});const updated=await res.json();assert.equal(updated.status,'quote_sent');assert.equal(updated.paymentUrl,'https://payment.example.test/order');assert.equal(updated.photos.length,1);
res=await worker.fetch(new Request(origin+'/api/requests/'+id+'/photos/0',{headers:{authorization:'Bearer '+token}}),env,{});assert.equal(res.headers.get('content-type'),'image/png');assert.deepEqual(new Uint8Array(await res.arrayBuffer()),png);
res=await send(form({requestId:crypto.randomUUID(),custom:'no',finish:'Black wood / outline cut'},false));assert.equal(res.status,201,'black MDF outline orders must be accepted');
res=await send(form({requestId:crypto.randomUUID(),custom:'no',finish:'Neon LED'},false));assert.equal(res.status,400,'lighting is not a supported wood product');
console.log('Request checks passed: durable write contract, uploads, idempotency, privacy, owner authorization, validation, reply and payment-link workflow.');
