// Separate studio credentials never share the unverified customer account namespace.
const adminJSON=(body,status=200,headers={})=>Response.json(body,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff',...headers}});
const adminHash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const adminGet=async(env,key)=>{const item=await env.BUCKET.get(key);return item?item.json():null;};
const adminPut=(env,key,value)=>env.BUCKET.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json'}});
const adminToken=request=>(request.headers.get('cookie')||'').match(/(?:^|;\s*)ac_admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
const adminCookie=token=>`ac_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${token?28800:0}`;
const trustedSiteOwner=(request,env)=>!!env.STUDIO_OWNER_EMAIL&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.STUDIO_OWNER_EMAIL.toLowerCase();
const adminConfigured=env=>!!env.STUDIO_ADMIN_USERNAME&&/^pbkdf2-sha256\$100000\$[a-f0-9]{64}\$[a-f0-9]{64}$/.test(env.STUDIO_ADMIN_PASSWORD_HASH||'');
function adminEqual(a,b){if(typeof a!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function adminPassword(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return [...new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256))].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function adminSession(request,env){
 if(!env.BUCKET||!adminConfigured(env))return false;
 const token=adminToken(request);if(!token)return false;
 const key='studio/sessions/'+await adminHash(token),s=await adminGet(env,key);
 if(!s)return false;
 if(!Number.isFinite(s.expires)||s.expires<=Date.now()){await env.BUCKET.delete(key);return false;}
 return s.purpose==='studio-admin'&&s.username===env.STUDIO_ADMIN_USERNAME&&adminEqual(s.credentialVersion,await adminHash(env.STUDIO_ADMIN_PASSWORD_HASH));
}
export async function hasStudioAccess(request,env){return trustedSiteOwner(request,env)||await adminSession(request,env);}
async function adminRateLimit(request,env){
 const window=Math.floor(Date.now()/900000),ip=request.headers.get('cf-connecting-ip')||'unknown';
 for(const [scope,limit] of [[await adminHash(ip),10],['all',100]]){
  const key=`studio/login-limits/${window}/${scope}`,record=await adminGet(env,key)||{attempts:0};
  if(record.attempts>=limit)return false;
  await adminPut(env,key,{attempts:record.attempts+1});
 }
 return true;
}
async function adminBody(request){
 const reader=request.body?.getReader();if(!reader)throw new Error('Invalid login request.');
 let size=0;const chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw new Error('Login request is too large.');}chunks.push(value);}
 return JSON.parse(await new Blob(chunks).text());
}
export async function studioAuthRoute(request,env){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/admin/auth/'))return null;
 if(path==='/api/admin/auth/me'&&request.method==='GET')return adminJSON({authenticated:await hasStudioAccess(request,env),via:trustedSiteOwner(request,env)?'site_owner':'password',passwordLoginConfigured:adminConfigured(env)});
 if(!['/api/admin/auth/login','/api/admin/auth/logout'].includes(path)||request.method!=='POST')return adminJSON({error:'Not found.'},404);
 if(request.headers.get('origin')!==new URL(request.url).origin)return adminJSON({error:'Please submit from this website.'},403);
 if(!env.BUCKET)return adminJSON({error:'Studio storage is temporarily unavailable.'},503);
 if(path.endsWith('/logout')){const token=adminToken(request);if(token)await env.BUCKET.delete('studio/sessions/'+await adminHash(token));return adminJSON({ok:true},200,{'set-cookie':adminCookie('')});}
 if(!adminConfigured(env))return adminJSON({error:'Password login has not been configured. Use the site owner sign-in.'},503);
 if(!await adminRateLimit(request,env))return adminJSON({error:'Too many sign-in attempts. Try again in 15 minutes.'},429,{'retry-after':'900'});
 let body;try{body=await adminBody(request);}catch{return adminJSON({error:'Enter your username and password.'},400);}
 const username=typeof body?.username==='string'?body.username.trim():'',password=typeof body?.password==='string'?body.password:'';
 if(username.length>100||password.length<12||password.length>128)return adminJSON({error:'Username or password is incorrect.'},401);
 const [, ,salt,expected]=env.STUDIO_ADMIN_PASSWORD_HASH.split('$'),actual=await adminPassword(password,salt);
 if(!adminEqual(username,env.STUDIO_ADMIN_USERNAME)||!adminEqual(actual,expected))return adminJSON({error:'Username or password is incorrect.'},401);
 const token=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 await adminPut(env,'studio/sessions/'+await adminHash(token),{purpose:'studio-admin',username,credentialVersion:await adminHash(env.STUDIO_ADMIN_PASSWORD_HASH),expires:Date.now()+28800000});
 return adminJSON({authenticated:true},200,{'set-cookie':adminCookie(token)});
}
