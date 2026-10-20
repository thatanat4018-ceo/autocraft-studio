const UPSTREAM='https://autocraft-studio-campus.thatanat4018.chatgpt.site';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 const path=new URL(req.url,'https://local.invalid').pathname;
 const allowed=path==='/api/requests'&&req.method==='POST'||/^\/api\/requests\/[a-f0-9-]{36}(?:\/photos\/\d+)?$/.test(path)&&req.method==='GET'||path==='/api/health'&&req.method==='GET';
 if(!allowed){res.status(404).json({error:'Not found.'});return;}
 if(req.method==='POST'){
  const origin=req.headers.origin; const host=req.headers.host;
  if(!origin||origin!=='https://'+host&&origin!=='http://'+host){res.status(403).json({error:'Please submit from our website.'});return;}
 }
 const headers={'origin':UPSTREAM};
 for(const key of ['content-type','authorization'])if(req.headers[key])headers[key]=req.headers[key];
 try{
  const upstream=await fetch(UPSTREAM+path,{method:req.method,headers,...(req.method==='POST'?{body:req,duplex:'half'}:{}) ,redirect:'error'});
  res.statusCode=upstream.status;
  res.setHeader('cache-control','private, no-store');res.setHeader('x-content-type-options','nosniff');
  res.setHeader('content-type',upstream.headers.get('content-type')||'application/json');
  const {Readable}=await import('node:stream');Readable.fromWeb(upstream.body).pipe(res);
 }catch{res.status(503).json({error:'Unable to confirm receipt. Please retry; your form has not been cleared.'});}
}
