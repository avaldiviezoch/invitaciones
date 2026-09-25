const cache=new Map();
let requestQueue=Promise.resolve();
let nextRequestAt=0;

const SEARCH_URL='https://itunes.apple.com/search';
const SEARCH_LIMIT=15;
const REQUEST_GAP_MS=3100;
const REQUEST_TIMEOUT_MS=9000;

const text=(value)=>String(value??'').trim();
const normalize=(value)=>text(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('es')
  .replace(/[^a-z0-9]+/g,' ')
  .replace(/\s+/g,' ')
  .trim();

function abortError(){
  try{return new DOMException('Aborted','AbortError')}
  catch{return Object.assign(new Error('Aborted'),{name:'AbortError'})}
}

function delay(ms,signal){
  if(!ms)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(abortError());return}
    let timer=0;
    function cleanup(){clearTimeout(timer);signal?.removeEventListener('abort',onAbort)}
    function done(){cleanup();resolve()}
    function onAbort(){cleanup();reject(abortError())}
    signal?.addEventListener('abort',onAbort,{once:true});
    timer=setTimeout(done,ms);
  });
}

function artwork(url){
  return text(url).replace('100x100bb','300x300bb').replace('100x100-75','300x300-75');
}

function overlap(left,right){
  const a=new Set(normalize(left).split(' ').filter(Boolean));
  const b=new Set(normalize(right).split(' ').filter(Boolean));
  if(!a.size||!b.size)return 0;
  let shared=0;
  a.forEach(token=>{if(b.has(token))shared+=1});
  return shared/Math.max(a.size,b.size);
}

function score(item,candidate){
  const wantedTitle=normalize(item?.title);
  const wantedArtist=normalize(item?.artist);
  const title=normalize(candidate?.trackName);
  const artist=normalize(candidate?.artistName);
  if(!wantedTitle||!title)return -Infinity;

  let value=0;
  if(title===wantedTitle)value+=10;
  else if(title.includes(wantedTitle)||wantedTitle.includes(title))value+=6;
  else value+=Math.round(overlap(title,wantedTitle)*5);

  if(wantedArtist){
    const artistOverlap=overlap(artist,wantedArtist);
    if(artist===wantedArtist)value+=6;
    else if(artist.includes(wantedArtist)||wantedArtist.includes(artist))value+=5;
    else if(artistOverlap>=.5)value+=4;
    else if(artistOverlap>0)value+=2;
    else value-=2;
  }
  return value;
}

function enqueue(task,signal){
  const run=async()=>{
    if(signal?.aborted)throw abortError();
    const wait=Math.max(0,nextRequestAt-Date.now());
    if(wait)await delay(wait,signal);
    nextRequestAt=Date.now()+REQUEST_GAP_MS;
    return task();
  };
  const result=requestQueue.then(run,run);
  requestQueue=result.catch(()=>undefined);
  return result;
}

async function queryCatalog(term,item,signal){
  const url=new URL(SEARCH_URL);
  url.searchParams.set('term',term);
  url.searchParams.set('country','PE');
  url.searchParams.set('media','music');
  url.searchParams.set('entity','song');
  url.searchParams.set('limit',String(SEARCH_LIMIT));

  const timeoutController=new AbortController();
  const timeout=setTimeout(()=>timeoutController.abort(),REQUEST_TIMEOUT_MS);
  const onAbort=()=>timeoutController.abort();
  signal?.addEventListener('abort',onAbort,{once:true});

  try{
    const response=await fetch(url.toString(),{
      method:'GET',
      mode:'cors',
      cache:'no-store',
      signal:timeoutController.signal
    });
    if(!response.ok)throw new Error('El catálogo respondió '+response.status+'.');
    const data=await response.json();
    return (Array.isArray(data?.results)?data.results:[])
      .filter(candidate=>candidate?.kind==='song')
      .map(candidate=>({candidate,score:score(item,candidate)}))
      .sort((a,b)=>b.score-a.score);
  }catch(error){
    if(signal?.aborted)throw abortError();
    if(error?.name==='AbortError')throw new Error('La consulta al catálogo excedió el tiempo de espera.');
    throw error;
  }finally{
    clearTimeout(timeout);
    signal?.removeEventListener('abort',onAbort);
  }
}

function toTrack(best){
  return {
    trackId:String(best.candidate.trackId||''),
    title:text(best.candidate.trackName),
    artist:text(best.candidate.artistName),
    album:text(best.candidate.collectionName),
    artwork:artwork(best.candidate.artworkUrl100),
    url:text(best.candidate.trackViewUrl),
    score:best.score
  };
}

async function lookup(item,signal){
  const title=text(item?.title);
  if(!title)return {status:'not-found'};

  const candidates=await queryCatalog(title,item,signal);
  const best=candidates[0];
  const minimum=text(item?.artist)?6:5;

  if(!best||best.score<minimum)return {status:'not-found'};
  return {status:'matched',track:toTrack(best)};
}

async function searchMusicCatalog(item,signal){
  const key=normalize([item?.title,item?.artist].filter(Boolean).join(' '));
  if(!key)return {status:'not-found'};
  if(cache.has(key))return cache.get(key);

  try{
    const result=await enqueue(()=>lookup(item,signal),signal);
    cache.set(key,result);
    return result;
  }catch(error){
    if(error?.name==='AbortError')throw error;
    return {status:'error',message:error?.message||'No se pudo consultar el catálogo musical.'};
  }
}

export { searchMusicCatalog };
