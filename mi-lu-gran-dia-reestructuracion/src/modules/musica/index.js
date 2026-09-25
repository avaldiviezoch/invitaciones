import { loadRsvpAdminSnapshot } from '../../services/rsvp-admin.js?v=5';

let activeMusicCleanup=null;
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const text=(value)=>String(value??'').trim();
const normalize=(value)=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');

function parseMusic(value){
  if(!value)return {songs:[],message:'',guestName:''};
  if(typeof value==='string'){try{value=JSON.parse(value)}catch{return {songs:[],message:'',guestName:''}}}
  return {
    songs:Array.isArray(value?.songs)?value.songs.map(item=>({title:text(item?.title).slice(0,140),artist:text(item?.artist).slice(0,140)})).filter(item=>item.title||item.artist).slice(0,10):[],
    message:text(value?.message).slice(0,500),
    guestName:text(value?.guestName).slice(0,120)
  };
}
function entriesFrom(snapshot){
  return (snapshot?.musicResponses||[]).flatMap(response=>{
    const music=parseMusic(response?.customData?.mgdMusic);
    const person=text(music.guestName||response?.name)||'Invitado';
    return music.songs.map(song=>({responseId:String(response?.id||''),person,title:song.title||'Canción sin título',artist:song.artist,message:music.message}));
  });
}
function groupedEntries(entries){
  const map=new Map();
  entries.forEach(item=>{
    const key=normalize(item.title)+'|'+normalize(item.artist);
    const current=map.get(key)||{title:item.title,artist:item.artist,requests:[],count:0};
    current.count+=1;current.requests.push(item);map.set(key,current);
  });
  return [...map.values()].sort((a,b)=>b.count-a.count||a.title.localeCompare(b.title,'es'));
}
function publicUrl(snapshot){
  const token=text(snapshot?.token);
  return token?`https://avaldiviezoch.github.io/Wedding/rsvp.html?token=${encodeURIComponent(token)}&view=music`:'';
}
function card(item){
  const people=[...new Set(item.requests.map(r=>r.person).filter(Boolean))];
  const messages=item.requests.filter(r=>r.message);
  return `<article class="music-admin-card">
    <span class="music-admin-note" aria-hidden="true">♫</span>
    <div class="music-admin-song"><div><h3>${esc(item.title)}</h3>${item.count>1?`<b>${item.count} solicitudes</b>`:''}</div><p>${esc(item.artist||'Artista no indicado')}</p></div>
    <div class="music-admin-people"><span>SOLICITADA POR</span><strong>${esc(people.join(', ')||'Invitado')}</strong>${messages.length?`<small>“${esc(messages[0].message)}”${messages.length>1?` · +${messages.length-1} dedicatoria${messages.length===2?'':'s'}`:''}</small>`:'<small>Sin dedicatoria</small>'}</div>
  </article>`;
}
export async function mountMusica(context){
  const root=document.querySelector('[data-module-view="musica"]');
  if(!root||!context?.id)return false;
  activeMusicCleanup?.();
  const controller=new AbortController(),{signal}=controller;
  let snapshot=null,search='',epoch=0;
  const response=await fetch('src/modules/musica/index.html?v=1',{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo cargar la interfaz de Música.');
  root.innerHTML=await response.text();
  const list=root.querySelector('[data-music-list]'),state=root.querySelector('[data-music-state]'),open=root.querySelector('[data-music-open-public]');

  function render(){
    const entries=entriesFrom(snapshot),groups=groupedEntries(entries);
    const people=new Set(entries.map(item=>item.responseId||item.person)).size;
    const needle=normalize(search);
    const visible=groups.filter(item=>!needle||normalize([item.title,item.artist,...item.requests.map(r=>r.person)].join(' ')).includes(needle));
    root.querySelector('[data-music-total]').textContent=String(entries.length);
    root.querySelector('[data-music-kpi-requests]').textContent=String(entries.length);
    root.querySelector('[data-music-kpi-unique]').textContent=String(groups.length);
    root.querySelector('[data-music-kpi-people]').textContent=String(people);
    const top=groups[0];
    root.querySelector('[data-music-kpi-top]').textContent=top?.title||'—';
    root.querySelector('[data-music-kpi-top-count]').textContent=top?(top.count===1?'1 solicitud':`${top.count} solicitudes`):'sin solicitudes';
    root.querySelector('[data-music-results]').textContent=`${visible.length} ${visible.length===1?'canción':'canciones'}`;
    if(!snapshot?.token)list.innerHTML='<div class="music-admin-empty"><strong>RSVP aún no está configurado</strong><span>Música utiliza el mismo token y las mismas respuestas de Invitados.</span></div>';
    else if(!visible.length)list.innerHTML=needle?'<div class="music-admin-empty"><strong>Sin coincidencias</strong><span>Prueba con otra canción, artista o invitado.</span></div>':'<div class="music-admin-empty"><strong>Aún no hay canciones sugeridas</strong><span>Las solicitudes enviadas desde las invitaciones aparecerán aquí.</span></div>';
    else list.innerHTML=visible.map(card).join('');
    const url=publicUrl(snapshot);open.disabled=!url;open.dataset.url=url;
  }
  async function load(announce=false){
    const current=++epoch;if(announce)state.textContent='Actualizando solicitudes…';
    try{const loaded=await loadRsvpAdminSnapshot(context);if(current!==epoch)return;snapshot=loaded;render();state.textContent=loaded.token?(announce?'Solicitudes actualizadas.':'Datos del RSVP de la boda activa.'):'RSVP aún no está configurado.'}
    catch(error){if(current!==epoch)return;snapshot={token:'',musicResponses:[]};render();state.textContent=error?.message||'No se pudieron cargar las solicitudes musicales.'}
  }
  root.addEventListener('input',event=>{if(!event.target.matches('[data-music-search]'))return;search=event.target.value;render()},{signal});
  root.addEventListener('click',event=>{
    if(event.target.closest('[data-music-refresh]')){void load(true);return}
    const button=event.target.closest('[data-music-open-public]');if(button&&!button.disabled&&button.dataset.url)window.open(button.dataset.url,'_blank','noopener');
  },{signal});
  activeMusicCleanup=()=>{controller.abort();epoch+=1;activeMusicCleanup=null};
  await load(false);return true;
}