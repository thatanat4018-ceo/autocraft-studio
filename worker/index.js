import {commerceRoute} from './commerce.js';
import {hasStudioAccess,studioAuthRoute} from './admin-auth.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const text=(value,max=500)=>String(value||'').trim().slice(0,max);
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const validID=id=>/^[a-f0-9-]{36}$/.test(id);
const owner=hasStudioAccess;
const sameOrigin=request=>request.headers.get('origin')===new URL(request.url).origin;
async function readRecord(env,id){if(!validID(id))return null;const object=await env.BUCKET.get('requests/'+id+'.json');return object?object.json():null}
async function authorized(request,env,record){if(await owner(request,env))return true;const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';return token.length===48&&await hash(token)===record.tokenHash}
async function boundedForm(request){const max=16*1024*1024;if(+request.headers.get('content-length')>max)throw new Error('UPLOAD_TOO_LARGE');const reader=request.body?.getReader();if(!reader)throw new Error('EMPTY_REQUEST');let size=0,chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('UPLOAD_TOO_LARGE')}chunks.push(value)}return new Response(new Blob(chunks),{headers:{'content-type':request.headers.get('content-type')||''}}).formData()}
function typeOf(bytes){if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return ['image/jpeg','jpg'];if(bytes.length>=8&&bytes.slice(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i]))return ['image/png','png'];if(bytes.length>=12&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return ['image/webp','webp'];return null}
async function createRequest(request,env){
 if(!sameOrigin(request))return json({error:'Please submit from our website.'},403);
 if(!env.BUCKET)return json({error:'Requests are temporarily unavailable. Your form has not been sent.'},503);
 const form=await boundedForm(request);if(form.get('website'))return json({error:'Unable to submit this request.'},400);
 const id=text(form.get('requestId'),36),token=text(form.get('requestToken'),48);if(!validID(id)||!/^[a-f0-9]{48}$/.test(token))return json({error:'Please reload and try again.'},400);
 const tokenHash=await hash(token),existing=await readRecord(env,id);if(existing)return existing.tokenHash===tokenHash?json({id,received:true,status:existing.status}):json({error:'Invalid request identifier.'},409);
 const name=text(form.get('name'),100),contactMethod=text(form.get('contactMethod'),20),contact=text(form.get('contact'),180),kind=text(form.get('kind'),20),model=text(form.get('model'),180),notes=text(form.get('notes'),2000),finish=text(form.get('finish'),80);
 const width=Number(form.get('width')),height=form.get('height')?Number(form.get('height')):null,quantity=Number(form.get('quantity'));
 if(!name||!contact||!['email','line','phone','whatsapp'].includes(contactMethod)||!['wall','keychain'].includes(kind)||!model||!Number.isFinite(width)||width<2||width>150||height!==null&&(!Number.isFinite(height)||height<2||height>150)||!Number.isInteger(quantity)||quantity<1||quantity>100)return json({error:'Check your name, contact, design, dimensions and quantity.'},400);
 if(contactMethod==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))return json({error:'Enter a valid email address.'},400);
 if(!['Natural wood / dark laser engraving','Natural wood / outline cut','Black wood / outline cut'].includes(finish))return json({error:'Choose a wood finish.'},400);
 const files=form.getAll('photos').filter(f=>typeof f!=='string'&&f.size);if(files.length>3||files.some(f=>f.size>5*1024*1024))return json({error:'Upload up to 3 images, no larger than 5 MB each.'},400);
 if(form.get('custom')==='yes'&&!files.length)return json({error:'Attach a reference image for your custom design.'},400);
 if(form.get('consent')!=='yes')return json({error:'Please allow us to use these details to review and reply to your request.'},400);
 const ip=request.headers.get('cf-connecting-ip');let rateKey,rate;
 if(ip){rateKey='limits/'+await hash(ip+new Date().toISOString().slice(0,13));const obj=await env.BUCKET.get(rateKey);rate=obj?await obj.json():{count:0};if(rate.count>=10)return json({error:'Too many requests. Please try again in an hour.'},429)}
 const attachments=[],buffers=[];for(const f of files){const bytes=new Uint8Array(await f.arrayBuffer()),type=typeOf(bytes);if(!type)return json({error:'Only valid JPG, PNG and WebP images are accepted.'},400);buffers.push(bytes);attachments.push({key:`uploads/${id}/${crypto.randomUUID()}.${type[1]}`,name:text(f.name,120),type:type[0],size:f.size})}
 const record={id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'awaiting_review',name,contactMethod,contact,kind,model,width,height,quantity,finish,notes,custom:form.get('custom')==='yes',attachments,tokenHash,reply:'',paymentUrl:''};
 try{for(let i=0;i<attachments.length;i++)await env.BUCKET.put(attachments[i].key,buffers[i],{httpMetadata:{contentType:attachments[i].type}});await env.BUCKET.put('requests/'+id+'.json',JSON.stringify(record),{httpMetadata:{contentType:'application/json'}});if(rateKey)await env.BUCKET.put(rateKey,JSON.stringify({count:rate.count+1}));}catch(e){console.error('Request storage failed',e);if(!await readRecord(env,id))await Promise.allSettled(attachments.map(f=>env.BUCKET.delete(f.key)));return json({error:'We could not confirm receipt. Your form is still here; please retry.'},503)}
 return json({id,received:true,status:'awaiting_review'},201)
}
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 try{
 const auth=await studioAuthRoute(request,env);if(auth)return auth;
 const commerce=await commerceRoute(request,env);if(commerce)return commerce;
 if(path==='/api/health')return json({requestsAvailable:!!env.BUCKET,studioConfigured:!!env.STUDIO_OWNER_EMAIL});
 if(path==='/api/requests'&&request.method==='POST')return await createRequest(request,env);
 if(path==='/api/studio/requests'&&request.method==='GET'){
  if(!await owner(request,env))return json({error:'Store owner sign-in required.'},403);if(!env.BUCKET)return json({error:'Storage unavailable.'},503);
  const listing=await env.BUCKET.list({prefix:'requests/',limit:100,cursor:url.searchParams.get('cursor')||undefined});const records=await Promise.all(listing.objects.map(o=>env.BUCKET.get(o.key).then(v=>v?.json())));return json({requests:records.filter(Boolean).map(({tokenHash,...record})=>record).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),cursor:listing.truncated?listing.cursor:null})
 }
 const match=path.match(/^\/api\/requests\/([a-f0-9-]{36})(?:\/photos\/(\d+))?$/);
 if(match){
  if(!env.BUCKET)return json({error:'Storage unavailable.'},503);const record=await readRecord(env,match[1]);if(!record||!await authorized(request,env,record))return json({error:'Request not found or access denied.'},404);
  if(match[2]!==undefined&&request.method==='GET'){const f=record.attachments[+match[2]],object=f&&await env.BUCKET.get(f.key);if(!object)return json({error:'Photo not found.'},404);return new Response(object.body,{headers:{'content-type':f.type,'cache-control':'private, no-store','x-content-type-options':'nosniff','content-disposition':'inline'}})}
  if(request.method==='GET'){const {tokenHash,attachments,...visible}=record;return json({...visible,photos:attachments.map(({name,type,size})=>({name,type,size}))})}
  if(request.method==='PATCH'){
   if(!await owner(request,env)||!sameOrigin(request))return json({error:'Store owner access required.'},403);const body=await request.json();if(!['awaiting_review','quote_sent','approved','in_production','completed','closed'].includes(body.status))return json({error:'Invalid status.'},400);
   const paymentUrl=text(body.paymentUrl,2000);if(paymentUrl){let parsed;try{parsed=new URL(paymentUrl)}catch{return json({error:'Enter a valid HTTPS payment link.'},400)}if(parsed.protocol!=='https:')return json({error:'Payment links must use HTTPS.'},400)}
   await env.BUCKET.put('requests/'+record.id+'.json',JSON.stringify({...record,status:body.status,reply:text(body.reply,4000),paymentUrl,updatedAt:new Date().toISOString()}));return json({saved:true})
  }
 }
 if(path.startsWith('/api/'))return json({error:'Not found.'},404);
 if(path==='/admin')return Response.redirect(new URL('/admin.html',request.url),302);
 if(path==='/'||path==='/studio')return new Response(INDEX_HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
 if(env.ASSETS)return env.ASSETS.fetch(request);
 // Static assets are also served by the Sites asset layer. The entry document is a fallback for browser routes.
 if(path==='/'||path==='/studio')return new Response(INDEX_HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
 return new Response('Not found',{status:404});
 }catch(e){console.error('Request handler failed',e);return json({error:e.message==='UPLOAD_TOO_LARGE'?'Images exceed the 15 MB upload limit.':'This service is temporarily unavailable. Your details have not been cleared.'},e.message==='UPLOAD_TOO_LARGE'?413:503)}
}};
