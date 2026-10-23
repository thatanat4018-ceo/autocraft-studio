import {VARIANTS,variantFor} from './pricing.js';
import './custom-studio.css';
const $=s=>document.querySelector(s),money=n=>'฿'+n.toLocaleString('en');
export function initCustomStudio({onVariant}){
 const choices=[...document.querySelectorAll('[data-custom-variant]')];
 const refresh=()=>{const key=variantFor($('#kind').value,$('#finish').value),variant=VARIANTS[key],quantity=Math.min(50,Math.max(1,+$('#quantity').value||1)),custom=$('#customDesign').checked;
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.customVariant===key)));
  $('#customEstimate').replaceChildren();
  for(const [label,value] of [[variant.label+' × '+quantity,money(variant.price*quantity)],['Custom design · charged once',money(custom?50:0)],['Estimated subtotal',money(variant.price*quantity+(custom?50:0))]]){const row=document.createElement('div'),l=document.createElement('span'),v=document.createElement('strong');l.textContent=label;v.textContent=value;row.append(l,v);$('#customEstimate').append(row);}
 };
 choices.forEach(button=>button.onclick=()=>{onVariant(button.dataset.customVariant);refresh();});
 for(const id of ['#quantity','#width','#finish','#kind','#customDesign','#model'])$(id).addEventListener('change',refresh);
 $('#model').addEventListener('input',()=>{$('#selectedDesign').textContent=$('#model').value.trim()||'Your own automotive design';});
 document.addEventListener('ac-custom-reset',refresh);
 refresh();
}
