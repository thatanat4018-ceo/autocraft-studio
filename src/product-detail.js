import {modelPhotos,finishStyle,sceneBackground} from './catalog/catalog-data.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createProductDetail({onContinue}){
 const dialog=document.querySelector('#productDialog');let model,kind='wall',index=0,width=30,height='';
 const $=s=>dialog.querySelector(s);
 function paint(){
  const photos=modelPhotos(model,kind,kind==='wall'?finishStyle($('#pdFinish').value):'all');index=Math.min(index,Math.max(0,photos.length-1));
  $('#pdName').textContent=model.brand+' '+model.name;
  $('#pdImage').hidden=!photos.length;$('#pdMissing').hidden=!!photos.length;
  if(photos.length){$('#pdImage').src=photos[index].src;$('#pdZoom').style.backgroundImage=sceneBackground(photos[index].src);$('#pdImage').alt=model.brand+' '+model.name+' wooden '+(kind==='wall'?'wall art':'keychain')+' preview'}
  $('#pdThumbs').innerHTML=photos.map((p,i)=>`<button type="button" data-index="${i}" style="background-image:${p.background}" aria-label="View product image ${i+1}" aria-pressed="${i===index}"><img src="${esc(p.src)}" alt=""></button>`).join('');
  $('#pdThumbs').querySelectorAll('button').forEach(b=>b.onclick=()=>{index=+b.dataset.index;paint()});
  $('#pdSource').innerHTML=model.outlineSource?`Outline reference: <a href="${esc(model.outlineSource.url)}" target="_blank" rel="noopener">Petrol Vibes</a> · adapted as a wood preview.`:'';$('#pdImageCount').textContent=photos.length?`${index+1} / ${photos.length}`:'Custom preview after review';
  $('#pdSize').textContent=kind==='wall'?(+width===30?'30 cm long · height follows your car profile':width+' cm requested · size reviewed with your quote'):(+width===6?'Approx. 6 cm long · silver-colour key ring':width+' cm requested · size reviewed with your quote');
  $('#pdBasePrice').textContent='From ฿'+(kind==='wall'?199:79);
  const quantity=Math.max(1,Math.min(100,+$('#pdQuantity').value||1));
  $('#pdEstimate').textContent='Indicative total ฿'+((kind==='wall'?199:79)*quantity).toLocaleString('en');
  dialog.querySelectorAll('[data-pd-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pdKind===kind)));
 }
 dialog.querySelectorAll('[data-pd-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.pdKind;width=kind==='wall'?30:6;height='';index=0;configureFinish();paint()});
 function configureFinish(){const finish=$('#pdFinish');for(const o of finish.options){o.disabled=kind==='keychain'?o.value!=='Natural wood / dark laser engraving':o.value==='Black wood / outline cut'?!model.photoStyles?.outline?.length:o.value==='Natural wood / outline cut'?!model.photoStyles?.naturalOutline?.length&&!model.lineArt:o.value==='Natural wood / dark laser engraving'?model.lineArt&&!model.photoStyles?.engraved?.length:false}if(!finish.value||finish.selectedOptions[0]?.disabled)finish.value=kind==='wall'&&model.lineArt?'Black wood / outline cut':'Natural wood / dark laser engraving';}
 $('#pdFinish').onchange=()=>{index=0;paint()};
 $('#pdQuantity').oninput=paint;
 $('#pdContinue').onclick=()=>{if(!$('#pdQuantity').reportValidity())return;const order={model,kind,quantity:+$('#pdQuantity').value,width,height,finish:$('#pdFinish').value};dialog.close();onContinue(order)};
 $('#pdZoom').onclick=()=>{if($('#pdImage').hidden)return;document.querySelector('#detailPhoto').src=$('#pdImage').src;document.querySelector('#detailPhoto').alt=$('#pdImage').alt;document.querySelector('#photoDialog').style.backgroundImage=sceneBackground($('#pdImage').src);document.querySelector('#photoDialog').showModal()};
 dialog.addEventListener('close',()=>document.body.classList.remove('product-open'));
 return {open(m,family,options={}){model=m;kind=family;width=options.width||(kind==='wall'?30:6);height=options.height||'';index=0;$('#pdQuantity').value=String(options.quantity||1);$('#pdFinish').value=options.finish||(kind==='wall'&&m.lineArt?'Black wood / outline cut':'Natural wood / dark laser engraving');configureFinish();paint();document.body.classList.add('product-open');dialog.showModal();dialog.scrollTop=0;$('.pd-info').scrollTop=0}};
}
