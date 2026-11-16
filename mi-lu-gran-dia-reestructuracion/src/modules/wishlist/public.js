import { decodeWishlistShare, parseWishlistLiveShare } from './share-link.js?v=2';

const LIVE_API='https://migrandia-wishlist-live-dev.avaldiviezoch.workers.dev';
const LEGACY_API='https://migrandia-wishlist-gifts-dev.avaldiviezoch.workers.dev';
const $=id=>document.getElementById(id);
function node(tag,cls='',value=''){
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(value)el.textContent=value;return el;
}
async function legacyHash(snapshot) {
  const bytes=new TextEncoder().encode(snapshot);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
let state={live:false,listId:'',event:'',gifts:[],purchased:new Set(),online:false};
function render() {
  const host=$('cards');host.replaceChildren();
  $('eventName').textContent=state.event||'Nuestra celebración';
  $('count').textContent=state.gifts.length+(state.gifts.length===1?' regalo':' regalos');
  document.title='Regalos de '+(state.event||'Nuestra celebración')+' · Mi Gran Día';
  if(!state.gifts.length){host.append(node('p','empty','Todavía no hay regalos publicados.'));return;}
  state.gifts.forEach((gift,index)=>{
    const card=node('article','gift-card');
    const id=state.live?gift.id:String(index);
    const isBought=state.purchased.has(id);
    if(isBought)card.classList.add('is-purchased');
    const media=node('div','media');
    if(gift.image){
      const image=node('img');image.src=gift.image;image.alt=gift.name;image.loading='lazy';image.referrerPolicy='no-referrer';
      image.addEventListener('error',()=>image.replaceWith(node('span','placeholder','♡')),{once:true});
      media.append(image);
    }else media.append(node('span','placeholder','♡'));
    const body=node('div','body');
    body.append(node('span','shop',gift.shop||'Tienda'),node('h3','',gift.name));
    if(gift.description)body.append(node('div','description',gift.description));
    if(gift.price)body.append(node('strong','price',gift.price));
    const actions=node('div','gift-actions');
    const link=node('a','link','Ir al regalo ↗');link.href=gift.url;link.target='_blank';link.rel='noopener noreferrer';
    const button=node('button','purchase-button',isBought?'✓ Regalo comprado':'Marcar como comprado');
    button.type='button';button.disabled=isBought||!state.online;
    button.onclick=()=>void purchase(id);
    actions.append(link,button);body.append(actions);card.append(media,body);host.append(card);
  });
}
async function refreshList() {
  const endpoint=new URL('/api/list',LIVE_API);endpoint.searchParams.set('list',state.listId);
  const response=await fetch(endpoint,{cache:'no-store',headers:{Accept:'application/json'}});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.ok||!Array.isArray(result.gifts))throw new Error(result.error||'La lista no está publicada.');
  state.event=String(result.event||'Nuestra celebración');
  state.gifts=result.gifts;state.purchased=new Set(result.purchased||[]);state.online=true;
  render();$('purchaseNotice').textContent='';
}
async function refreshLegacy() {
  const endpoint=new URL('/api/status',LEGACY_API);endpoint.searchParams.set('list',state.listId);
  const response=await fetch(endpoint,{cache:'no-store'});
  const result=await response.json();
  if(!response.ok||!result.ok)throw new Error('Sin conexión con compras');
  state.purchased=new Set((result.purchased||[]).map(String));state.online=true;render();
}
async function purchase(giftId) {
  if(!state.online||state.purchased.has(giftId))return;
  if(!confirm('¿Confirmas que ya compraste este regalo? Los demás invitados lo verán como comprado.'))return;
  state.online=false;render();
  const endpoint=new URL('/api/purchase',state.live?LIVE_API:LEGACY_API);
  const body=state.live?{list:state.listId,id:giftId}:{list:state.listId,index:Number(giftId)};
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok)throw new Error(result.error||'Error al registrar');
    state.purchased.add(giftId);
    $('purchaseNotice').textContent='¡Gracias! El regalo quedó marcado como comprado.';
  }catch{ $('purchaseNotice').textContent='No se pudo registrar la compra. Inténtalo de nuevo.'; }
  finally{state.online=true;render();}
}
async function main() {
  const fragment=location.hash.slice(1);
  const id=parseWishlistLiveShare(fragment);
  state.live=Boolean(id);
  state.listId=id||(await legacyHash(fragment));
  if(id){
    try{await refreshList();}
    catch{ $('purchaseNotice').textContent='No se pudo consultar la lista actual. Cuando se publique desde Mi Gran Día aparecerán aquí los regalos.';render(); }
    try{
      const editor=await import('./public-editor.js?v=2');
      editor.initWishlistPublicEditor(id,()=>{
        // Refresh public state from backend; never confuse private un-published changes with public state.
        void refreshList().catch(()=>{ $('purchaseNotice').textContent='Guardado privado: pendiente de sincronización pública.'; });
      });
    }catch(error){
      $('purchaseNotice').textContent='La lista se muestra, pero el acceso de edición no está disponible temporalmente.';
      console.warn('Wishlist public editor initialization failed',error);
    }
  }else{
    let legacyGifts=[];
    try{
      const data=await decodeWishlistShare(fragment);
      state.event=data.event;state.gifts=data.gifts;legacyGifts=data.gifts;render();
      try {
        // Once its owner signs in and publishes, this same old URL becomes live.
        await refreshList();
        state.live=true;
      } catch {
        await refreshLegacy().catch(()=>{
          $('purchaseNotice').textContent='No se puede consultar el registro de compras por ahora.';
        });
      }
    }catch(error){
      $('error').hidden=false;$('error').textContent=error.message||'Enlace no válido';
    }
    if(legacyGifts.length){
      try {
        const editor=await import('./public-editor.js?v=2');
        editor.initWishlistPublicEditor('',()=>{
          void refreshList().then(()=>{state.live=true;}).catch(()=>{
            $('purchaseNotice').textContent='Guardado en Mi Gran Día. Pendiente de publicación para invitados.';
          });
        },{legacyListId:state.listId,legacyGifts});
      }catch(error){
        console.warn('Wishlist legacy login initialization failed',error);
        $('purchaseNotice').textContent='No se pudo habilitar el inicio de sesión en este momento.';
      }
    }
  }
  window.addEventListener('focus',()=>{void (state.live?refreshList():refreshLegacy()).catch(()=>{});});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void(state.live?refreshList():refreshLegacy()).catch(()=>{});});
}
void main().catch(error=>{ $('error').hidden=false;$('error').textContent=error.message||'No se pudo abrir la lista.'; });
