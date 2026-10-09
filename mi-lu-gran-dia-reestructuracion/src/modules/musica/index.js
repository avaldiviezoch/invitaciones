import { loadRsvpAdminSnapshot } from '../../services/rsvp-admin.js?v=5';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js?v=3';
import { serviceUrl } from '../../services/runtime-environment.js';

const STORAGE_KEY='migrandia.music.v1';
const DEFAULT_MOMENTS=[
  ['espera','Música de espera'],['ceremonia','Ceremonia'],['ingreso','Ingreso de los novios'],['coctel','Cóctel'],['recepcion','Recepción'],['cena','Cena'],['primer-baile','Primer baile'],['baile','Baile'],['hora-loca','Hora loca'],['torta','Corte de torta'],['momentos','Momentos especiales'],['invitados','Música de invitados'],['invitacion','Música para invitación']
].map(([id,name])=>({id,name,description:'',songs:[],playlist:null}));

let cleanup=null;
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const clean=(v,n=140)=>String(v??'').trim().slice(0,n);
function hostMatches(host,domain){return host===domain||host.endsWith('.'+domain);}
function safeHttpUrl(value){
  try{
    const url=new URL(String(value||'').trim());
    return url.protocol==='https:'||url.protocol==='http:'?url.href:'';
  }catch{return''}
}
function safeImageUrl(value){
  const url=safeHttpUrl(value);
  if(url)return url;
  const text=String(value||'').trim();
  return text.startsWith('data:image/')?text:'';
}
const normalize=v=>clean(v,220).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');
const cloneDefault=()=>DEFAULT_MOMENTS.map(x=>({...x,songs:[],playlist:null}));

function playlistPlatform(url){
  try{const host=new URL(String(url||'').trim()).hostname.toLowerCase().replace(/^www\./,'');
    if(hostMatches(host,'spotify.com'))return'spotify';
    if(hostMatches(host,'youtube.com')||host==='youtu.be')return'youtube';
    if(hostMatches(host,'music.apple.com'))return'apple';
  }catch{}
  return'';
}
function platformLabel(p){return p==='spotify'?'Spotify':p==='youtube'?'YouTube Music':p==='apple'?'Apple Music':'';}
function parseMediaUrl(url){
  try{const u=new URL(String(url||'').trim()),host=u.hostname.toLowerCase().replace(/^www\./,'');
    if(hostMatches(host,'spotify.com')){const x=u.pathname.split('/').filter(Boolean);if(x[0]&&x[1]&&['playlist','album','track'].includes(x[0]))return{platform:'spotify',type:x[0],id:x[1],url:u.href};}
    if(hostMatches(host,'youtube.com')||host==='youtu.be'){const list=u.searchParams.get('list'),video=u.searchParams.get('v')||(host==='youtu.be'?u.pathname.slice(1):'');if(list)return{platform:'youtube',type:'playlist',id:list,url:u.href};if(video)return{platform:'youtube',type:'track',id:video,url:u.href};}
    if(hostMatches(host,'music.apple.com')){const x=u.pathname.split('/').filter(Boolean),type=x.includes('playlist')?'playlist':x.includes('album')?'album':x.includes('song')?'track':'';if(type)return{platform:'apple',type,id:x[x.indexOf(type)+1]||'',url:u.href};}
  }catch{}
  return null;
}
function embedUrl(media){
  if(!media)return'';
  if(media.platform==='spotify')return'https://open.spotify.com/embed/'+media.type+'/'+media.id+'?utm_source=generator';
  if(media.platform==='youtube')return media.type==='playlist'?'https://www.youtube.com/embed?listType=playlist&list='+encodeURIComponent(media.id)+'&playsinline=1&rel=0':'https://www.youtube.com/embed/'+encodeURIComponent(media.id)+'?playsinline=1&rel=0';
  if(media.platform==='apple')return media.url.replace('https://music.apple.com/','https://embed.music.apple.com/');
  return'';
}
const MUSIC_PREVIEW_ENDPOINT=serviceUrl('/api/music-preview');

async function enrichMedia(url){
  const media=parseMediaUrl(url); if(!media)return null;
  try{
    const response=await fetch(MUSIC_PREVIEW_ENDPOINT+'?url='+encodeURIComponent(media.url),{headers:{Accept:'application/json'}});
    if(response.ok){
      const data=await response.json();
      if(data?.ok)return {...media,url:data.originalUrl||media.url,coverUrl:clean(data.image,1000),title:clean(data.title,140),
        tracks:Array.isArray(data.items)?data.items.map((x,i)=>({position:Number(x.position??i),title:clean(x.title,180),artist:clean(x.artist||x.channelTitle,140),coverUrl:clean(x.image||x.thumbnail,1000),videoId:clean(x.videoId,80),url:clean(x.url||'',700)})).filter(x=>x.title):[],
        totalResults:Number(data.totalResults||data.pageInfo?.totalResults||0)};
    }
  }catch{}
  if(media.platform==='youtube'&&media.type==='track')return {...media,coverUrl:'https://i.ytimg.com/vi/'+encodeURIComponent(media.id)+'/hqdefault.jpg',title:'',tracks:[]};
  return {...media,coverUrl:'',title:'',tracks:[]};
}
async function hydratePlaylistCovers(plan){
  let changed=false; const seen=new Set();
  for(const moment of plan.moments){
    const p=moment.playlist; if(!p?.url||seen.has(p.url))continue; seen.add(p.url);
    const media=parseMediaUrl(p.url); const enriched=await enrichMedia(p.url); if(!enriched)continue;
    const changedData=Boolean(enriched.coverUrl||enriched.title||enriched.tracks?.length);
    if(!changedData)continue;
    plan.moments.forEach(m=>{if(m.playlist?.url===p.url){
      if(enriched.coverUrl)m.playlist.coverUrl=enriched.coverUrl;
      if(enriched.title)m.playlist.name=enriched.title;
      if(Array.isArray(enriched.tracks))m.playlist.tracks=enriched.tracks;
      if(enriched.totalResults)m.playlist.totalResults=enriched.totalResults;
      m.playlist.coverSource=media?.platform==='youtube'&&media?.type==='playlist'?'youtube-api-v3':(m.playlist.coverSource||'preview');
    }}); changed=true;
  } return changed;
}
function visualFallback(platform){return '<div class="music-cover music-cover-'+esc(platform||'generic')+'"><span>♫</span></div>';}
function openMusicPreview(item,media,url){
  document.querySelector('[data-music-preview-overlay]')?.remove();
  const sourceUrl=safeHttpUrl(url); if(!sourceUrl)return;
  const tracks=Array.isArray(item?.tracks)?item.tracks:[];
  const rows=tracks.length?tracks.map((t,i)=>{const trackUrl=safeHttpUrl(t.url)||('https://www.youtube.com/watch?v='+encodeURIComponent(t.videoId||''));const coverUrl=safeImageUrl(t.coverUrl);return '<a class="music-track-row" href="'+esc(trackUrl)+'" target="_blank" rel="noopener noreferrer">'+(coverUrl?'<img src="'+esc(coverUrl)+'" alt="" loading="lazy">':'<span class="music-track-cover">♫</span>')+'<span class="music-track-index">'+String(i+1).padStart(2,'0')+'</span><span class="music-track-info"><strong>'+esc(t.title)+'</strong><small>'+esc(t.artist||'')+'</small></span><span class="music-track-play">↗</span></a>').join(''):'<div class="music-empty-selection">Todavía no se han importado las canciones de esta playlist.</div>';
  const overlay=document.createElement('div'); overlay.className='music-preview-overlay'; overlay.dataset.musicPreviewOverlay='';
  overlay.innerHTML='<div class="music-preview-card music-playlist-view" role="dialog" aria-modal="true"><div class="music-preview-head"><div><span class="music-admin-section-label">PLAYLIST</span><h2>'+esc(item?.name||'Música de boda')+'</h2><p class="music-preview-sub">'+esc(platformLabel(media?.platform)||'Música')+' · '+(item?.totalResults||tracks.length||0)+' canciones</p></div><button type="button" class="music-preview-close" aria-label="Cerrar">×</button></div><div class="music-playlist-summary">'+(safeImageUrl(item?.coverUrl)?'<img src="'+esc(safeImageUrl(item.coverUrl))+'" alt="" loading="lazy">':visualFallback(media?.platform||'generic'))+'<div><strong>'+esc(item?.name||'Música de boda')+'</strong><span>'+esc(platformLabel(media?.platform)||'Música')+'</span><a href="'+esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">Ver playlist original ↗</a></div></div><div class="music-track-list">'+rows+'</div></div>';
  document.body.appendChild(overlay);
  const close=()=>overlay.remove(); overlay.querySelector('.music-preview-close').addEventListener('click',close); overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  const onKey=event=>{if(event.key==='Escape'){close();document.removeEventListener('keydown',onKey)}}; document.addEventListener('keydown',onKey);
}

function normalizePlan(value){
  const source=Array.isArray(value?.moments)&&value.moments.length?value.moments:cloneDefault();
  const moments=source.map(m=>({id:clean(m?.id,80)||crypto.randomUUID(),name:clean(m?.name,80)||'Momento musical',description:clean(m?.description,180),
    songs:Array.isArray(m?.songs)?m.songs.map(s=>({id:clean(s?.id,80)||crypto.randomUUID(),title:clean(s?.title),artist:clean(s?.artist,120),url:clean(s?.url,700),coverUrl:clean(s?.coverUrl,1000),platform:clean(s?.platform,30)||'manual',album:clean(s?.album,160)})).filter(s=>s.title||s.artist):[],
    playlist:m?.playlist?.url?{platform:m.playlist.platform||playlistPlatform(m.playlist.url),url:clean(m.playlist.url,700),name:clean(m.playlist.name,140),coverUrl:clean(m.playlist.coverUrl,1000),coverSource:clean(m.playlist.coverSource,60),
      tracks:Array.isArray(m.playlist.tracks)?m.playlist.tracks.map((t,i)=>({position:Number(t?.position??i),title:clean(t?.title,180),artist:clean(t?.artist,140),coverUrl:clean(t?.coverUrl,1000),videoId:clean(t?.videoId,80),url:clean(t?.url,700)})).filter(t=>t.title):[],
      totalResults:Number(m.playlist.totalResults||0)}:null}));
  return{version:5,moments};
}
function requestEntries(snapshot){
  return(snapshot?.musicResponses||[]).flatMap(response=>{
    let value=response?.customData?.mgdMusic;if(typeof value==='string'){try{value=JSON.parse(value)}catch{value=null}}
    const songs=Array.isArray(value?.songs)?value.songs:[];
    const person=clean(value?.guestName||response?.name,120)||'Invitado';
    return songs.map(song=>({key:String(response?.id||'')+'|'+normalize(song?.title)+'|'+normalize(song?.artist),person,title:clean(song?.title)||'Canción sin título',artist:clean(song?.artist,120),message:clean(value?.message,500)}));
  });
}
function selectableMoments(plan){return plan.moments.filter(m=>!['invitados','invitacion'].includes(m.id));}

function render(plan,requests,search){
  const root=document.querySelector('[data-music-playlists]');
  const grouped=new Map();
  selectableMoments(plan).forEach(m=>{
    if(!m.playlist?.url)return;
    const key=m.playlist.url;
    if(!grouped.has(key))grouped.set(key,{playlist:m.playlist,moments:[]});
    grouped.get(key).moments.push(m.name);
  });
  const items=[...grouped.values()];
  root.innerHTML='<div class="music-board">'+
    '<div class="music-board-head"><div><span class="music-admin-section-label">MÚSICA DE BODA</span><h3>Mis referencias musicales</h3><p>Todas las playlists y canciones que has agregado a tu boda.</p></div><span class="music-board-count">'+items.length+' '+(items.length===1?'referencia':'referencias')+'</span></div>'+
    '<div class="music-reference-list">'+
    (items.length?items.map((item,i)=>{
      const p=item.playlist;
      return '<article class="music-reference-row">'+
        (safeImageUrl(p.coverUrl)?'<img src="'+esc(safeImageUrl(p.coverUrl))+'" alt="" loading="lazy">':visualFallback(p.platform))+
        '<div class="music-reference-main"><strong>'+esc(p.name||'Música de boda')+'</strong><div class="music-reference-moments">'+item.moments.map(name=>'<span>'+esc(name)+'</span>').join('')+'</div><small>'+esc(platformLabel(p.platform))+(safeHttpUrl(p.url)?' · <a href="'+esc(safeHttpUrl(p.url))+'" target="_blank" rel="noopener noreferrer">ver referencia</a>':'')+(p.coverSource==='custom'?' · portada personalizada':'')+'</small></div>'+
        '<button type="button" class="music-row-cover" data-edit-cover-url="'+esc(p.url)+'" data-edit-cover-title="'+esc(p.name||'Música de boda')+'" aria-label="Cambiar portada">▧</button>'+
        '<button type="button" class="music-row-play" data-preview-url="'+esc(p.url)+'" data-preview-title="'+esc(p.name||'Música de boda')+'" aria-label="Ver canciones">♫</button>'+
        '<button type="button" class="music-row-remove" data-remove-url="'+esc(p.url)+'" aria-label="Quitar referencia">×</button>'+
      '</article>';
    }).join(''):'<div class="music-empty-selection">Todavía no has agregado música de boda.<br><span>Usa “＋ Agregar música de boda” para comenzar.</span></div>')+
    '</div></div>';

  const needle=normalize(search);
  const visible=requests.filter(x=>!needle||normalize([x.title,x.artist,x.person].join(' ')).includes(needle));
  const list=document.querySelector('[data-music-list]');
  list.innerHTML=visible.length?visible.map(x=>'<article class="music-request-card"><span class="music-request-icon">♫</span><div class="music-request-song"><strong>'+esc(x.title)+'</strong><span>'+esc(x.artist||'Artista no indicado')+'</span></div><div class="music-request-person"><strong>'+esc(x.person)+'</strong><span>'+(x.message?esc(x.message):'Sin dedicatoria')+'</span></div></article>').join(''):'<div class="music-empty">Aún no hay solicitudes musicales que mostrar.</div>';

  const playlistCount=items.length;
  const songCount=selectableMoments(plan).reduce((n,m)=>n+(m.songs?.length||0),0);
  document.querySelector('[data-music-kpi-playlists]').textContent=String(playlistCount);
  document.querySelector('[data-music-kpi-songs]').textContent=String(songCount);
  document.querySelector('[data-music-kpi-guests]').textContent=String(new Set(requests.map(x=>x.person)).size);
  document.querySelector('[data-music-kpi-requests]').textContent=String(requests.length);
  document.querySelector('[data-music-total]').textContent=String(playlistCount);
}
function fillCategoryControls(plan,root){
  const categories=selectableMoments(plan);
  root.querySelector('[data-moment-id]').innerHTML=categories.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+'</option>').join('');
  root.querySelector('[data-category-checks]').innerHTML=categories.map(m=>'<label><input type="checkbox" value="'+esc(m.id)+'"> '+esc(m.name)+'</label>').join('');
}
export async function mountMusica(context){
  const root=document.querySelector('[data-module-view="musica"]');if(!root||!context?.id)return false;
  cleanup?.();const controller=new AbortController(),{signal}=controller;
  const response=await fetch('src/modules/musica/index.html?v=4',{cache:'no-store'});if(!response.ok)throw new Error('No se pudo cargar la interfaz de Música.');
  root.innerHTML=await response.text();
  let plan=normalizePlan(await readPlannerStorageKey(context,STORAGE_KEY));
  const coversChanged=await hydratePlaylistCovers(plan);
  const snapshot=await loadRsvpAdminSnapshot(context);let requests=requestEntries(snapshot),search='';
  const save=async message=>{await writePlannerStorageKey(context,STORAGE_KEY,normalizePlan(plan));root.querySelector('[data-music-state]').textContent=message||'Cambios guardados en la boda.'};
  if(coversChanged)await writePlannerStorageKey(context,STORAGE_KEY,normalizePlan(plan));
  render(plan,requests,search);
  const addDialog=document.querySelector('[data-add-music-dialog]');
  const editCoverDialog=document.querySelector('[data-edit-cover-dialog]');
  const updateMode=()=>{
    const mode=root.querySelector('[data-moment-mode]').value;
    root.querySelector('[data-single-category]').hidden=mode!=='single';
    root.querySelector('[data-combined-box]').hidden=mode!=='combined';
    root.querySelector('[data-custom-category]').hidden=mode!=='custom';
  };
  fillCategoryControls(plan,root);updateMode();

  root.addEventListener('click',async event=>{
    if(event.target.closest('[data-add-wedding-music]')){fillCategoryControls(plan,root);root.querySelector('[data-music-kind]').value='playlist';root.querySelector('[data-moment-mode]').value='single';updateMode();addDialog.showModal();return}
    if(event.target.closest('[data-close-add-music]')){addDialog.close();return}
    const editCover=event.target.closest('[data-edit-cover-url]');
    if(editCover){
      const dialog=editCoverDialog;
      const playlist=plan.moments.find(m=>m.playlist?.url===editCover.dataset.editCoverUrl)?.playlist;
      dialog.querySelector('[data-edit-cover-url-input]').value=playlist?.coverSource==='custom'?playlist?.coverUrl||'':'';
      dialog.querySelector('[data-edit-cover-title]').textContent=editCover.dataset.editCoverTitle||'Portada';
      dialog.dataset.coverUrl=editCover.dataset.editCoverUrl;
      dialog.showModal();
      return;
    }
    const remove=event.target.closest('[data-remove-url]');
    if(remove){
      const url=remove.dataset.removeUrl;
      plan.moments.forEach(m=>{if(m.playlist?.url===url)m.playlist=null});
      render(plan,requests,search);await save('Música desvinculada.');return
    }
    const preview=event.target.closest('[data-preview-url]');
    if(preview){
      const url=preview.dataset.previewUrl,media=parseMediaUrl(url);
      const item=plan.moments.flatMap(m=>m.playlist?[{playlist:m.playlist}]:[]).find(x=>x.playlist?.url===url)?.playlist;
      openMusicPreview(item,media,url);
      return
    }

  },{signal});

  root.addEventListener('change',event=>{if(event.target.matches('[data-moment-mode]'))updateMode();},{signal});

  editCoverDialog?.querySelectorAll('[data-close-edit-cover]').forEach(button=>button.addEventListener('click',()=>editCoverDialog.close(),{signal}));

  root.querySelector('[data-edit-cover-form]').addEventListener('submit',async event=>{
    event.preventDefault();
    const dialog=root.querySelector('[data-edit-cover-dialog]');
    const url=clean(new FormData(event.target).get('coverUrl'),1000);
    const targetUrl=dialog.dataset.coverUrl;
    const playlist=plan.moments.find(m=>m.playlist?.url===targetUrl)?.playlist;
    if(!playlist)return;
    playlist.coverUrl=url;
    playlist.coverSource=url?'custom':'';
    render(plan,requests,search);
    dialog.close();
    await save(url?'Portada personalizada guardada.':'Portada personalizada retirada.');
  },{signal});

  root.addEventListener('submit',async event=>{
    if(!event.target.matches('[data-add-music-form]'))return;
    event.preventDefault();
    const form=event.target,data=new FormData(form),mode=data.get('momentMode'),url=clean(data.get('url'),700);
    const customCoverUrl=clean(data.get('coverUrl'),1000);
    const media=await enrichMedia(url);
    if(!media){root.querySelector('[data-music-state]').textContent='No reconocimos el enlace. Usa Spotify, YouTube Music o Apple Music.';return}
    let targets=[];
    if(mode==='single'){const m=plan.moments.find(x=>x.id===data.get('momentId'));if(m)targets=[m];}
    if(mode==='combined'){targets=[...form.querySelectorAll('[data-category-checks] input:checked')].map(i=>plan.moments.find(m=>m.id===i.value)).filter(Boolean);}
    if(mode==='custom'){const name=clean(data.get('customCategory'),80);if(name){const m={id:crypto.randomUUID(),name,description:'',songs:[],playlist:null};plan.moments.push(m);targets=[m];}}
    if(!targets.length){root.querySelector('[data-music-state]').textContent='Selecciona al menos un momento.';return}
    const kind=data.get('kind');
    if(kind==='playlist'){
      const playlist={platform:media.platform,url:media.url,name:clean(media.title,140)||'Playlist de boda',coverUrl:customCoverUrl||media.coverUrl||'',coverSource:customCoverUrl?'custom':(media.coverUrl?'preview':''),tracks:Array.isArray(media.tracks)?media.tracks:[],totalResults:Number(media.totalResults||0)};
      targets.forEach(m=>m.playlist={...playlist});
    }else{
      const title=clean(media.title,140)||'Canción';
      targets.forEach(m=>m.songs.push({id:crypto.randomUUID(),title,artist:'',url:media.url,coverUrl:media.coverUrl||'',platform:media.platform,album:''}));
    }
    render(plan,requests,search);fillCategoryControls(plan,root);form.reset();updateMode();addDialog.close();await save('Música de boda guardada.');
  },{signal});

  root.addEventListener('input',event=>{if(event.target.matches('[data-music-search]')){search=event.target.value;render(plan,requests,search)}},{signal});
  cleanup=()=>{controller.abort();cleanup=null};
  return true;
}