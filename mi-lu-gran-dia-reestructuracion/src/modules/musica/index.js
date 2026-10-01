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
    ? value.moments.map((m)=>({id:clean(m?.id,80)||crypto.randomUUID(),name:clean(m?.name,80)||'Momento musical',description:clean(m?.description,180),songs:Array.isArray(m?.songs)?m.songs.map(s=>({id:clean(s?.id,80)||crypto.randomUUID(),title:clean(s?.title),artist:clean(s?.artist,120),source:clean(s?.source,30)||'manual',requestKey:clean(s?.requestKey,240),url:clean(s?.url,500),coverUrl:clean(s?.coverUrl,1000),platform:clean(s?.platform,30),album:clean(s?.album,160)})).filter(s=>s.title||s.artist):[]}))
    : cloneDefault();
  return {version:2,moments:moments.map(m=>({...m,playlist:m.playlist&&m.playlist.url?{platform:m.playlist.platform||playlistPlatform(m.playlist.url),url:m.playlist.url,name:m.playlist.name||'',coverUrl:m.playlist.coverUrl||'',embedUrl:m.playlist.embedUrl||embedUrl(parseMediaUrl(m.playlist.url))}:null}))};
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
function playlistPlatform(url){
  const value=String(url||'').trim();
  try{
    const host=new URL(value).hostname.toLowerCase().replace(/^www\./,'');
    if(host.includes('spotify.com')) return 'spotify';
    if(host.includes('music.youtube.com')||host.includes('youtube.com')||host.includes('youtu.be')) return 'youtube';
    if(host.includes('music.apple.com')) return 'apple';
  }catch{}
  return '';
}
function platformLabel(platform){
  return platform==='spotify'?'Spotify':platform==='youtube'?'YouTube Music':platform==='apple'?'Apple Music':'';
}
function parseMediaUrl(url){
  try{
    const u=new URL(String(url||'').trim());
    const host=u.hostname.toLowerCase().replace(/^www\./,'');
    if(host.includes('spotify.com')){const parts=u.pathname.split('/').filter(Boolean);if(parts[0]&&parts[1]&&['playlist','album','track'].includes(parts[0]))return {platform:'spotify',type:parts[0],id:parts[1],url:u.href};}
    if(host.includes('youtube.com')||host==='youtu.be'||host.includes('music.youtube.com')){const playlist=u.searchParams.get('list');const video=u.searchParams.get('v')||(host==='youtu.be'?u.pathname.slice(1):'');if(playlist)return {platform:'youtube',type:'playlist',id:playlist,url:u.href};if(video)return {platform:'youtube',type:'track',id:video,url:u.href};}
    if(host.includes('music.apple.com')){const parts=u.pathname.split('/').filter(Boolean);const type=parts.includes('playlist')?'playlist':parts.includes('album')?'album':parts.includes('song')?'track':'';if(type)return {platform:'apple',type,id:parts[parts.indexOf(type)+1]||'',url:u.href};}
  }catch{}
  return null;
}
function embedUrl(media){if(!media)return '';if(media.platform==='spotify')return 'https://open.spotify.com/embed/'+media.type+'/'+media.id+'?utm_source=generator';if(media.platform==='youtube')return media.type==='playlist'?'https://www.youtube.com/embed?listType=playlist&list='+encodeURIComponent(media.id)+'&playsinline=1':'https://www.youtube.com/embed/'+encodeURIComponent(media.id)+'?playsinline=1';if(media.platform==='apple')return media.url.replace('https://music.apple.com/','https://embed.music.apple.com/');return '';}
async function enrichMedia(url){const media=parseMediaUrl(url);if(!media)return {url:'',platform:'',coverUrl:'',title:''};if(media.platform==='spotify'){try{const response=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent(media.url),{headers:{Accept:'application/json'}});if(response.ok){const data=await response.json();return {url:media.url,platform:'spotify',coverUrl:data.thumbnail_url||'',title:data.title||''};}}catch{}}if(media.platform==='youtube'&&media.type==='track')return {url:media.url,platform:'youtube',coverUrl:'https://i.ytimg.com/vi/'+media.id+'/hqdefault.jpg',title:''};return {url:media.url,platform:media.platform,coverUrl:'',title:''};}
function visualFallback(platform,label){return '<div class="music-cover music-cover-'+esc(platform||'generic')+'"><span>♫</span><small>'+esc(label||'Música')+'</small></div>';}
function renderPlaylists(plan){
  const root=document.querySelector('[data-music-playlists]');
  if(!root)return;
  const items=plan.moments.filter(m=>m.playlist);
  root.innerHTML='<div class="music-playlist-list">'+
    (items.length?items.map(moment=>{
      const p=moment.playlist;
      return '<button type="button" class="music-playlist-row" data-preview-playlist="'+esc(moment.id)+'">'+
        (p.coverUrl?'<img src="'+esc(p.coverUrl)+'" alt="" loading="lazy">':visualFallback(p.platform,'♫'))+
        '<span class="music-playlist-row-main"><strong>'+esc(p.name||'Playlist vinculada')+'</strong><small>'+esc(moment.name)+' · '+esc(platformLabel(p.platform))+'</small></span>'+
        '<span class="music-playlist-row-action">▶</span></button>';
    }).join(''):'<div class="music-playlist-empty-row">Todavía no tienes playlists vinculadas.</div>')+
    '<button type="button" class="music-add-playlist" data-add-playlist>＋ Agregar playlist</button></div>';
}
function render(plan,requests,search){
  renderPlaylists(plan);
  const moments=document.querySelector('[data-music-moments]');
  const needle=normalize(search);
  moments.innerHTML=plan.moments.map(moment=>{
    const songs=moment.songs||[];
    return '<article class="music-moment">'+
      '<div class="music-moment-head"><div><h3>'+esc(moment.name)+'</h3><p>'+esc(moment.description||'Sin descripción')+'</p></div><span class="music-moment-count">'+songs.length+' '+(songs.length===1?'canción':'canciones')+'</span></div>'+
      '<div class="music-moment-list">'+(songs.length?songs.map(song=>'<div class="music-moment-song">'+(song.coverUrl?'<img src="'+esc(song.coverUrl)+'" alt="" loading="lazy">':visualFallback(song.platform,song.title||'Canción'))+'<span><strong>'+esc(song.title||'Canción')+'</strong>'+(song.artist?' · '+esc(song.artist):'')+(song.album?'<small>'+esc(song.album)+'</small>':'')+'</span>'+(song.url?'<button type="button" data-preview-song="'+esc(moment.id)+'" data-song-id="'+esc(song.id)+'" aria-label="Escuchar">▶</button>':'')+'<button type="button" data-remove-song="'+esc(moment.id)+'" data-song-id="'+esc(song.id)+'" aria-label="Quitar canción">×</button></div>').join(''):'<div class="music-moment-empty">Todavía no hay canciones en este momento.</div>')+'</div>'+
      '<form class="music-moment-add" data-add-song="'+esc(moment.id)+'"><input name="title" maxlength="140" placeholder="Canción"><input name="artist" maxlength="120" placeholder="Artista"><input name="url" type="url" maxlength="500" placeholder="Enlace (opcional)"><button>Agregar</button></form>'+
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
    const addWeddingMusic=event.target.closest('[data-add-wedding-music]');
    if(addWeddingMusic){
      const categories=plan.moments.filter(m=>!['invitados','invitacion'].includes(m.id));
      const choices=categories.map((m,i)=>(i+1)+'. '+m.name).join('\n');
      const special1=categories.length+1, special2=categories.length+2;
      const selection=window.prompt('¿Para qué momento de la boda?\n\n'+choices+'\n'+special1+'. Combinado (varios momentos)\n'+special2+'. ＋ Crear mi propia categoría','');
      if(!selection)return;
      const n=Number(selection);
      let targets=[];
      if(n===special1){
        const nums=window.prompt('Escribe los números de los momentos separados por coma. Ej.: 1, 4, 7','');
        targets=String(nums||'').split(',').map(v=>categories[Number(v.trim())-1]).filter(Boolean);
      }else if(n===special2){
        const custom=clean(window.prompt('Nombre de tu nueva categoría:',''),80);
        if(!custom)return;
        const moment={id:crypto.randomUUID(),name:custom,description:'Momento musical personalizado.',songs:[],playlist:null};
        plan.moments.push(moment); targets=[moment];
      }else if(categories[n-1]){
        targets=[categories[n-1]];
      }
      if(!targets.length)return;
      const source=window.prompt('¿Cómo quieres agregar la música?\n\n1. Spotify\n2. YouTube Music\n3. Apple Music\n4. Enlace de canción','1');
      if(!source)return;
      const url=window.prompt('Pega aquí la URL de la playlist o canción:','');
      if(!url)return;
      const media=await enrichMedia(String(url).trim());
      if(!media.platform){window.alert('No reconocí la URL. Usa Spotify, YouTube Music o Apple Music.');return}
      const playlist={platform:media.platform,url:String(url).trim(),name:clean(media.title,120)||'Música de boda',coverUrl:media.coverUrl||'',embedUrl:embedUrl(parseMediaUrl(String(url).trim()))};
      targets.forEach(moment=>{moment.playlist={...playlist}});
      render(plan,requests,search); await save('Música de boda vinculada.');
      return;
    }
    const addPlaylist=event.target.closest('[data-add-playlist]');
    if(addPlaylist)return; 
    const previewPlaylist=event.target.closest('[data-preview-playlist]');
    const previewSong=event.target.closest('[data-preview-song]');
    if(previewPlaylist||previewSong){
      const moment=plan.moments.find(m=>m.id==(previewPlaylist||previewSong).dataset[previewPlaylist?'previewPlaylist':'previewSong']);
      if(!moment)return;
      let mediaUrl='',title=moment.name;
      if(previewPlaylist){mediaUrl=moment.playlist?.embedUrl||embedUrl(parseMediaUrl(moment.playlist?.url));}
      else{const song=moment.songs.find(s=>s.id===previewSong.dataset.songId);mediaUrl=embedUrl(parseMediaUrl(song?.url));title=song?.title||title;}
      const preview=root.querySelector('[data-music-preview]'),body=root.querySelector('[data-preview-body]');
      if(preview&&body&&mediaUrl){root.querySelector('[data-preview-title]').textContent=title;body.innerHTML='<iframe src="'+esc(mediaUrl)+'" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="'+esc(title)+'"></iframe>';preview.showModal();}
      return;
    }
    const unlink=event.target.closest('[data-unlink-playlist]');
    if(unlink){
      const moment=plan.moments.find(m=>m.id===unlink.dataset.unlinkPlaylist); if(!moment)return;
      moment.playlist=null; render(plan,requests,search); await save('Playlist desvinculada.');
      return;
    }
  },{signal});
  root.addEventListener('submit',async event=>{
    if(event.target.matches('[data-music-form]')){event.preventDefault();const data=new FormData(event.target);if(event.submitter?.value==='save'){plan.moments.push({id:crypto.randomUUID(),name:clean(data.get('name'),80),description:clean(data.get('description'),180),songs:[]});dialog.close();event.target.reset();render(plan,requests,search);await save('Nuevo momento guardado.')}else dialog.close();return}
    const form=event.target.closest('[data-add-song]');if(form){event.preventDefault();const data=new FormData(form);const title=clean(data.get('title'));const artist=clean(data.get('artist'),120);if(!title)return;const moment=plan.moments.find(m=>m.id===form.dataset.addSong);if(!moment)return;const media=await enrichMedia(String(data.get('url')||''));moment.songs.push({id:songId(),title,artist,source:media.platform||'manual',requestKey:'',url:media.url,coverUrl:media.coverUrl,platform:media.platform,album:media.title});form.reset();render(plan,requests,search);await save('Canción guardada.')}
  },{signal});
  root.addEventListener('click',event=>{if(event.target.closest('[data-close-preview]'))root.querySelector('[data-music-preview]')?.close();},{signal});
  root.addEventListener('input',event=>{if(event.target.matches('[data-music-search]')){search=event.target.value;render(plan,requests,search)}},{signal});
  cleanup=()=>{controller.abort();cleanup=null};
  return true;
}