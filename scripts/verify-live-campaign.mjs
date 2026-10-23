// Explicitly authorized live QA only. Credentials arrive through hidden stdin, never arguments or files.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {buildAnalyticsReport} from '../public/analytics-report.js';
if(!process.stdin.isTTY)throw new Error('Use an interactive hidden-input session.');
process.stdin.setRawMode(true);process.stdout.write('Ready for hidden QA credentials\n');
const input=await new Promise(resolve=>{let text='';process.stdin.on('data',chunk=>{text+=chunk.toString();if(text.includes('\n')){process.stdin.pause();resolve(JSON.parse(text.trim()));}});});
const {username,password,campaign,outputPath}=input;
assert.match(campaign,/^qa_[0-9]{8}_[a-f0-9]{8}$/);
const origin='https://autocraft-studio-campus.thatanat4018.chatgpt.site';let cookie='';
async function api(path,body){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{origin,cookie,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,200,data.error||path);return {data,headers:r.headers};}
async function events(){let cursor,all=[];do{const {data}=await api('/api/admin/analytics?days=7'+(cursor?'&cursor='+encodeURIComponent(cursor):''));all.push(...data.events);cursor=data.nextCursor;}while(cursor);return all;}
const login=await api('/api/admin/auth/login',{username,password});cookie=login.headers.get('set-cookie').split(';')[0];
try{
 const before=await events(),qa=before.filter(e=>e.last?.campaign===campaign),others=before.filter(e=>e.last?.campaign!==campaign);
 const placements=JSON.parse(await readFile(new URL('../public/campaigns/links.json',import.meta.url)));
 for(const p of placements)assert.ok(qa.some(e=>e.event==='page_view'&&e.last.source===p.source&&e.last.medium===p.medium&&e.last.content===p.content),'Missing real browser landing: '+p.code);
 assert.ok(qa.some(e=>e.event==='view_item'&&e.last.content==='reel_02'));
 assert.ok(qa.some(e=>e.event==='add_to_cart'&&e.last.content==='reel_02'));
 assert.ok(!qa.some(e=>['sign_up','order_submitted','purchase'].includes(e.event)),'QA must not fabricate buyers or sales');
 const report=buildAnalyticsReport(qa);assert.equal(report.channels.length,7);assert.equal(report.totals.visitors,1);assert.equal(report.totals.sessions,7);assert.equal(report.totals.pageViews,7);
 const cleaned=(await api('/api/admin/analytics/test-cleanup',{campaign,confirm:campaign})).data;
 const after=await events(),afterIds=new Set(after.map(e=>e.id));assert.equal(after.filter(e=>e.last?.campaign===campaign).length,0);for(const e of others)assert.ok(afterIds.has(e.id),'Other traffic must remain intact');
 const evidence={campaign,verifiedAt:new Date().toISOString(),testType:'Seven public Vercel browser landings using a separate QA campaign; published QR images decoded separately.',placements:placements.map(p=>({code:p.code,content:p.content,browserLandingVerified:true})),observed:{browsers:report.totals.visitors,sessions:report.totals.sessions,pageViews:report.totals.pageViews,productViews:report.totals.productViews,addToCart:report.totals.cart,signups:0,orders:0,paidOrders:0},cleanup:{deleted:cleaned.deleted,remaining:0,otherTrafficPreserved:true}};
 if(outputPath)await writeFile(outputPath,JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));
}finally{await api('/api/admin/auth/logout',{});}
