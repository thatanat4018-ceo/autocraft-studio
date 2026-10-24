const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const help={'ig-bio':'Put this in the Instagram profile bio.','ig-post-01':'Use for Post 01 via a clickable placement or a corresponding bio link.','ig-reel-01':'Use for Reel 01 via a clickable placement or a corresponding bio link.','ig-reel-02':'Use for Reel 02, separately from Reel 01.','ig-story-01':'Use in the Story 01 link sticker.','booth-qr-01':'Print this QR on the MUIC booth sign.','ig-post-qr-01':'Place this QR inside the Instagram post image.'};
let ready=false;
async function copy(value,status){try{await navigator.clipboard.writeText(value);status.textContent='Copied.';}catch{status.textContent='Select and copy the link field above.';}}
export async function initTeamLinks(){
 if(ready)return;$('#teamLinksStatus').textContent='Loading team links…';
 $('#copyTeamHub').onclick=()=>copy($('#teamHubURL').value,$('#teamHubMessage'));
 try{const response=await fetch('/campaigns/links.json');if(!response.ok)throw new Error('Unable to load campaign links.');const links=await response.json();
 $('#teamCampaignLinks').innerHTML=links.map(l=>`<article class="hub-campaign"><div><span class="order-badge">${esc(l.code)}</span><h3>${esc(l.title)}</h3><p>${esc(help[l.code]||'Use a unique placement for this tagged link.')}</p></div><img src="/campaigns/${esc(l.code)}.png" alt="QR code for ${esc(l.title)}" width="180" height="180" loading="lazy"><label>Tracked website link<input readonly value="${esc(l.url)}" aria-label="${esc(l.title)} tracked link"></label><div class="hub-actions"><button data-copy-campaign="${esc(l.code)}">COPY LINK</button><a href="${esc(l.url)}" target="_blank" rel="noopener">Open link ↗</a><a href="/campaigns/${esc(l.code)}.png" download>QR PNG ↓</a><a href="/campaigns/${esc(l.code)}.svg" download>QR SVG ↓</a></div><p class="hub-copy-status" role="status"></p></article>`).join('');
 document.querySelectorAll('[data-copy-campaign]').forEach(button=>button.onclick=()=>copy(links.find(l=>l.code===button.dataset.copyCampaign).url,button.closest('article').querySelector('.hub-copy-status')));
 $('#teamLinksStatus').textContent=links.length+' campaign links with matching QR files. No credentials are stored in these links.';ready=true;
 }catch(error){$('#teamLinksStatus').textContent=error.message;}
}
