import { auth, authPersistenceReady } from '../../services/firebase-client.js';
import { listWeddingContexts } from '../../services/wedding-context.js';
import { readPlannerStorageKey, subscribePlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';
import { weddingCapabilities } from '../../core/app/permissions.js';
import { wishlistPublicId } from './share-link.js?v=2';
import {
  GoogleAuthProvider, onAuthStateChanged, signInWithPopup,
  signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const STORAGE_KEY = 'planificador_bodas_wishlist_v1';
const API = 'https://migrandia-wishlist-live-dev.avaldiviezoch.workers.dev';
const META = 'https://migrandia-product-metadata-dev.avaldiviezoch.workers.dev/api/product';
const $ = id => document.getElementById(id);
const text = (id,value) => { const el=$(id); if(el)el.textContent=value; };
let context=null, items=[], busy=false, unsubscribe=()=>{}, epoch=0, authUnsubscribe=()=>{};
let onUpdated=()=>{};
let legacyListId='';
let legacySnapshot=[];
let currentPublicId='';
function validUrl(value) {
  try { const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.href:''; }
  catch{return '';}
}
function normalized(raw) {
  return (Array.isArray(raw)?raw:[]).filter(x=>x?.name&&validUrl(x.url)).map(x=>({
    id:String(x.id||crypto.randomUUID()),
    name:String(x.name).slice(0,110),image:validUrl(x.image),shop:String(x.shop||'').slice(0,65),
    price:String(x.price||'').slice(0,40),description:String(x.description||'').slice(0,350),url:validUrl(x.url)
  }));
}
function ui(message='') {
  text('editorStatus',message);
  // Authentication errors must never be hidden in the editor-only section.
  if (!context && message) {
    text('authFeedback',message);
    text('purchaseNotice',message);
  } else if (context && message) {
    text('authFeedback','');
  }
}
function syncMode() {
  const editor=$('editorTools');
  editor.hidden=!context;
  $('authAction').textContent=auth.currentUser?'Mi cuenta ✓':'Ingresar';
  const email=auth.currentUser?.email;
  text('editorIdentity',context ? (email+' · '+context.name) : (email||''));
}
async function publish(gifts) {
  if (!context || !auth.currentUser) throw new Error('Inicia sesión.');
  const token=await auth.currentUser.getIdToken();
  const list=await wishlistPublicId(context.id);
  const res=await fetch(new URL('/api/list',API),{
    method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({weddingId:context.id,list,event:context.name,gifts,legacyList:legacyListId})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error(data.error||'No se pudo sincronizar la lista pública.');
}
async function save(next) {
  if (!context||busy)return;
  busy=true;ui('Guardando en Mi Gran Día…');
  $('editorAdd').disabled=true;
  const previous=items;
  try {
    await writePlannerStorageKey(context,STORAGE_KEY,next);
    items=next;
    ui('Guardado en Mi Gran Día. Actualizando el enlace público…');
    try { await publish(next);ui('Guardado y sincronizado para invitados.'); }
    catch { ui('Guardado en Mi Gran Día, pero la lista pública no se actualizó. Reintenta sincronizar.'); }
    onUpdated(items);
    $('editorForm').reset();$('editorDialog').close();$('editorItemId').value='';
  }catch(error){
    items=previous;ui(error?.message||'No se pudo guardar.');
  }finally{busy=false;$('editorAdd').disabled=false;}
}
function renderManage() {
  const container=$('editorItems');
  container.replaceChildren();
  items.forEach(item=>{
    const row=document.createElement('div');row.className='editor-item';
    const label=document.createElement('span');label.textContent=item.name;
    const actions=document.createElement('div');
    const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';
    edit.onclick=()=>openForm(item);
    const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar';
    remove.onclick=()=>{if(confirm('¿Eliminar este regalo de la lista?'))void save(items.filter(g=>g.id!==item.id));};
    actions.append(edit,remove);row.append(label,actions);container.append(row);
  });
}
function openForm(item=null) {
  const form=$('editorForm');form.reset();
  $('editorItemId').value=item?.id||'';
  for(const key of ['url','name','shop','price','description','image']){
    const input=form.elements.namedItem(key);if(input) input.value=item?.[key]||'';
  }
  text('editorDialogTitle',item?'Editar regalo':'Agregar regalo');
  $('editorDialog').showModal();
}
async function activate(user) {
  const token=++epoch;unsubscribe();unsubscribe=()=>{};context=null;items=[];syncMode();
  if(!user){text('authFeedback','');return;}
  ui('Comprobando permisos de tu boda…');
  try{
    const contexts=await listWeddingContexts(user);
    if(token!==epoch)return;
    const matches=[];
    for(const item of contexts){
      if(!weddingCapabilities(item.role).canEdit)continue;
      if(!legacyListId){
        if(await wishlistPublicId(item.id)===currentPublicId)matches.push({ context:item });
      }else{
        // Old snapshot links have no wedding identifier. Only match an authorized
        // wedding when every original product URL still belongs to its Wishlist.
        const current=normalized(await readPlannerStorageKey(item,STORAGE_KEY));
        const links=new Set(current.map(g=>g.url));
        if(legacySnapshot.length && legacySnapshot.every(g=>links.has(validUrl(g.url)))){
          matches.push({ context:item, gifts:current });
        }
      }
    }
    if(token!==epoch)return;
    if(matches.length!==1){
      ui(matches.length>1
        ? 'La cuenta tiene varias bodas con esos regalos. No se puede elegir una automáticamente.'
        : 'No se pudo vincular este enlace con una boda donde tengas permiso de edición.');
      syncMode();return;
    }
    context=matches[0].context;
    items=matches[0].gifts||normalized(await readPlannerStorageKey(context,STORAGE_KEY));
    if(token!==epoch)return;
    syncMode();renderManage();onUpdated(items);
    text('purchaseNotice','');
    ui('Puedes agregar, editar o quitar regalos. Se guardarán en Mi Gran Día.');
    unsubscribe=subscribePlannerStorageKey(context,STORAGE_KEY,value=>{
      if(token!==epoch||busy)return;
      items=normalized(value);renderManage();onUpdated(items);
    },()=>ui('No se pudo sincronizar Mi Gran Día.'));
  }catch(error){if(token===epoch)ui('No se pudo comprobar el acceso: '+(error?.message||'Inténtalo otra vez.'));}
}
export function initWishlistPublicEditor(liveId,updated,options={}) {
  currentPublicId=liveId;
  legacyListId=String(options.legacyListId||'');
  legacySnapshot=Array.isArray(options.legacyGifts)?options.legacyGifts:[];
  onUpdated=updated;
  const dialog=$('authDialog');
  $('authAction').onclick=()=>{
    if(auth.currentUser){dialog.showModal();return;}
    dialog.showModal();
  };
  $('authClose').onclick=()=>dialog.close();
  $('editorDialogClose').onclick=()=>$('editorDialog').close();
  $('editorAdd').onclick=()=>openForm();
  $('editorResync').onclick=async()=>{
    if(!context||busy)return;
    ui('Sincronizando lista pública…');
    try{await publish(items);ui('Enlace público actualizado.');onUpdated(items);}
    catch(error){ui(error.message||'No se pudo sincronizar.');}
  };
  $('authGoogle').onclick=async()=>{
    await authPersistenceReady;
    text('authFeedback','Ingresando…');
    try{await signInWithPopup(auth,new GoogleAuthProvider());dialog.close();text('authFeedback','');}
    catch(error){text('authFeedback','No se pudo iniciar sesión: '+(error?.message||'Intenta con correo.'));}
  };
  $('authEmailForm').onsubmit=async(e)=>{
    e.preventDefault();
    await authPersistenceReady;
    text('authFeedback','Ingresando…');
    const form=e.currentTarget;
    try{
      await signInWithEmailAndPassword(auth,form.elements.namedItem('email').value,form.elements.namedItem('password').value);
      dialog.close();text('authFeedback','');form.reset();
    }catch(error){text('authFeedback','No se pudo iniciar sesión. Comprueba el correo y la contraseña.');}
  };
  $('authLogout').onclick=async()=>{
    try{await signOut(auth);dialog.close();}
    catch { text('authFeedback','No se pudo cerrar sesión.'); }
  };
  $('editorAnalyze').onclick=async()=>{
    const form=$('editorForm');
    const url=validUrl(form.elements.namedItem('url').value);
    if(!url){text('editorFormFeedback','Pega un enlace válido.');return;}
    const btn=$('editorAnalyze');btn.disabled=true;text('editorFormFeedback','Buscando datos del producto…');
    try{
      const endpoint=new URL(META);endpoint.searchParams.set('url',url);
      const resp=await fetch(endpoint,{headers:{Accept:'application/json'}});
      const body=await resp.json();
      if(!resp.ok||!body.ok)throw new Error('No se pudo completar el producto.');
      const product=body.product||{};
      for(const key of ['name','image','shop','description']){
        const field=form.elements.namedItem(key);
        if(!field.value&&product[key])field.value=String(product[key]);
      }
      const price=form.elements.namedItem('price');
      if(!price.value&&product.price)price.value=[product.currency,product.price].filter(Boolean).join(' ');
      text('editorFormFeedback','Datos encontrados. Revisa y guarda.');
    }catch{ text('editorFormFeedback','No se encontraron datos automáticos. Puedes completarlos manualmente.'); }
    finally{btn.disabled=false;}
  };
  $('editorForm').onsubmit=e=>{
    e.preventDefault();
    if(!context||busy)return;
    const fd=new FormData(e.currentTarget);
    const url=validUrl(fd.get('url'));
    const name=String(fd.get('name')||'').trim();
    if(!url||!name){text('editorFormFeedback','Nombre y enlace son obligatorios.');return;}
    const id=String($('editorItemId').value||crypto.randomUUID());
    const gift={id,name:name.slice(0,110),url,image:validUrl(fd.get('image')),shop:String(fd.get('shop')||'').slice(0,65),price:String(fd.get('price')||'').slice(0,40),description:String(fd.get('description')||'').slice(0,350)};
    const next=items.some(g=>g.id===id)?items.map(g=>g.id===id?gift:g):[gift,...items];
    void save(next);
  };
  authUnsubscribe=onAuthStateChanged(auth,user=>{
    $('authLogout').hidden=!user;
    void activate(user);
  });
}
