import { loadRsvpAdminSnapshot } from '../../services/rsvp-admin.js?v=5';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js?v=3';

const STORAGE_KEY='migrandia.music.v1';
const DEFAULT_MOMENTS=[
  ['espera','Música de espera','Antes de comenzar la ceremonia o recepción.'],
  ['ceremonia','Ceremonia','Entrada, ceremonia y salida.'],
  ['ingreso','Ingreso de los novios','La entrada principal de los novios.'],
  ['recepcion','Recepción','Llegada y bienvenida de los invitados.'],
  ['coctel','Cóctel','Música para el momento social previo a la comida.'],
  ['cena','Cena','Ambiente musical durante la comida.'],
  ['primer-baile','Primer baile','La canción o canciones del primer baile.'],
  ['baile','Baile','Selección principal para bailar.'],
  ['hora-loca','Hora loca','Música para la fiesta y actividades.'],
  ['torta','Corte de torta','Música para el corte de torta.'],
  ['momentos','Momentos especiales','Canciones para otros momentos de la boda.'],
  ['invitados','Música de invitados','Selección de solicitudes recibidas de invitados.'],
  ['invitacion','Música para invitación','Canciones preparadas para utilizar en invitaciones.']
].map(([id,name,description])=>({id,name,description,songs:[]}));

let cleanup=null;
const esc=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const clean=(v,n=140)=>String(v??'').trim().slice(0,n);
const normalize=(v)=>clean(v,200).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');
const cloneDefault=()=>DEFAULT_MOMENTS.map(x=>({...x,songs:[]}));
function normalizePlan(value){
  const moments=Array.isArray(value?.moments)&&value.moments.length
    ? value.moments.map((m)=>({id:clean(m?.id,80)||crypto.randomUUID(),name:clean(m?.name,80)||'Momento musical',description:clean(m?.description,180),songs:Array.isArray(m?.songs)?m.songs.map(s=>({id:clean(s?.id,80)||crypto.randomUUID(),title:clean(s?.title),artist:clean(s?.artist,120),source:clean(s?.source,30)||'manual',requestKey:clean(s?.requestKey,240)})).filter(s=>s.title||s.artist):[]}))
    : cloneDefault();
  return {version:1,moments};
}
function requestEntries(snapshot){
  return (snapshot?.musicResponses||[]).flatMap(response=>{
    let value=response?.customData?.mgdMusic;
    if(typeof value==='string'){try{value=JSON.parse(value)}catch{value=null}}
    const songs=Array.isArray(value?.songs)?value.songs:[];
    const person=clean(value?.guestName||response?.name,120)||'Invitado';
    return songs.map(song=>({key:String(response?.id||'')+'|'+normalize(song?.title)+'|'+normalize(song?.artist),person,title:clean(song?.title)||'Canción sin título',artist:clean(song?.artist,120),message:clean(value?.message,500)}));
  });
}
function songId(){return crypto.randomUUID();}
function render(plan,requests,search){
  const moments=document.querySelector('[data-music-moments]');
  const needle=normalize(search);
  moments.innerHTML=plan.moments.map(moment=>{
    const songs=moment.songs||[];
    return '<article class="music-moment">'+
      '<div class="music-moment-head"><div><h3>'+esc(moment.name)+'</h3><p>'+esc(moment.description||'Sin descripción')+'</p></div><span class="music-moment-count">'+songs.length+' '+(songs.length===1?'canción':'canciones')+'</span></div>'+
      '<div class="music-moment-list">'+(songs.length?songs.map(song=>'<div class="music-moment-song"><span><strong>'+esc(song.title||'Canción')+'</strong>'+(song.artist?' · '+esc(song.artist):'')+'</span><button type="button" data-remove-song="'+esc(moment.id)+'" data-song-id="'+esc(song.id)+'" aria-label="Quitar canción">×</button></div>').join(''):'<div class="music-moment-empty">Todavía no hay canciones en este momento.</div>')+'</div>'+
      '<form class="music-moment-add" data-add-song="'+esc(moment.id)+'"><input name="title" maxlength="140" placeholder="Agregar canción"><input name="artist" maxlength="120" placeholder="Artista"><button>Agregar</button></form>'+
      '</article>';
  }).join('');
  const visible=requests.filter(x=>!needle||normalize([x.title,x.artist,x.person].join(' ')).includes(needle));
  const list=document.querySelector('[data-music-list]');
  list.innerHTML=visible.length?visible.map(x=>'<article class="music-request-card"><span class="music-request-icon">♫</span><div class="music-request-song"><strong>'+esc(x.title)+'</strong><span>'+esc(x.artist||'Artista no indicado')+'</span></div><div class="music-request-person"><strong>'+esc(x.person)+'</strong><span>'+(x.message?esc(x.message):'Sin dedicatoria')+'</span></div></article>').join(''):'<div class="music-empty">Aún no hay solicitudes musicales que mostrar.</div>';
  document.querySelector('[data-music-kpi-moments]').textContent=String(plan.moments.length);
  document.querySelector('[data-music-kpi-songs]').textContent=String(plan.moments.reduce((n,m)=>n+(m.songs?.length||0),0));
  document.querySelector('[data-music-kpi-guests]').textContent=String(new Set(requests.map(x=>x.person)).size);
  document.querySelector('[data-music-kpi-requests]').textContent=String(requests.length);
  document.querySelector('[data-music-total]').textContent=String(plan.moments.reduce((n,m)=>n+(m.songs?.length||0),0));
}
export async function mountMusica(context){
  const root=document.querySelector('[data-module-view="musica"]'); if(!root||!context?.id)return false;
  cleanup?.();
  const controller=new AbortController(); const {signal}=controller;
  const response=await fetch('src/modules/musica/index.html?v=3',{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo cargar la interfaz de Música.');
  root.innerHTML=await response.text();
  let plan=normalizePlan(await readPlannerStorageKey(context,STORAGE_KEY));
  const snapshot=await loadRsvpAdminSnapshot(context);
  let requests=requestEntries(snapshot),search='';
  const save=async(message)=>{await writePlannerStorageKey(context,STORAGE_KEY,normalizePlan(plan));document.querySelector('[data-music-state]').textContent=message||'Cambios guardados en la boda.'};
  render(plan,requests,search);
  const dialog=root.querySelector('[data-music-dialog]');
  root.addEventListener('click',async event=>{
    const remove=event.target.closest('[data-remove-song]');
    if(remove){const moment=plan.moments.find(m=>m.id===remove.dataset.removeSong);if(!moment)return;moment.songs=moment.songs.filter(s=>s.id!==remove.dataset.songId);render(plan,requests,search);await save();return}
    if(event.target.closest('[data-music-add-moment]')){dialog.showModal();return}
  },{signal});
  root.addEventListener('submit',async event=>{
    if(event.target.matches('[data-music-form]')){event.preventDefault();const data=new FormData(event.target);if(event.submitter?.value==='save'){plan.moments.push({id:crypto.randomUUID(),name:clean(data.get('name'),80),description:clean(data.get('description'),180),songs:[]});dialog.close();event.target.reset();render(plan,requests,search);await save('Nuevo momento guardado.')}else dialog.close();return}
    const form=event.target.closest('[data-add-song]');if(form){event.preventDefault();const data=new FormData(form);const title=clean(data.get('title'));const artist=clean(data.get('artist'),120);if(!title)return;const moment=plan.moments.find(m=>m.id===form.dataset.addSong);if(!moment)return;moment.songs.push({id:songId(),title,artist,source:'manual',requestKey:''});form.reset();render(plan,requests,search);await save('Canción guardada.')}
  },{signal});
  root.addEventListener('input',event=>{if(event.target.matches('[data-music-search]')){search=event.target.value;render(plan,requests,search)}},{signal});
  cleanup=()=>{controller.abort();cleanup=null};
  return true;
}