import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildAnalyticsReport,reportCSV} from '../public/analytics-report.js';
import worker from '../dist/server/index.js';
import {MemoryBucket} from './memory-bucket.mjs';
const placements=JSON.parse(await readFile(new URL('../public/campaigns/links.json',import.meta.url)));
assert.equal(placements.length,7);for(const p of placements){const url=new URL(p.url);assert.equal(url.origin,'https://autocraft-studio.vercel.app');for(const k of ['source','medium','campaign','content'])assert.equal(url.searchParams.get('utm_'+k),p[k]);}
const visitor=crypto.randomUUID(),s1=crypto.randomUUID(),s2=crypto.randomUUID(),events=[];
const add=(event,session,placement,value=0)=>events.push({id:crypto.randomUUID(),at:new Date().toISOString(),event,session,visitor,last:placement,page:'collection',value});
add('page_view',s1,placements[0]);add('view_item',s1,placements[0]);add('engaged',s1,placements[0]);add('sign_up',s1,placements[0]);add('add_to_cart',s1,placements[0]);add('begin_checkout',s1,placements[0]);add('order_submitted',s1,placements[0]);add('order_submitted',s1,placements[0]);add('purchase',s1,placements[0],249);add('page_view',s2,placements[2]);events.push(events[0]);
const report=buildAnalyticsReport(events,placements);assert.equal(report.channels.length,7);assert.equal(report.totals.visitors,1,'global visitors are not summed across links');assert.equal(report.totals.sessions,2);assert.equal(report.totals.pageViews,2,'duplicate event IDs are deduplicated');assert.equal(report.totals.conversionRate,50);assert.equal(report.channels.find(c=>c.code==='ig-bio').conversionRate,100,'two orders from one session do not make 200% conversion');assert.equal(report.channels.find(c=>c.code==='booth-qr-01').sessions,0,'zero-visit QR stays visible');assert.equal(report.totals.paidOrders,1);assert.equal(report.totals.revenue,249);assert.equal(buildAnalyticsReport([events.find(e=>e.event==='purchase')]).totals.sessions,0,'later payment confirmation does not create another visit');assert.ok(reportCSV([{title:'=formula'}],['title']).includes("'=formula"),'CSV formula cells are escaped');
const origin='https://shop.example.invalid',bucket=new MemoryBucket(),env={BUCKET:bucket,STUDIO_OWNER_EMAIL:'owner@example.invalid'},qa='qa_20261023_a1b2c3d4';
const publicAttr={consent:true,visitor:crypto.randomUUID(),session:crypto.randomUUID(),first:placements[0],last:placements[0]},qaAttr={...publicAttr,last:{...placements[2],campaign:qa}};
async function call(path,body,owner=false,requestOrigin=origin){const r=await worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{origin:requestOrigin,'content-type':'application/json',...(owner?{'oai-authenticated-user-email':env.STUDIO_OWNER_EMAIL}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,body:await r.json()};}
assert.equal((await call('/api/events',{event:'page_view',eventId:crypto.randomUUID(),attribution:publicAttr,page:'collection'})).status,202);assert.equal((await call('/api/events',{event:'page_view',eventId:crypto.randomUUID(),attribution:qaAttr,page:'collection'})).status,202);
assert.equal((await call('/api/admin/analytics/test-cleanup',{campaign:qa,confirm:qa})).status,403);
assert.equal((await call('/api/admin/analytics/test-cleanup',{campaign:'campus_launch',confirm:'campus_launch'},true)).status,400,'cannot delete real campaign data');
assert.equal((await call('/api/admin/analytics/test-cleanup',{campaign:qa,confirm:'wrong'},true)).status,400);
assert.equal((await call('/api/admin/analytics/test-cleanup',{campaign:qa,confirm:qa},true,'https://evil.example')).status,403);
const cleaned=await call('/api/admin/analytics/test-cleanup',{campaign:qa,confirm:qa},true);assert.equal(cleaned.body.deleted,1);
const remaining=(await call('/api/admin/analytics?days=7',null,true)).body.events;assert.equal(remaining.length,1);assert.equal(remaining[0].last.campaign,'campus_launch');
console.log('Campaign measurement passed: 7 registered URLs, deduplicated global/link totals, zero rows, signup/order/payment separation, real conversion denominator, CSV safety and exact QA-only cleanup with authorization/CSRF.');

for(const kind of ['summary','links']){const url=origin+'/api/admin/analytics/export?days=7&type='+kind;const anonymous=await worker.fetch(new Request(url),env,{});assert.equal(anonymous.status,403);const response=await worker.fetch(new Request(url,{headers:{'oai-authenticated-user-email':env.STUDIO_OWNER_EMAIL}}),env,{});assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/attachment/);const csv=await response.text();assert.ok(csv.includes(kind==='summary'?'Measured page views':'Instagram profile bio'));assert.ok(!csv.includes(qa));}
console.log('Authenticated server CSV exports passed for combined summary and every registered link.');
