const UPSTREAM='https://autocraft-studio-campus.thatanat4018.chatgpt.site';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 const {pathname:path,search}=new URL(req.url,'https://local.invalid');
 const get=req.method==='GET',post=req.method==='POST';
 const allowed=path==='/api/requests'&&post||/^\/api\/requests\/[a-f0-9-]{36}(?:\/(?:photos|designs)\/\d+)?$/.test(path)&&get||path==='/api/health'&&get||/^\/api\/auth\/(signup|login|logout|recover)$/.test(path)&&post||path==='/api/auth/me'&&get||path==='/api/orders'&&(get||post)||/^\/api\/orders\/[a-f0-9-]{36}(?:\/(?:photos|designs)\/\d+)?$/.test(path)&&get||/^\/api\/orders\/[a-f0-9-]{36}\/(approve|revision|accept-quote)$/.test(path)&&post||path==='/api/events'&&post;
 if(!allowed){res.status(404).json({error:'Not found.'});return;}
 if(post){const origin=req.headers.origin,host=req.headers.host;if(!origin||origin!=='https://'+host&&origin!=='http://'+host){res.status(403).json({error:'Please submit from our website.'});return;}}
 const headers={'origin':UPSTREAM};
 // Never forward user-supplied owner identity or arbitrary security headers.
 for(const key of ['content-type','authorization','cookie'])if(req.headers[key])headers[key]=req.headers[key];
 try{
  const upstream=await fetch(UPSTREAM+path+search,{method:req.method,headers,...(post?{body:req,duplex:'half'}:{}),redirect:'error'});
  res.statusCode=upstream.status;
  res.setHeader('cache-control','private, no-store');res.setHeader('x-content-type-options','nosniff');
  res.setHeader('content-type',upstream.headers.get('content-type')||'application/json');
  const cookie=upstream.headers.get('set-cookie');if(cookie)res.setHeader('set-cookie',cookie);
  const {Readable}=await import('node:stream');Readable.fromWeb(upstream.body).pipe(res);
 }catch{res.status(503).json({error:'Unable to confirm receipt. Please retry; your details have not been cleared.'});}
}
