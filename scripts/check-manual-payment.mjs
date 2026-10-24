import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../dist/server/index.js';
import {MemoryBucket} from './memory-bucket.mjs';
const env={BUCKET:new MemoryBucket(),STUDIO_OWNER_EMAIL:'owner@example.invalid'},origin='https://shop.example.invalid';
async function call(path,method='GET',body,cookie='',admin=false){const headers={origin,cookie};if(admin)headers['oai-authenticated-user-email']=env.STUDIO_OWNER_EMAIL;if(body&&!(body instanceof FormData)){headers['content-type']='application/json';body=JSON.stringify(body)}const r=await worker.fetch(new Request(origin+path,{method,headers,...(body?{body}:{})}),env,{});return {status:r.status,headers:r.headers,body:r.headers.get('content-type')?.includes('json')?await r.json():null};}
const customer=await call('/api/auth/signup','POST',{name:'PAYMENT QA',email:'payment@example.invalid',password:'Payment-test-password-1234',consent:true});assert.equal(customer.status,201);const cookie=customer.headers.get('set-cookie').split(';')[0];
const stranger=await call('/api/auth/signup','POST',{name:'OTHER QA',email:'other@example.invalid',password:'Other-test-password-1234',consent:true});const otherCookie=stranger.headers.get('set-cookie').split(';')[0];
const models=JSON.parse(await readFile(new URL('../public/catalog/car-models.json',import.meta.url))),model=models.find(m=>!m.customOnly&&m.photoStyles?.engraved?.length);
const png=await readFile(new URL('../public/campaigns/ig-bio.png',import.meta.url));
const image=()=>new File([png],'TEST-ONLY-NOT-A-REAL-BANK-SLIP.png',{type:'image/png'});
async function create(custom=false){const f=new FormData();for(const [k,v] of Object.entries({orderId:crypto.randomUUID(),items:JSON.stringify([{modelId:model.id,variant:'solid',quantity:1,width:30,custom,referenceIndexes:custom?[0]:[]}]),delivery:'shipping',name:'PAYMENT QA',contact:'payment@example.invalid',phone:'0000000000',address:'TEST ONLY / NOT FOR DELIVERY',consent:'yes'}))f.set(k,v);if(custom)f.set('photos',image());const r=await call('/api/orders','POST',f,cookie);assert.equal(r.status,201);return r.body.order;}
const o=await create();assert.equal(o.total,299);assert.equal(o.status,'awaiting_payment');assert.ok(o.quoteAcceptedAt);assert.ok(o.items[0].image);
const date=new Date(o.designDueAt+''),local=new Date(+date+7*3600000);assert.ok(![0,6].includes(local.getUTCDay()));
assert.equal((await call('/api/admin/operations','GET',null,cookie)).status,403);
async function upload(id,session=cookie,amount=299,file=image()){const f=new FormData();f.set('slip',file);f.set('amount',amount);return call('/api/orders/'+id+'/slips','POST',f,session);}
assert.equal((await upload(o.id,otherCookie)).status,404);assert.equal((await upload(o.id,cookie,299,new File(['not an image'],'bad.png',{type:'image/png'}))).status,400);
assert.equal((await upload(o.id)).status,201);assert.equal((await call('/api/orders/'+o.id,'GET',null,cookie)).body.order.paid,false);
assert.equal((await call('/api/orders/'+o.id+'/slips/0')).status,404);assert.equal((await call('/api/orders/'+o.id+'/slips/0','GET',null,cookie)).status,200);assert.equal((await call('/api/orders/'+o.id+'/slips/0','GET',null,'',true)).status,200);
const review=(id,decision,amount=299,reason='BANK-QA-UNIQUE-123')=>call('/api/admin/orders/'+id+'/payment-review','POST',{decision,amount,reason},'',true);
assert.equal((await review(o.id,'verified',298)).status,400);
assert.equal((await review(o.id,'rejected',299,'Unreadable slip; please upload a clear image.')).status,200);let ops=(await call('/api/admin/operations','GET',null,'',true)).body;assert.equal(ops.notices.length,1);assert.equal(ops.notices[0].status,'draft');assert.equal(ops.finance.verifiedIncome,0);
await upload(o.id);assert.equal((await review(o.id,'verified')).status,200);assert.equal((await review(o.id,'verified')).status,409);
const o2=await create();await upload(o2.id);assert.equal((await review(o2.id,'verified')).status,409,'duplicate bank ref rejected');assert.equal((await review(o2.id,'cancelled',299,'No valid transfer; contact the store.')).status,200);
const custom=await create(true);assert.equal((await upload(custom.id)).status,409,'custom must approve design and quote first');
assert.equal((await call('/api/admin/expenses','POST',{date:'2026-10-24',description:'TEST MDF',amount:20},'',true)).status,201);ops=(await call('/api/admin/operations','GET',null,'',true)).body;assert.equal(ops.finance.verifiedIncome,299);assert.equal(ops.finance.recordedExpenses,20);assert.equal(ops.finance.netRecordedCash,279);assert.equal(ops.customers.length,2);assert.ok(!JSON.stringify(ops).includes('passwordHash'));assert.ok(!JSON.stringify(ops).includes('recoveryHash'));
console.log('Manual payments passed: signup, catalog checkout/shipping, private slips, image validation, pending not paid, reject/resubmit, verified exact amount, duplicate reference, cancellation draft, custom approval guard, customer privacy, expenses/cash totals and working-day due date. All data in isolated memory.');
