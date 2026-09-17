/* Distribución Editor consolidado · interfaz/acciones P0-P2 · memory-only */

/* ===== pruebas/distribucion/app.js ===== */
const NS='http://www.w3.org/2000/svg';
const planner=document.getElementById('planner');
const itemsLayer=document.getElementById('itemsLayer');
const drawLayer=document.getElementById('drawLayer');
const measureLayer=document.getElementById('measureLayer');
const guideLayer=document.getElementById('guideLayer');
const gridLayer=document.getElementById('gridLayer');
const bgImage=document.getElementById('bgImage');
const scaleInput=document.getElementById('scaleInput');
const showGrid=document.getElementById('showGrid');
const showClearance=document.getElementById('showClearance');
const showLabels=document.getElementById('showLabels');
const showNames=document.getElementById('showNames');
const layerList=document.getElementById('layerList');
const validationBox=document.getElementById('validationBox');
const elementCount=document.getElementById('elementCount');
const selectionForm=document.getElementById('selectionForm');
const selectionEmpty=document.getElementById('selectionEmpty');
const selectionTag=document.getElementById('selectionTag');
const lockedNote=document.getElementById('lockedNote');
const dimensionLimitNote=document.getElementById('dimensionLimitNote');
const tentStyleFields=document.getElementById('tentStyleFields');
const tentFillColor=document.getElementById('tentFillColor');
const tentTransparencyRange=document.getElementById('tentTransparencyRange');
const tentTransparencyNumber=document.getElementById('tentTransparencyNumber');
const seatEditorWrap=document.getElementById('seatEditorWrap');
const seatEditor=document.getElementById('seatEditor');
const seatCount=document.getElementById('seatCount');
const guestList=document.getElementById('guestList');
const guestSearch=document.getElementById('guestSearch');
const newGuestName=document.getElementById('newGuestName');
const bulkGuests=document.getElementById('bulkGuests');
const selLabel=document.getElementById('selLabel');
const selX=document.getElementById('selX');
const selY=document.getElementById('selY');
const selW=document.getElementById('selW');
const selH=document.getElementById('selH');
const selRot=document.getElementById('selRot');
const selColor=document.getElementById('selColor');
const summaryTables=document.getElementById('summaryTables');
const summarySeats=document.getElementById('summarySeats');
const summaryAssigned=document.getElementById('summaryAssigned');
const summaryElements=document.getElementById('summaryElements');
const cursorCoords=document.getElementById('cursorCoords');
const measureNote=document.getElementById('measureNote');
const multiToolbarChip=document.getElementById('multiToolbarChip');
const measureToolbarChip=document.getElementById('measureToolbarChip');
const tentDrawHint=document.getElementById('tentDrawHint');
const presentationOverlay=document.getElementById('presentationOverlay');
const presentationMount=document.getElementById('presentationMount');
const proposalModal=document.getElementById('proposalModal');
const proposalList=document.getElementById('proposalList');
const proposalNameTop=document.getElementById('proposalNameTop');
const proposalNameCanvas=document.getElementById('proposalNameCanvas');

const SAMPLE_NAMES=['Lucero','Antonio','María','Carlos','Rosa','Jorge','Paola','Diego','Ana','Luis'];
const BASE_TABLE=Object.freeze({widthM:3.4,heightM:3.4,radiusM:.915,capacity:10,color:'#d9b978'});
const TYPE_DEFAULTS=Object.freeze({
  table:{label:'Mesa 10 personas',widthM:3.4,heightM:3.4,capacity:10,color:'#d9b978',shape:'table'},
  dance:{label:'Pista de baile 5 × 5 m',widthM:5,heightM:5,color:'#8f6642',shape:'rect'},
  couple:{label:'Mesa de novios',widthM:3,heightM:1.2,color:'#d79aa7',shape:'rect'},
  bar:{label:'Barra',widthM:4,heightM:1.2,color:'#7a9e87',shape:'rect'},
  dj:{label:'DJ / sonido',widthM:3,heightM:2,color:'#7e7f9a',shape:'rect'},
  altar:{label:'Altar',widthM:4,heightM:2,color:'#e3d3ae',shape:'rect'},
  cake:{label:'Mesa de torta',widthM:1.8,heightM:1.8,color:'#cfa9c7',shape:'circle'},
  photo:{label:'Photobooth',widthM:3,heightM:2,color:'#6f95aa',shape:'rect'},
  mirror:{label:'Espejo selfie',widthM:1,heightM:.2,color:'#dfeaf0',shape:'rect'},
  gift:{label:'Mesa de regalos',widthM:1.8,heightM:.75,color:'#d8c2a8',shape:'rect'},
  guestbook:{label:'Mesa de firmas',widthM:1.2,heightM:.6,color:'#c9b7d4',shape:'rect'},
  welcome:{label:'Mesa de bienvenida',widthM:1.8,heightM:.75,color:'#d9c8b8',shape:'rect'},
  favors:{label:'Mesa de recuerdos',widthM:1.5,heightM:.7,color:'#d3b8c5',shape:'rect'},
  cocktail:{label:'Mesa alta / cóctel',widthM:.8,heightM:.8,color:'#c8b38d',shape:'circle'},
  chair:{label:'Silla',widthM:.5,heightM:.5,color:'#c7bcae',shape:'rect'},
  buffet:{label:'Buffet',widthM:3,heightM:.9,color:'#caa780',shape:'rect'},
  drinks:{label:'Estación de bebidas',widthM:2,heightM:.8,color:'#91a9a0',shape:'rect'},
  desserts:{label:'Estación de postres',widthM:2.4,heightM:.8,color:'#d6abc1',shape:'rect'},
  snacks:{label:'Carrito de snacks',widthM:1.5,heightM:.8,color:'#d6b28d',shape:'rect'},
  supplier:{label:'Mesa de proveedores',widthM:1.8,heightM:.75,color:'#aeb5a0',shape:'rect'},
  stage:{label:'Escenario',widthM:4,heightM:2.5,color:'#8a7d91',shape:'rect'},
  screen:{label:'Pantalla / proyector',widthM:2.5,heightM:.5,color:'#9aa5ad',shape:'rect'},
  booth360:{label:'Cabina 360',widthM:2.5,heightM:2.5,color:'#9d8dac',shape:'circle'},
  arch:{label:'Arco decorativo',widthM:2.4,heightM:.8,color:'#c7b59a',shape:'rect'},
  backdrop:{label:'Panel floral / backdrop',widthM:2.5,heightM:.6,color:'#c8a8b6',shape:'rect'},
  sign:{label:'Tótem / letrero',widthM:.8,heightM:.5,color:'#b4aa92',shape:'rect'},
  planter:{label:'Macetero / decoración',widthM:.6,heightM:.6,color:'#95a27f',shape:'circle'},
  divider:{label:'Separador / biombo',widthM:2,heightM:.4,color:'#b7aa9e',shape:'rect'},
  entrance:{label:'Entrada',widthM:2,heightM:1.2,color:'#93a889',shape:'rect'},
  exit:{label:'Salida',widthM:2,heightM:1.2,color:'#b28b86',shape:'rect'},
  restroom:{label:'Baños',widthM:2.5,heightM:2,color:'#9da7ad',shape:'rect'},
  kitchen:{label:'Cocina / servicio',widthM:3,heightM:2.5,color:'#b0a18c',shape:'rect'},
  technical:{label:'Zona técnica',widthM:2,heightM:1.5,color:'#8d939a',shape:'rect'},
  column:{label:'Columna',widthM:.5,heightM:.5,color:'#888680',shape:'rect'},
  extinguisher:{label:'Extintor / seguridad',widthM:.4,heightM:.4,color:'#b86767',shape:'rect'},
  tent:{label:'Área dibujada',widthM:5,heightM:4,color:'#d8c9a6',shape:'polygon'}
});
const DRAW_AREA_PRESETS=Object.freeze({
  tent:{label:'Toldo',color:'#d8c9a6',transparency:45,suggestedWidthM:5,suggestedHeightM:4},
  stage:{label:'Área de escenario',color:'#8a7d91',transparency:58,suggestedWidthM:4,suggestedHeightM:2.5},
  lounge:{label:'Área lounge',color:'#b8a8c7',transparency:62,suggestedWidthM:3,suggestedHeightM:2.5},
  kids:{label:'Área infantil',color:'#d8b5a2',transparency:62,suggestedWidthM:3,suggestedHeightM:3},
  buffet:{label:'Área de buffet',color:'#caa780',transparency:58,suggestedWidthM:3,suggestedHeightM:.9},
  technical:{label:'Zona técnica',color:'#8d939a',transparency:62,suggestedWidthM:2,suggestedHeightM:1.5},
  restricted:{label:'Zona restringida',color:'#b86767',transparency:68,suggestedWidthM:2,suggestedHeightM:2},
  circulation:{label:'Circulación',color:'#8da08b',transparency:72,suggestedWidthM:1.2,suggestedHeightM:4},
  custom:{label:'Área personalizada',color:'#a99f93',transparency:62,suggestedWidthM:2,suggestedHeightM:2}
});
const LAYERS=Object.freeze({
  table:'Mesas',dance:'Pistas',couple:'Mesa de novios',bar:'Barras',dj:'DJ / sonido',altar:'Altares',cake:'Mesa de torta',photo:'Photobooth',mirror:'Espejos',
  gift:'Mesa de regalos',guestbook:'Mesa de firmas',welcome:'Bienvenida',favors:'Recuerdos',cocktail:'Mesas altas',chair:'Sillas',
  buffet:'Buffet',drinks:'Bebidas',desserts:'Postres',snacks:'Snacks',supplier:'Proveedores',
  stage:'Escenario',screen:'Pantallas',booth360:'Cabina 360',arch:'Arcos',backdrop:'Paneles',sign:'Letreros',planter:'Decoración',divider:'Separadores',
  entrance:'Entradas',exit:'Salidas',restroom:'Baños',kitchen:'Cocina',technical:'Zona técnica',column:'Columnas',extinguisher:'Seguridad',tent:'Áreas dibujadas'
});

let elements=[];
let guests=[];
let guestUid=1;
let selectedIds=[];
let selectedId='';
let drag=null;
let zoom=1;
let bgVisible=true;
let bgPosition={x:0,y:0};
let bgDrag=null;
let backgroundMoveMode=false;
let viewportPan=null;
let viewportOffset={x:0,y:0};
let measureMode=false;
let measureDraft=null;
let measurements=[];
let measurementUid=1;
let drawingTent=false;
let tentDraft=[];
let tentHoverPoint=null;
let hiddenLayers={};
let lockedLayers={};
let guideLines={vertical:null,horizontal:null};
let historyPast=[];
let historyFuture=[];
let restoringHistory=false;
let copiedPlannerItems=[];
let pasteSequence=0;
let proposals=[];
let currentProposalId='';
let uiFontScale=1.10;
const UI_FONT_MIN=.90;
const UI_FONT_MAX=1.30;
const UI_FONT_STEP=.05;

const clone=value=>JSON.parse(JSON.stringify(value));
const PHYSICAL_SCALE_PX_PER_M=32;
const currentScale=()=>PHYSICAL_SCALE_PX_PER_M;
const makeId=(prefix='item')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const getItem=id=>elements.find(item=>item.id===id)||null;
const selectedItems=()=>selectedIds.map(getItem).filter(Boolean);
const isSelected=id=>selectedIds.includes(id);
const getVisibleElements=()=>elements.filter(item=>!hiddenLayers[item.type]);
const isItemLocked=item=>Boolean(item&&(item.locked||lockedLayers[item.type]));

function svgEl(tag,attrs={}){
  const node=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}
function applyUiFontScale(){
  document.documentElement.style.setProperty('--ui-font-scale',String(uiFontScale));
  const selector='.app-header button,.app-header span,.app-header strong,.app-header small,.app-header p,.app-header h1,.panel button,.panel input,.panel select,.panel textarea,.panel label,.panel span,.panel strong,.panel small,.panel p,.panel h2,.panel h3,.panel summary,.canvas-head button,.canvas-head span,.canvas-head strong,.canvas-footer span,.canvas-footer b,.floating-legend span,.measure-note';
  document.querySelectorAll(selector).forEach(node=>{
    if(node.closest('svg'))return;
    if(!node.dataset.baseFontPx){
      const size=parseFloat(getComputedStyle(node).fontSize);
      if(Number.isFinite(size)&&size>0)node.dataset.baseFontPx=String(size);
    }
    const base=Number(node.dataset.baseFontPx);
    if(Number.isFinite(base)&&base>0)node.style.fontSize=`${(base*uiFontScale).toFixed(2)}px`;
  });
  const reset=document.getElementById('textSizeReset');
  if(reset)reset.textContent=`${Math.round(uiFontScale*100)}%`;
}
function setUiFontScale(next){
  uiFontScale=Math.max(UI_FONT_MIN,Math.min(UI_FONT_MAX,Math.round(Number(next)*100)/100));
  applyUiFontScale();
}
function svgPoint(event){
  const point=planner.createSVGPoint();
  point.x=event.clientX;point.y=event.clientY;
  return point.matrixTransform(planner.getScreenCTM().inverse());
}
function nextPosition(index){
  const column=index%3,row=Math.floor(index/3);
  return {x:310+column*265,y:230+(row%3)*220};
}
function setSelection(ids=[],primary=''){
  const valid=[...new Set(ids.filter(id=>getItem(id)&&!hiddenLayers[getItem(id).type]))];
  selectedIds=valid;
  selectedId=primary&&valid.includes(primary)?primary:(valid[0]||'');
}
function clearSelection(){selectedIds=[];selectedId='';}
function selected(){return getItem(selectedId);}
function ensureTableSeats(table){
  if(!table||table.type!=='table')return;
  const seats=Array.isArray(table.seats)?table.seats.slice(0,table.capacity):[];
  while(seats.length<table.capacity)seats.push(null);
  table.seats=seats;
}
function guestById(id){return guests.find(guest=>guest.id===id)||null;}
function guestAssignmentMap(){
  const map=new Map();
  elements.filter(item=>item.type==='table').forEach(table=>{
    ensureTableSeats(table);
    table.seats.forEach((guestId,index)=>{
      if(guestId)map.set(guestId,{tableId:table.id,tableLabel:table.label,seatIndex:index,seatNumber:index+1});
    });
  });
  return map;
}
function clearGuestFromOtherSeats(guestId,exceptTableId='',exceptSeat=-1){
  if(!guestId)return;
  elements.filter(item=>item.type==='table').forEach(table=>{
    ensureTableSeats(table);
    table.seats=table.seats.map((value,index)=>value===guestId&&!(table.id===exceptTableId&&index===exceptSeat)?null:value);
  });
}

function stateSnapshot(){
  return {
    elements:clone(elements),guests:clone(guests),guestUid,selectedIds:clone(selectedIds),selectedId,
    scale:PHYSICAL_SCALE_PX_PER_M,hiddenLayers:clone(hiddenLayers),lockedLayers:clone(lockedLayers),
    measurements:clone(measurements),measurementUid,bgVisible,bgPosition:clone(bgPosition),
    settings:{grid:showGrid.checked,clearance:showClearance.checked,labels:showLabels.checked,names:showNames.checked}
  };
}
function restoreState(state){
  if(!state)return;
  restoringHistory=true;
  elements=clone(state.elements||[]);guests=clone(state.guests||[]);guestUid=state.guestUid||1;
  selectedIds=clone(state.selectedIds||[]);selectedId=state.selectedId||'';
  scaleInput.value=PHYSICAL_SCALE_PX_PER_M;hiddenLayers=clone(state.hiddenLayers||{});lockedLayers=clone(state.lockedLayers||{});
  measurements=clone(state.measurements||[]);measurementUid=state.measurementUid||1;bgVisible=state.bgVisible!==false;bgPosition={x:Number(state.bgPosition?.x)||0,y:Number(state.bgPosition?.y)||0};
  showGrid.checked=state.settings?.grid!==false;showClearance.checked=state.settings?.clearance!==false;
  showLabels.checked=state.settings?.labels!==false;showNames.checked=state.settings?.names!==false;
  restoringHistory=false;render();
}
function pushHistory(){
  if(restoringHistory)return;
  const raw=JSON.stringify(stateSnapshot());
  if(historyPast.at(-1)===raw)return;
  historyPast.push(raw);if(historyPast.length>80)historyPast.shift();historyFuture=[];updateHistoryButtons();
}
function updateHistoryButtons(){
  document.getElementById('btnUndo').disabled=historyPast.length<=1;
  document.getElementById('btnRedo').disabled=historyFuture.length===0;
}
function undoHistory(){
  if(historyPast.length<=1)return;
  historyFuture.push(historyPast.pop());restoreState(JSON.parse(historyPast.at(-1)));updateHistoryButtons();
}
function redoHistory(){
  if(!historyFuture.length)return;
  const raw=historyFuture.pop();historyPast.push(raw);restoreState(JSON.parse(raw));updateHistoryButtons();
}
function commitMutation(){pushHistory();render();saveCurrentProposalSnapshot();}

function seedGuests(){
  guests=SAMPLE_NAMES.map(name=>({id:`guest-${guestUid++}`,name}));
}
function makeTableSeats(assign=false){return Array.from({length:BASE_TABLE.capacity},(_,index)=>assign?(guests[index]?.id||null):null);}
function addElement(type,{record=true,assignGuests=false}={}){
  const base=TYPE_DEFAULTS[type];if(!base)return null;
  const position=nextPosition(elements.length);
  const number=elements.filter(item=>item.type===type).length+1;
  const item={id:makeId(type),type,shape:base.shape,label:type==='table'?`Mesa ${elements.filter(x=>x.type==='table').length+1}`:(number>1?`${base.label} ${number}`:base.label),x:position.x,y:position.y,widthM:base.widthM,heightM:base.heightM,rotation:0,color:base.color,locked:false};
  if(type==='table'){item.capacity=BASE_TABLE.capacity;item.seats=makeTableSeats(assignGuests);}
  elements.push(item);setSelection([item.id],item.id);if(record)pushHistory();render();return item;
}

function itemBounds(item){
  const scale=currentScale(),w=item.widthM*scale,h=item.heightM*scale;
  return {x:item.x-w/2,y:item.y-h/2,w,h,cx:item.x,cy:item.y,r:Math.max(w,h)/2};
}
function rectPolygon(item){
  const scale=currentScale(),hw=item.widthM*scale/2,hh=item.heightM*scale/2,angle=(item.rotation||0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:item.x+x*cos-y*sin,y:item.y+x*sin+y*cos}));
}
function segmentsIntersect(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const d1=cross(a,b,c),d2=cross(a,b,d),d3=cross(c,d,a),d4=cross(c,d,b);
  return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));
}
function pointInPolygon(point,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||1e-9)+a.x))inside=!inside;
  }
  return inside;
}
function polygonIntersectsPolygon(a,b){
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(segmentsIntersect(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
  return pointInPolygon(a[0],b)||pointInPolygon(b[0],a);
}
function pointSegmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  if(!len)return Math.hypot(p.x-a.x,p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len));
  return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
}
function circleIntersectsPolygon(circle,poly){
  if(pointInPolygon(circle,poly))return true;
  for(let i=0;i<poly.length;i++)if(pointSegmentDistance(circle,poly[i],poly[(i+1)%poly.length])<circle.r-3)return true;
  return false;
}
function circleGeom(item){const b=itemBounds(item);return{x:item.x,y:item.y,r:b.r};}
function intersects(a,b){
  const aCircle=a.shape==='table'||a.shape==='circle',bCircle=b.shape==='table'||b.shape==='circle';
  if(aCircle&&bCircle){const A=circleGeom(a),B=circleGeom(b);return Math.hypot(A.x-B.x,A.y-B.y)<A.r+B.r-5;}
  if(!aCircle&&!bCircle)return polygonIntersectsPolygon(rectPolygon(a),rectPolygon(b));
  const circle=aCircle?circleGeom(a):circleGeom(b),poly=aCircle?rectPolygon(b):rectPolygon(a);
  return circleIntersectsPolygon(circle,poly);
}
function conflictIds(){
  const ids=new Set(),visible=getVisibleElements();
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
    if(visible[i].type==='tent'||visible[j].type==='tent')continue;
    if(intersects(visible[i],visible[j])){ids.add(visible[i].id);ids.add(visible[j].id);}
  }
  return ids;
}
function validationMessages(conflicts=conflictIds()){
  const messages=[];
  const capacity=elements.reduce((sum,item)=>sum+(item.capacity||0),0);
  const assigned=guestAssignmentMap().size;
  const unassigned=Math.max(0,guests.length-assigned);
  if(conflicts.size)messages.push({type:'bad',text:`Hay ${conflicts.size} elemento(s) involucrados en superposición.`});
  else messages.push({type:'good',text:'No se detectaron superposiciones entre mobiliarios.'});
  if(unassigned>0)messages.push({type:'warn',text:`Quedan ${unassigned} invitado(s) sin asignar.`});
  else if(guests.length)messages.push({type:'good',text:'Todos los invitados ya tienen asignación o están listos para asignarse.'});
  if(guests.length>capacity)messages.push({type:'bad',text:`La capacidad total (${capacity}) es menor al número de invitados (${guests.length}).`});
  else messages.push({type:'good',text:`La capacidad total (${capacity}) es suficiente para ${guests.length} invitado(s).`});
  const tableItems=getVisibleElements().filter(item=>item.type==='table');
  const tableClearanceMarginM=.60;let closeTables=0;
  for(let i=0;i<tableItems.length;i++)for(let j=i+1;j<tableItems.length;j++){
    const A=tableItems[i],B=tableItems[j];
    const minimumCenterDistance=(((A.widthM+B.widthM)/2)+tableClearanceMarginM)*currentScale();
    const actualCenterDistance=Math.hypot(A.x-B.x,A.y-B.y);
    if(actualCenterDistance<minimumCenterDistance&&actualCenterDistance>5)closeTables++;
  }
  if(closeTables)messages.push({type:'warn',text:`Se detectaron ${closeTables} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.`});
  return messages;
}

function guestAnchor(angle){const c=Math.cos(angle);if(c>.28)return'start';if(c<-.28)return'end';return'middle';}
function compactName(name,max=18){const value=String(name||'').trim();return value.length>max?value.slice(0,max-1)+'…':value;}
function renderGuestLabel(group,guestName,angle,tableRadius){
  if(!showNames.checked||!guestName)return;
  const distance=tableRadius*2.18,x=Math.cos(angle)*distance,y=Math.sin(angle)*distance,anchor=guestAnchor(angle),name=compactName(guestName),width=Math.max(46,name.length*7+18);
  const label=svgEl('g',{class:'guest-tag',transform:`translate(${x.toFixed(2)} ${y.toFixed(2)})`});
  let rectX=-width/2,textX=0;if(anchor==='start'){rectX=0;textX=8;}if(anchor==='end'){rectX=-width;textX=-8;}
  label.appendChild(svgEl('rect',{x:rectX,y:-12,width,height:24,rx:8}));
  const text=svgEl('text',{x:textX,y:1,'text-anchor':anchor});text.textContent=name;label.appendChild(text);group.appendChild(label);
}
function appendRotateHandle(group,item){
  if(selectedId!==item.id||selectedIds.length!==1||isItemLocked(item))return;
  const b=itemBounds(item),offset=Math.max(44,b.h/2+28);
  group.appendChild(svgEl('line',{x1:0,y1:-b.h/2,y2:-offset,x2:0,class:'rotate-stem'}));
  group.appendChild(svgEl('circle',{cx:0,cy:-offset,r:9,class:'rotate-handle','data-rotate-id':item.id}));
}
function renderTable(item,scale,conflicts){
  ensureTableSeats(item);
  const danger=conflicts.has(item.id),selectedState=isSelected(item.id),group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable table-hit${selectedState?' table-selected':''}${danger?' has-conflict':''}`,'data-id':item.id});
  const sizeFactor=Math.max(.35,item.widthM/BASE_TABLE.widthM),tableRadius=BASE_TABLE.radiusM*scale*sizeFactor,clearanceRadius=item.widthM*scale/2,chairRadius=Math.max(7,tableRadius*.12),chairDistance=tableRadius*1.58;
  if(showClearance.checked)group.appendChild(svgEl('circle',{r:clearanceRadius,class:'clearance',fill:item.color,stroke:danger?'#c84242':item.color}));
  item.seats.forEach((guestId,index)=>{
    const angle=-Math.PI/2+Math.PI*2*index/item.capacity,chairX=Math.cos(angle)*chairDistance,chairY=Math.sin(angle)*chairDistance;
    group.appendChild(svgEl('circle',{cx:chairX.toFixed(2),cy:chairY.toFixed(2),r:chairRadius.toFixed(2),class:'chair'}));
    renderGuestLabel(group,guestById(guestId)?.name||'',angle,tableRadius);
  });
  group.appendChild(svgEl('circle',{r:tableRadius,class:'tabletop',fill:item.color,stroke:danger?'#c84242':selectedState?'#d59b3c':'#3d3a35','stroke-width':danger||selectedState?5:3,filter:'url(#softShadow)'}));
  if(showLabels.checked){const title=svgEl('text',{x:0,y:-3,'text-anchor':'middle',class:'table-title'});title.textContent=item.label;group.appendChild(title);const meta=svgEl('text',{x:0,y:15,'text-anchor':'middle',class:'table-meta'});meta.textContent=`${item.capacity} personas`;group.appendChild(meta);}
  appendRotateHandle(group,item);return group;
}
function renderObject(item,scale,conflicts){
  const danger=conflicts.has(item.id),selectedState=isSelected(item.id),width=item.widthM*scale,height=item.heightM*scale,group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable item-hit${selectedState?' item-selected':''}${danger?' has-conflict':''}`,'data-id':item.id});
  const stroke=danger?'#c84242':selectedState?'#d59b3c':'#3d3a35';
  const shape=item.shape==='circle'?svgEl('ellipse',{cx:0,cy:0,rx:width/2,ry:height/2,fill:item.color,class:'object-shape',stroke,'stroke-width':danger||selectedState?5:3}):svgEl('rect',{x:-width/2,y:-height/2,width,height,rx:Math.min(12,height*.12),fill:item.color,class:'object-shape',stroke,'stroke-width':danger||selectedState?5:3});
  group.appendChild(shape);
  if(showLabels.checked){const title=svgEl('text',{x:0,y:-2,'text-anchor':'middle',class:'object-title'});title.textContent=item.label;group.appendChild(title);const meta=svgEl('text',{x:0,y:14,'text-anchor':'middle',class:'object-meta'});meta.textContent=`${item.widthM.toFixed(1)} × ${item.heightM.toFixed(1)} m`;group.appendChild(meta);}
  appendRotateHandle(group,item);return group;
}
function renderTent(item){
  const selectedState=isSelected(item.id),points=(item.points||[]).map(p=>`${p.x},${p.y}`).join(' '),group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable tent-hit${selectedState?' item-selected':''}`,'data-id':item.id});
  group.appendChild(svgEl('polygon',{points,fill:item.fillColor||item.color,'fill-opacity':1-(Number(item.transparency)||0)/100,stroke:selectedState?'#d59b3c':'#6f6654','stroke-width':selectedState?5:3,class:'object-shape'}));
  if(showLabels.checked){const text=svgEl('text',{x:0,y:0,'text-anchor':'middle',class:'object-title'});text.textContent=item.label;group.appendChild(text);}
  appendRotateHandle(group,item);return group;
}
function renderMeasureLayer(){
  measureLayer.replaceChildren();
  const scale=currentScale();
  const all=[...measurements];if(measureDraft?.a&&measureDraft?.b)all.push({...measureDraft,id:'draft'});
  all.forEach(measure=>{
    measureLayer.appendChild(svgEl('line',{x1:measure.a.x,y1:measure.a.y,x2:measure.b.x,y2:measure.b.y,class:'measure-line'}));
    measureLayer.appendChild(svgEl('circle',{cx:measure.a.x,cy:measure.a.y,r:5,class:'measure-point'}));
    measureLayer.appendChild(svgEl('circle',{cx:measure.b.x,cy:measure.b.y,r:5,class:'measure-point'}));
    const distance=Math.hypot(measure.b.x-measure.a.x,measure.b.y-measure.a.y)/scale,text=svgEl('text',{x:(measure.a.x+measure.b.x)/2,y:(measure.a.y+measure.b.y)/2-8,'text-anchor':'middle',class:'measure-label'});text.textContent=`${distance.toFixed(2)} m`;measureLayer.appendChild(text);
  });
}
function renderGuideLayer(){
  guideLayer.replaceChildren();
  if(guideLines.vertical!==null)guideLayer.appendChild(svgEl('line',{x1:guideLines.vertical,x2:guideLines.vertical,y1:0,y2:1086,class:'guide-line'}));
  if(guideLines.horizontal!==null)guideLayer.appendChild(svgEl('line',{x1:0,x2:1448,y1:guideLines.horizontal,y2:guideLines.horizontal,class:'guide-line'}));
}
function renderDrawLayer(){
  drawLayer.replaceChildren();if(!drawingTent||!tentDraft.length)return;
  const points=[...tentDraft,...(tentHoverPoint?[tentHoverPoint]:[])];
  drawLayer.appendChild(svgEl('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),class:'tent-draft'}));
  tentDraft.forEach(point=>drawLayer.appendChild(svgEl('circle',{cx:point.x,cy:point.y,r:5,class:'tent-point'})));
}
function applySmartGuides(targetX,targetY,ignoreIds=[]){
  const ignore=new Set(ignoreIds),threshold=9;let nextX=targetX,nextY=targetY;guideLines={vertical:null,horizontal:null};
  const xCandidates=[724,...getVisibleElements().filter(item=>!ignore.has(item.id)).map(item=>item.x)],yCandidates=[543,...getVisibleElements().filter(item=>!ignore.has(item.id)).map(item=>item.y)];
  let bestX=null,bestY=null;xCandidates.forEach(value=>{const diff=Math.abs(targetX-value);if(diff<=threshold&&(!bestX||diff<bestX.diff))bestX={value,diff};});yCandidates.forEach(value=>{const diff=Math.abs(targetY-value);if(diff<=threshold&&(!bestY||diff<bestY.diff))bestY={value,diff};});
  if(bestX){nextX=bestX.value;guideLines.vertical=bestX.value;}if(bestY){nextY=bestY.value;guideLines.horizontal=bestY.value;}return{x:nextX,y:nextY};
}

function renderLayerList(){
  layerList.replaceChildren();
  const types=Object.keys(LAYERS).filter(type=>elements.some(item=>item.type===type));
  if(!types.length){const empty=document.createElement('div');empty.className='validation-item';empty.textContent='Todavía no hay elementos en el plano.';layerList.appendChild(empty);return;}
  types.forEach(type=>{
    const row=document.createElement('div');row.className='layer-row';
    const eye=document.createElement('button');eye.type='button';eye.className='layer-eye';eye.textContent=hiddenLayers[type]?'○':'●';eye.title=hiddenLayers[type]?'Mostrar capa':'Ocultar capa';eye.addEventListener('click',()=>{hiddenLayers[type]=!hiddenLayers[type];setSelection(selectedIds.filter(id=>!hiddenLayers[getItem(id)?.type]),selectedId);commitMutation();});
    const text=document.createElement('div');const strong=document.createElement('strong');strong.textContent=LAYERS[type];const small=document.createElement('small');small.textContent=`${elements.filter(item=>item.type===type).length} elemento(s)`;text.append(strong,small);
    const lock=document.createElement('button');lock.type='button';lock.className='layer-lock';lock.textContent=lockedLayers[type]?'🔒':'🔓';lock.title=lockedLayers[type]?'Desbloquear capa':'Bloquear capa';lock.addEventListener('click',()=>{lockedLayers[type]=!lockedLayers[type];render();pushHistory();});
    row.append(eye,text,lock);layerList.appendChild(row);
  });
}
function renderValidation(){
  validationBox.innerHTML=validationMessages().map(msg=>`<div class="validation-item ${msg.type}">${msg.text}</div>`).join('');
}
function renderGuestManager(){
  const assignments=guestAssignmentMap(),query=(guestSearch.value||'').trim().toLocaleLowerCase('es'),filtered=guests.filter(g=>g.name.toLocaleLowerCase('es').includes(query));
  document.getElementById('guestCountText').textContent=`${guests.length} invitados`;
  document.getElementById('guestPendingText').textContent=`${Math.max(0,guests.length-assignments.size)} sin asignar`;
  guestList.replaceChildren();
  filtered.forEach(guest=>{
    const row=document.createElement('div');
    row.className='guest-row guest-drag-source';
    row.draggable=true;
    row.dataset.guestId=guest.id;
    row.title='Arrastra este invitado hacia una silla';
    const info=document.createElement('div');
    const strong=document.createElement('strong');strong.textContent=guest.name;
    const small=document.createElement('small');const location=assignments.get(guest.id);small.textContent=location?`${location.tableLabel} · Asiento ${location.seatNumber}`:'Sin asignar';
    info.append(strong,small);
    const handle=document.createElement('span');handle.className='guest-drag-handle';handle.textContent='⋮⋮';handle.setAttribute('aria-hidden','true');
    row.append(info,handle);guestList.appendChild(row);
  });
}

function draggedGuestId(event){
  return event.dataTransfer?.getData('text/mgd-guest')||event.dataTransfer?.getData('text/plain')||'';
}
function clearSeatDropFeedback(){
  planner.querySelectorAll('.seat-drop-target').forEach(node=>node.classList.remove('is-seat-drop','is-seat-drop-blocked'));
}
function seatDropTarget(event){
  return event.target?.closest?.('.seat-drop-target[data-table-id][data-seat-index]')||null;
}
function assignGuestToSeat(guestId,tableId,seatIndex){
  const guest=guestById(guestId),table=getItem(tableId),index=Number(seatIndex);
  if(!guest||!table||table.type!=='table'||!Number.isInteger(index))return false;
  ensureTableSeats(table);
  if(index<0||index>=table.seats.length)return false;
  const occupied=table.seats[index];
  if(occupied&&occupied!==guestId)return false;
  clearGuestFromOtherSeats(guestId,table.id,index);
  table.seats[index]=guestId;
  setSelection([table.id],table.id);
  commitMutation();
  return true;
}

guestList.addEventListener('dragstart',event=>{
  const source=event.target.closest?.('.guest-drag-source[data-guest-id]');
  if(!source||!event.dataTransfer)return;
  event.dataTransfer.effectAllowed='move';
  event.dataTransfer.setData('text/mgd-guest',source.dataset.guestId);
  event.dataTransfer.setData('text/plain',source.dataset.guestId);
  source.classList.add('is-dragging');
  planner.classList.add('is-guest-dragging');
});
guestList.addEventListener('dragend',event=>{
  event.target.closest?.('.guest-drag-source')?.classList.remove('is-dragging');
  planner.classList.remove('is-guest-dragging');
  clearSeatDropFeedback();
});
planner.addEventListener('dragover',event=>{
  const guestId=draggedGuestId(event);
  const seat=seatDropTarget(event);
  if(!guestId||!seat)return;
  event.preventDefault();
  clearSeatDropFeedback();
  const occupied=seat.dataset.guestId;
  const blocked=Boolean(occupied&&occupied!==guestId);
  seat.classList.add(blocked?'is-seat-drop-blocked':'is-seat-drop');
  if(event.dataTransfer)event.dataTransfer.dropEffect=blocked?'none':'move';
});
planner.addEventListener('dragleave',event=>{
  const seat=seatDropTarget(event);
  if(seat)seat.classList.remove('is-seat-drop','is-seat-drop-blocked');
});
planner.addEventListener('drop',event=>{
  const guestId=draggedGuestId(event);
  const seat=seatDropTarget(event);
  if(!guestId||!seat)return;
  event.preventDefault();
  event.stopPropagation();
  const tableId=seat.dataset.tableId;
  const seatIndex=Number(seat.dataset.seatIndex);
  const occupied=seat.dataset.guestId;
  clearSeatDropFeedback();
  planner.classList.remove('is-guest-dragging');
  if(occupied&&occupied!==guestId)return;
  assignGuestToSeat(guestId,tableId,seatIndex);
});
function renderSeatEditor(table){
  seatEditor.replaceChildren();
  if(!table||table.type!=='table'){seatEditorWrap.hidden=true;return;}
  seatEditorWrap.hidden=false;ensureTableSeats(table);seatCount.textContent=String(table.capacity);
  const assignments=guestAssignmentMap();
  table.seats.forEach((guestId,index)=>{
    const row=document.createElement('div');row.className='seat-row';const number=document.createElement('span');number.className='seat-number';number.textContent=String(index+1);
    const select=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent='— Sin asignar —';select.appendChild(blank);
    guests.forEach(guest=>{const option=document.createElement('option');option.value=guest.id;option.textContent=guest.name;const location=assignments.get(guest.id);if(location&&!(location.tableId===table.id&&location.seatIndex===index))option.disabled=true;if(guestId===guest.id)option.selected=true;select.appendChild(option);});
    select.addEventListener('change',()=>{const next=select.value||null;if(next)clearGuestFromOtherSeats(next,table.id,index);table.seats[index]=next;commitMutation();});row.append(number,select);seatEditor.appendChild(row);
  });
}
function fillProperties(item){
  const empty=!item;selectionEmpty.hidden=!empty;selectionForm.hidden=empty;selectionTag.hidden=selectedIds.length===0;
  if(selectedIds.length>1){selectionTag.textContent=`${selectedIds.length} elementos`;multiToolbarChip.hidden=false;multiToolbarChip.textContent=`${selectedIds.length} elementos seleccionados`;}
  else if(item){selectionTag.textContent=LAYERS[item.type]||'Elemento';multiToolbarChip.hidden=true;}else multiToolbarChip.hidden=true;
  if(empty)return;
  const locked=isItemLocked(item),scale=currentScale();lockedNote.hidden=!locked;
  selLabel.value=item.label;selX.value=(item.x/scale).toFixed(1);selY.value=(item.y/scale).toFixed(1);selW.value=item.widthM.toFixed(1);selH.value=item.heightM.toFixed(1);selRot.value=String(item.rotation||0);selColor.value=item.fillColor||item.color||'#d9b978';
  const unlimited=item.type==='tent'||item.type==='dance';if(unlimited){selW.removeAttribute('max');selH.removeAttribute('max');dimensionLimitNote.textContent='Sin límite de 5 m para este elemento.';}else{selW.max='5';selH.max='5';dimensionLimitNote.textContent='Máximo permitido para este elemento: 5 m por lado.';}
  tentStyleFields.hidden=item.type!=='tent';if(item.type==='tent'){tentFillColor.value=item.fillColor||item.color;tentTransparencyRange.value=String(item.transparency||0);tentTransparencyNumber.value=String(item.transparency||0);}
  [selLabel,selX,selY,selW,selH,selRot,selColor,document.getElementById('btnBringFront'),document.getElementById('btnSendBack'),document.getElementById('btnAlignNow'),document.getElementById('btnDelete'),document.getElementById('btnDuplicate')].forEach(control=>control.disabled=locked);
  document.getElementById('btnToggleLock').textContent=locked?'🔓 Desbloquear':'🔒 Bloquear';renderSeatEditor(item);
}
function renderSummary(){
  const tables=elements.filter(item=>item.type==='table'),seats=tables.reduce((sum,item)=>sum+(item.capacity||0),0),assigned=guestAssignmentMap().size;
  summaryTables.textContent=String(tables.length);summarySeats.textContent=String(seats);summaryAssigned.textContent=String(assigned);summaryElements.textContent=String(elements.length);elementCount.textContent=`${elements.length} ${elements.length===1?'elemento':'elementos'}`;
}
function render(){
  const scale=currentScale(),conflicts=conflictIds();gridLayer.style.display=showGrid.checked?'':'none';bgImage.style.display=bgVisible?'':'none';bgImage.setAttribute('x',String(bgPosition.x));bgImage.setAttribute('y',String(bgPosition.y));itemsLayer.replaceChildren();
  getVisibleElements().forEach(item=>itemsLayer.appendChild(item.type==='table'?renderTable(item,scale,conflicts):item.type==='tent'?renderTent(item):renderObject(item,scale,conflicts)));
  renderGuideLayer();renderDrawLayer();renderMeasureLayer();renderLayerList();renderValidation();renderGuestManager();fillProperties(selected());renderSummary();updateHistoryButtons();applyUiFontScale();
}

function beginItemDrag(event,item){
  if(measureMode||drawingTent||isItemLocked(item))return;
  const point=svgPoint(event);if(event.ctrlKey||event.metaKey){if(isSelected(item.id))setSelection(selectedIds.filter(id=>id!==item.id),selectedIds.find(id=>id!==item.id)||'');else setSelection([...selectedIds,item.id],item.id);render();return;}
  if(!isSelected(item.id))setSelection([item.id],item.id);
  const starts=selectedItems().map(entry=>({id:entry.id,x:entry.x,y:entry.y}));drag={mode:'move',id:item.id,pointerId:event.pointerId,dx:point.x-item.x,dy:point.y-item.y,starts,moved:false};planner.setPointerCapture(event.pointerId);render();
}
planner.addEventListener('pointerdown',event=>{
  if(event.target===bgImage&&backgroundMoveMode&&!measureMode&&!drawingTent){event.preventDefault();event.stopImmediatePropagation();const point=svgPoint(event);clearSelection();bgDrag={pointerId:event.pointerId,startX:bgPosition.x,startY:bgPosition.y,px:point.x,py:point.y,moved:false};bgImage.classList.add('is-dragging');try{planner.setPointerCapture(event.pointerId);}catch{}render();return;}
  const rotate=event.target.closest?.('[data-rotate-id]');if(rotate){const item=getItem(rotate.getAttribute('data-rotate-id'));if(!item||isItemLocked(item))return;event.preventDefault();const p=svgPoint(event);setSelection([item.id],item.id);drag={mode:'rotate',id:item.id,pointerId:event.pointerId,startAngle:Math.atan2(p.y-item.y,p.x-item.x),startRotation:item.rotation||0,moved:false};planner.setPointerCapture(event.pointerId);return;}
  const group=event.target.closest?.('[data-id]');if(group){const item=getItem(group.getAttribute('data-id'));if(item)beginItemDrag(event,item);return;}
  if(!measureMode&&!drawingTent){clearSelection();render();}
});
planner.addEventListener('pointermove',event=>{
  const point=svgPoint(event),scale=currentScale();cursorCoords.textContent=`x ${(point.x/scale).toFixed(2)} m · y ${(point.y/scale).toFixed(2)} m`;
  if(drawingTent){tentHoverPoint={x:point.x,y:point.y};renderDrawLayer();return;}
  if(bgDrag&&event.pointerId===bgDrag.pointerId){event.preventDefault();bgPosition.x=bgDrag.startX+(point.x-bgDrag.px);bgPosition.y=bgDrag.startY+(point.y-bgDrag.py);bgDrag.moved=true;bgImage.setAttribute('x',String(bgPosition.x));bgImage.setAttribute('y',String(bgPosition.y));return;}
  if(!drag||event.pointerId!==drag.pointerId)return;
  const item=getItem(drag.id);if(!item)return;
  if(drag.mode==='rotate'){item.rotation=drag.startRotation+(Math.atan2(point.y-item.y,point.x-item.x)-drag.startAngle)*180/Math.PI;drag.moved=true;render();return;}
  const guides=applySmartGuides(point.x-drag.dx,point.y-drag.dy,selectedIds),primaryStart=drag.starts.find(start=>start.id===drag.id),deltaX=guides.x-primaryStart.x,deltaY=guides.y-primaryStart.y;
  drag.starts.forEach(start=>{const target=getItem(start.id);if(target&&!isItemLocked(target)){target.x=Math.max(20,Math.min(1180,start.x+deltaX));target.y=Math.max(20,Math.min(740,start.y+deltaY));}});drag.moved=true;render();
});
function endDrag(event){if(bgDrag&&event.pointerId===bgDrag.pointerId){event.preventDefault();try{planner.releasePointerCapture(event.pointerId);}catch{}const moved=bgDrag.moved;bgDrag=null;bgImage.classList.remove('is-dragging');if(moved){pushHistory();saveCurrentProposalSnapshot();}render();return;}if(!drag||event.pointerId!==drag.pointerId)return;try{planner.releasePointerCapture(event.pointerId);}catch{}const moved=drag.moved;drag=null;guideLines={vertical:null,horizontal:null};if(moved)pushHistory();render();}
planner.addEventListener('pointerup',endDrag);planner.addEventListener('pointercancel',endDrag);

function toggleMeasureMode(){measureMode=!measureMode;drawingTent=false;tentDraft=[];tentHoverPoint=null;measureDraft=null;measureNote.hidden=!measureMode;measureToolbarChip.hidden=!measureMode;document.getElementById('btnMeasure').classList.toggle('active',measureMode);render();}
planner.addEventListener('click',event=>{
  if(drawingTent){const p=svgPoint(event);tentDraft.push({x:p.x,y:p.y});tentHoverPoint=null;renderDrawLayer();return;}
  if(!measureMode)return;const p=svgPoint(event);if(!measureDraft){measureDraft={a:{x:p.x,y:p.y},b:{x:p.x,y:p.y}};}else{measureDraft.b={x:p.x,y:p.y};measurements.push({id:measurementUid++,a:measureDraft.a,b:measureDraft.b});measureDraft=null;pushHistory();}render();
});
planner.addEventListener('dblclick',event=>{if(drawingTent){event.preventDefault();finishTent();}});

function startTent(){drawingTent=!drawingTent;measureMode=false;measureDraft=null;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=!drawingTent;document.getElementById('btnDrawTent').classList.toggle('active',drawingTent);measureNote.hidden=true;measureToolbarChip.hidden=true;render();}
function finishTent(){
  if(tentDraft.length<3){drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;render();return;}
  const center={x:tentDraft.reduce((sum,p)=>sum+p.x,0)/tentDraft.length,y:tentDraft.reduce((sum,p)=>sum+p.y,0)/tentDraft.length},relative=tentDraft.map(p=>({x:p.x-center.x,y:p.y-center.y})),xs=relative.map(p=>p.x),ys=relative.map(p=>p.y),scale=currentScale();
  const item={id:makeId('tent'),type:'tent',shape:'polygon',label:`Toldo ${elements.filter(x=>x.type==='tent').length+1}`,x:center.x,y:center.y,widthM:(Math.max(...xs)-Math.min(...xs))/scale,heightM:(Math.max(...ys)-Math.min(...ys))/scale,rotation:0,color:'#d8c9a6',fillColor:'#d8c9a6',transparency:45,points:relative,locked:false};elements.push(item);drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;document.getElementById('btnDrawTent').classList.remove('active');setSelection([item.id],item.id);commitMutation();
}
function cancelModes(){if(drawingTent){drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;document.getElementById('btnDrawTent').classList.remove('active');}if(measureMode){measureMode=false;measureDraft=null;measureNote.hidden=true;measureToolbarChip.hidden=true;document.getElementById('btnMeasure').classList.remove('active');}render();}

function updateSelected(mutator,{record=true}={}){const item=selected();if(!item||isItemLocked(item))return;mutator(item);if(record)pushHistory();render();saveCurrentProposalSnapshot();}
function liveColor(value){const item=selected();if(!item||isItemLocked(item))return;if(item.type==='tent'){item.fillColor=value;item.color=value;tentFillColor.value=value;}else item.color=value;render();}
function resizeTent(item,nextW,nextH){const oldW=item.widthM||1,oldH=item.heightM||1,sx=nextW/oldW,sy=nextH/oldH;item.points=(item.points||[]).map(p=>({x:p.x*sx,y:p.y*sy}));item.widthM=nextW;item.heightM=nextH;}
selLabel.addEventListener('change',()=>updateSelected(item=>{item.label=selLabel.value.trim()||item.label;}));
selX.addEventListener('change',()=>updateSelected(item=>{item.x=Math.max(20,Number(selX.value||0)*currentScale());}));
selY.addEventListener('change',()=>updateSelected(item=>{item.y=Math.max(20,Number(selY.value||0)*currentScale());}));
selW.addEventListener('change',()=>updateSelected(item=>{const limit=item.type==='tent'||item.type==='dance'?50:5,next=Math.max(.2,Math.min(limit,Number(selW.value)||item.widthM));if(item.type==='tent')resizeTent(item,next,item.heightM);else{item.widthM=next;if(item.type==='table')item.heightM=next;}}));
selH.addEventListener('change',()=>updateSelected(item=>{const limit=item.type==='tent'||item.type==='dance'?50:5,next=Math.max(.2,Math.min(limit,Number(selH.value)||item.heightM));if(item.type==='tent')resizeTent(item,item.widthM,next);else{item.heightM=next;if(item.type==='table')item.widthM=next;}}));
selRot.addEventListener('change',()=>updateSelected(item=>{item.rotation=Math.max(-180,Math.min(180,Number(selRot.value)||0));}));
selColor.addEventListener('input',()=>liveColor(selColor.value));
selColor.addEventListener('change',()=>{pushHistory();saveCurrentProposalSnapshot();});
tentFillColor.addEventListener('input',()=>liveColor(tentFillColor.value));
tentFillColor.addEventListener('change',()=>{pushHistory();saveCurrentProposalSnapshot();});
function setTentTransparency(value,{record=false}={}){const item=selected();if(!item||item.type!=='tent'||isItemLocked(item))return;const next=Math.max(0,Math.min(90,Number(value)||0));item.transparency=next;tentTransparencyRange.value=String(next);tentTransparencyNumber.value=String(next);render();if(record)pushHistory();}
tentTransparencyRange.addEventListener('input',()=>setTentTransparency(tentTransparencyRange.value));tentTransparencyRange.addEventListener('change',()=>setTentTransparency(tentTransparencyRange.value,{record:true}));tentTransparencyNumber.addEventListener('input',()=>setTentTransparency(tentTransparencyNumber.value));tentTransparencyNumber.addEventListener('change',()=>setTentTransparency(tentTransparencyNumber.value,{record:true}));

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>{addElement(button.dataset.add);saveCurrentProposalSnapshot();}));
document.getElementById('btnDrawTent').addEventListener('click',startTent);
document.getElementById('btnDelete').addEventListener('click',()=>{const ids=new Set(selectedIds);if(!ids.size)return;elements=elements.filter(item=>!ids.has(item.id)||isItemLocked(item));clearSelection();commitMutation();});
document.getElementById('btnDuplicate').addEventListener('click',()=>{const items=selectedItems().filter(item=>!isItemLocked(item));if(!items.length)return;const copies=items.map(item=>{const copy=clone(item);copy.id=makeId(item.type);copy.x+=34;copy.y+=34;copy.label=`${item.label} copia`;copy.locked=false;return copy;});elements.push(...copies);setSelection(copies.map(item=>item.id),copies[0].id);commitMutation();});
document.getElementById('btnBringFront').addEventListener('click',()=>{const ids=new Set(selectedIds),chosen=elements.filter(item=>ids.has(item.id)),rest=elements.filter(item=>!ids.has(item.id));elements=[...rest,...chosen];commitMutation();});
document.getElementById('btnSendBack').addEventListener('click',()=>{const ids=new Set(selectedIds),chosen=elements.filter(item=>ids.has(item.id)),rest=elements.filter(item=>!ids.has(item.id));elements=[...chosen,...rest];commitMutation();});
document.getElementById('btnToggleLock').addEventListener('click',()=>{const items=selectedItems();if(!items.length)return;const next=!items.every(item=>item.locked);items.forEach(item=>item.locked=next);commitMutation();});
document.getElementById('btnAlignNow').addEventListener('click',()=>{const items=selectedItems();if(items.length<2)return;const base=selected()||items[0];items.forEach(item=>{if(item.id!==base.id&&!isItemLocked(item))item.y=base.y;});commitMutation();});
document.getElementById('btnCenter').addEventListener('click',()=>updateSelected(item=>{item.x=724;item.y=543;}));
document.getElementById('btnRotateLeft').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)-15;}));
document.getElementById('btnRotateRight').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)+15;}));
document.getElementById('btnClearSeats').addEventListener('click',()=>{const item=selected();if(!item||item.type!=='table'||isItemLocked(item))return;ensureTableSeats(item);item.seats=item.seats.map(()=>null);commitMutation();});

function addGuestNames(names){const clean=names.map(name=>String(name||'').trim()).filter(Boolean);if(!clean.length)return;clean.forEach(name=>guests.push({id:`guest-${guestUid++}`,name}));commitMutation();}
document.getElementById('btnAddGuest').addEventListener('click',()=>{addGuestNames([newGuestName.value]);newGuestName.value='';newGuestName.focus();});
newGuestName.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();document.getElementById('btnAddGuest').click();}});
document.getElementById('btnAddBulkGuests').addEventListener('click',()=>{addGuestNames(bulkGuests.value.split(/\r?\n|,/));bulkGuests.value='';});guestSearch.addEventListener('input',renderGuestManager);
document.getElementById('btnAssignSequential').addEventListener('click',()=>{elements.filter(item=>item.type==='table').forEach(table=>{ensureTableSeats(table);table.seats=table.seats.map(()=>null);});let index=0;for(const table of elements.filter(item=>item.type==='table'))for(let seat=0;seat<table.capacity&&index<guests.length;seat++,index++)table.seats[seat]=guests[index].id;commitMutation();});
document.getElementById('btnClearAssignments').addEventListener('click',()=>{elements.filter(item=>item.type==='table').forEach(table=>{ensureTableSeats(table);table.seats=table.seats.map(()=>null);});commitMutation();});

[showGrid,showClearance,showLabels,showNames].forEach(control=>{control.addEventListener('change',()=>{pushHistory();render();});});
document.getElementById('toggleBg').addEventListener('click',event=>{bgVisible=!bgVisible;event.currentTarget.textContent=bgVisible?'Ocultar plano':'Mostrar plano';pushHistory();render();});
document.getElementById('btnDefaultView').addEventListener('click',()=>{scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;bgVisible=true;document.getElementById('toggleBg').textContent='Ocultar plano';pushHistory();render();});
document.getElementById('btnShowAllLayers').addEventListener('click',()=>{Object.keys(hiddenLayers).forEach(type=>hiddenLayers[type]=false);pushHistory();render();});
document.getElementById('btnUnlockAllLayers').addEventListener('click',()=>{Object.keys(lockedLayers).forEach(type=>lockedLayers[type]=false);elements.forEach(item=>item.locked=false);pushHistory();render();});

document.getElementById('btnMeasure').addEventListener('click',toggleMeasureMode);document.getElementById('btnClearMeasures').addEventListener('click',()=>{measurements=[];measureDraft=null;pushHistory();render();});
function setZoom(next){zoom=Math.max(.65,Math.min(1.8,next));planner.style.width=`${zoom*100}%`;document.getElementById('zoomReset').textContent=`${Math.round(zoom*100)}%`;}
document.getElementById('btnZoomOut').addEventListener('click',()=>setZoom(zoom-.1));document.getElementById('btnZoomIn').addEventListener('click',()=>setZoom(zoom+.1));document.getElementById('zoomReset').addEventListener('click',()=>setZoom(1));document.getElementById('btnFit').addEventListener('click',()=>setZoom(1));
document.getElementById('btnTextSmaller').addEventListener('click',()=>setUiFontScale(uiFontScale-UI_FONT_STEP));
document.getElementById('btnTextLarger').addEventListener('click',()=>setUiFontScale(uiFontScale+UI_FONT_STEP));
document.getElementById('textSizeReset').addEventListener('click',()=>setUiFontScale(1.10));
document.getElementById('btnUndo').addEventListener('click',undoHistory);document.getElementById('btnRedo').addEventListener('click',redoHistory);
document.getElementById('btnPresentation').addEventListener('click',()=>{presentationMount.innerHTML='';const cloneSvg=planner.cloneNode(true);cloneSvg.style.width='100%';presentationMount.appendChild(cloneSvg);presentationOverlay.hidden=false;});document.getElementById('closePresentation').addEventListener('click',()=>presentationOverlay.hidden=true);

function copySelectedPlannerItems(){const items=selectedItems();if(!items.length)return false;copiedPlannerItems=clone(items);pasteSequence=0;return true;}
function pastePlannerItems(){if(!copiedPlannerItems.length)return false;pasteSequence++;const copies=copiedPlannerItems.map(item=>{const copy=clone(item);copy.id=makeId(item.type);copy.x+=28*pasteSequence;copy.y+=28*pasteSequence;copy.locked=false;copy.label=`${item.label} copia`;return copy;});elements.push(...copies);setSelection(copies.map(item=>item.id),copies[0].id);commitMutation();return true;}

document.addEventListener('keydown',event=>{
  const tag=(document.activeElement?.tagName||'').toLowerCase(),editing=['input','select','textarea'].includes(tag);
  if(event.key==='Escape'){cancelModes();return;}if(drawingTent&&event.key==='Enter'){event.preventDefault();finishTent();return;}
  if(editing)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.shiftKey){event.preventDefault();undoHistory();return;}
  if((event.ctrlKey||event.metaKey)&&((event.key.toLowerCase()==='y')||(event.key.toLowerCase()==='z'&&event.shiftKey))){event.preventDefault();redoHistory();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'){if(copySelectedPlannerItems())event.preventDefault();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='v'){if(pastePlannerItems())event.preventDefault();return;}
  if((event.key==='Delete'||event.key==='Backspace')&&selectedIds.length){event.preventDefault();document.getElementById('btnDelete').click();}
});

function proposalSnapshot(){return stateSnapshot();}
function saveCurrentProposalSnapshot(){const proposal=proposals.find(item=>item.id===currentProposalId);if(proposal)proposal.state=clone(proposalSnapshot());}
function switchProposal(id){saveCurrentProposalSnapshot();const proposal=proposals.find(item=>item.id===id);if(!proposal)return;currentProposalId=id;proposalNameTop.textContent=proposal.name;proposalNameCanvas.textContent=`${proposal.name} · laboratorio`;historyPast=[];historyFuture=[];restoreState(clone(proposal.state));pushHistory();renderProposalList();}
function createProposal(name='Nueva propuesta',copyCurrent=false){saveCurrentProposalSnapshot();const state=copyCurrent?proposalSnapshot():blankState();const proposal={id:makeId('proposal'),name,state:clone(state)};proposals.push(proposal);switchProposal(proposal.id);}
function blankState(){const old=stateSnapshot();return{...old,elements:[],selectedIds:[],selectedId:'',measurements:[],hiddenLayers:{},lockedLayers:{}};}
function renderProposalList(){proposalList.replaceChildren();proposals.forEach(proposal=>{const row=document.createElement('div');row.className=`proposal-row${proposal.id===currentProposalId?' active':''}`;const info=document.createElement('button');info.type='button';info.className='proposal-open';const strong=document.createElement('strong');strong.textContent=proposal.name;const small=document.createElement('small');small.textContent=proposal.id===currentProposalId?'Actual':'Abrir propuesta';info.append(strong,small);info.addEventListener('click',()=>switchProposal(proposal.id));const rename=document.createElement('button');rename.type='button';rename.textContent='✎';rename.title='Renombrar';rename.addEventListener('click',()=>{const next=prompt('Nombre de la propuesta',proposal.name);if(next?.trim()){proposal.name=next.trim();if(proposal.id===currentProposalId){proposalNameTop.textContent=proposal.name;proposalNameCanvas.textContent=`${proposal.name} · laboratorio`;}renderProposalList();}});const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Eliminar';remove.disabled=proposals.length===1;remove.addEventListener('click',()=>{if(proposals.length===1)return;const index=proposals.findIndex(item=>item.id===proposal.id);proposals.splice(index,1);if(currentProposalId===proposal.id)switchProposal(proposals[Math.max(0,index-1)].id);else renderProposalList();});row.append(info,rename,remove);proposalList.appendChild(row);});}
document.getElementById('btnProposals').addEventListener('click',()=>{renderProposalList();proposalModal.hidden=false;});document.getElementById('closeProposalModal').addEventListener('click',()=>proposalModal.hidden=true);document.getElementById('btnNewProposal').addEventListener('click',()=>createProposal(`Propuesta ${proposals.length+1}`));document.getElementById('btnDuplicateProposal').addEventListener('click',()=>createProposal(`${proposals.find(item=>item.id===currentProposalId)?.name||'Propuesta'} copia`,true));proposalModal.addEventListener('click',event=>{if(event.target===proposalModal)proposalModal.hidden=true;});

function initialState(){
  seedGuests();elements=[];const table=addElement('table',{record:false,assignGuests:true});table.x=724;table.y=543;setSelection([table.id],table.id);hiddenLayers={};lockedLayers={};measurements=[];measurementUid=1;scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;bgVisible=true;bgPosition={x:0,y:0};zoom=1;setZoom(1);historyPast=[];historyFuture=[];pushHistory();render();
}
function resetCurrent(){initialState();saveCurrentProposalSnapshot();}
document.getElementById('resetLab').addEventListener('click',resetCurrent);

initialState();
proposals=[{id:makeId('proposal'),name:'Propuesta principal',state:clone(proposalSnapshot())}];currentProposalId=proposals[0].id;proposalNameTop.textContent=proposals[0].name;proposalNameCanvas.textContent=`${proposals[0].name} · laboratorio`;renderProposalList();saveCurrentProposalSnapshot();


/* ===== pruebas/distribucion/phase2-p0.js ===== */
(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const CENTER_X = 724;
  const CENTER_Y = 543;
  const OLD_W = 1200;
  const OLD_H = 760;
  const TABLETOP_RADIUS_M = 0.915;
  const CHAIR_ORBIT_FACTOR = 1.33;
  const LABEL_ORBIT_FACTOR = 2.18;
  const TABLE_CLEARANCE_MARGIN_M = 0.60;
  const RECT_SAT_TOLERANCE_PX = 3;

  document.documentElement.dataset.phase2P0 = 'true';

  function resizePlannerSurface() {
    planner.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);
    const floor = planner.querySelector('.floor');
    [floor, bgImage, gridLayer].filter(Boolean).forEach((node) => {
      node.setAttribute('width', String(CANVAS_W));
      node.setAttribute('height', String(CANVAS_H));
    });
  }

  function rebasePoint(point) {
    if (!point) return;
    point.x = Number(point.x || 0) * CANVAS_W / OLD_W;
    point.y = Number(point.y || 0) * CANVAS_H / OLD_H;
  }

  function rebaseState(state) {
    if (!state || state.__phase2P0Canvas === true) return;
    (state.elements || []).forEach((item) => rebasePoint(item));
    (state.measurements || []).forEach((measure) => {
      rebasePoint(measure.a);
      rebasePoint(measure.b);
    });
    state.__phase2P0Canvas = true;
  }

  function rebaseCurrentSession() {
    if (planner.dataset.phase2P0Rebased === 'true') return;
    planner.dataset.phase2P0Rebased = 'true';
    elements.forEach((item) => rebasePoint(item));
    measurements.forEach((measure) => {
      rebasePoint(measure.a);
      rebasePoint(measure.b);
    });
    proposals.forEach((proposal) => rebaseState(proposal.state));
  }

  nextPosition = function phase2NextPosition(index) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: (310 + column * 265) * CANVAS_W / OLD_W,
      y: (230 + (row % 3) * 220) * CANVAS_H / OLD_H
    };
  };

  initialState = function phase2InitialState() {
    seedGuests();
    elements = [];
    const table = addElement('table', { record: false, assignGuests: false });
    table.x = CENTER_X;
    table.y = CENTER_Y;
    setSelection([table.id], table.id);
    hiddenLayers = {};
    lockedLayers = {};
    measurements = [];
    measurementUid = 1;
    scaleInput.value = 32;
    showGrid.checked = true;
    showClearance.checked = true;
    showLabels.checked = true;
    showNames.checked = true;
    bgVisible = true;
    bgPosition = { x: 0, y: 0 };
    zoom = 1;
    setZoom(1);
    historyPast = [];
    historyFuture = [];
    pushHistory();
    render();
  };

  applySmartGuides = function phase2ApplySmartGuides(targetX, targetY, ignoreIds = []) {
    const ignore = new Set(ignoreIds);
    const threshold = 9;
    let nextX = targetX;
    let nextY = targetY;
    guideLines = { vertical: null, horizontal: null };

    const visible = getVisibleElements().filter((item) => !ignore.has(item.id));
    const xCandidates = [CENTER_X, ...visible.map((item) => item.x)];
    const yCandidates = [CENTER_Y, ...visible.map((item) => item.y)];
    let bestX = null;
    let bestY = null;

    xCandidates.forEach((value) => {
      const diff = Math.abs(targetX - value);
      if (diff <= threshold && (!bestX || diff < bestX.diff)) bestX = { value, diff };
    });
    yCandidates.forEach((value) => {
      const diff = Math.abs(targetY - value);
      if (diff <= threshold && (!bestY || diff < bestY.diff)) bestY = { value, diff };
    });

    if (bestX) {
      nextX = bestX.value;
      guideLines.vertical = bestX.value;
    }
    if (bestY) {
      nextY = bestY.value;
      guideLines.horizontal = bestY.value;
    }
    return { x: nextX, y: nextY };
  };

  renderGuideLayer = function phase2RenderGuideLayer() {
    guideLayer.replaceChildren();
    if (guideLines.vertical !== null) {
      guideLayer.appendChild(svgEl('line', {
        x1: guideLines.vertical,
        x2: guideLines.vertical,
        y1: 0,
        y2: CANVAS_H,
        class: 'guide-line'
      }));
    }
    if (guideLines.horizontal !== null) {
      guideLayer.appendChild(svgEl('line', {
        x1: 0,
        x2: CANVAS_W,
        y1: guideLines.horizontal,
        y2: guideLines.horizontal,
        class: 'guide-line'
      }));
    }
  };

  function phase2GuestAnchor(worldAngle) {
    const c = Math.cos(worldAngle);
    if (c > 0.28) return 'start';
    if (c < -0.28) return 'end';
    return 'middle';
  }

  function phase2GuestLabel(group, guestName, seatNumber, angle, tableRadius, parentRotation) {
    if (!showNames.checked || !guestName) return;
    const labelOrbit = tableRadius * LABEL_ORBIT_FACTOR;
    const x = Math.cos(angle) * labelOrbit;
    const y = Math.sin(angle) * labelOrbit;
    const worldAngle = angle + (Number(parentRotation) || 0) * Math.PI / 180;
    const anchor = phase2GuestAnchor(worldAngle);
    const label = compactName(guestName, 18);
    const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;

    const wrapper = svgEl('g', {
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${-(Number(parentRotation) || 0)})`,
      class: 'guest-tag',
      'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: dx,
      y: 3,
      'text-anchor': anchor,
      'font-size': 9.5,
      'font-weight': 800,
      fill: '#2d2924',
      stroke: '#ffffff',
      'stroke-width': 4,
      'paint-order': 'stroke'
    });
    text.textContent = label;
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  renderTable = function phase2RenderTable(item, scale, conflicts) {
    ensureTableSeats(item);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const clearanceRadius = item.widthM * scale / 2;
    const tableRadius = TABLETOP_RADIUS_M * scale;
    const chairRadius = Math.max(7, tableRadius * 0.12);
    const chairOrbit = tableRadius * CHAIR_ORBIT_FACTOR;
    const stroke = danger ? '#c84242' : selectedState ? '#d59b3c' : item.color;
    const strokeW = danger || selectedState ? 5 : 2;

    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id
    });

    group.appendChild(svgEl('circle', {
      r: clearanceRadius,
      fill: item.color,
      'fill-opacity': 0.16,
      stroke,
      'stroke-width': strokeW,
      'stroke-dasharray': showClearance.checked ? '9 7' : '0',
      class: 'clearance'
    }));

    for (let index = 0; index < 10; index++) {
      const angle = Math.PI * 2 * index / 10 - Math.PI / 2;
      const chairX = Math.cos(angle) * chairOrbit;
      const chairY = Math.sin(angle) * chairOrbit;
      if (showClearance.checked) {
        const chair = svgEl('g', {
          transform: `translate(${chairX.toFixed(1)} ${chairY.toFixed(1)})`,
          class: 'chair-wrap'
        });
        chair.appendChild(svgEl('circle', {
          r: chairRadius.toFixed(2),
          class: 'chair',
          fill: '#fffdf9',
          stroke: '#6d655a',
          'stroke-width': 1.5
        }));
        const number = svgEl('text', {
          x: 0,
          y: 3.2,
          'text-anchor': 'middle',
          'font-size': Math.max(7, chairRadius * 0.88).toFixed(1),
          'font-weight': 800,
          fill: '#5b554d',
          'pointer-events': 'none'
        });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) phase2GuestLabel(group, guest.name, index + 1, angle, tableRadius, item.rotation || 0);
    }

    group.appendChild(svgEl('circle', {
      r: tableRadius,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? '#c84242' : '#755e43',
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('circle', {
      r: tableRadius * 0.55,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2,
      'pointer-events': 'none'
    }));

    if (showLabels.checked) {
      const title = svgEl('text', {
        x: 0,
        y: -3,
        'text-anchor': 'middle',
        class: 'table-title',
        'font-size': 18,
        'font-weight': 800,
        fill: '#342a20'
      });
      title.textContent = item.label;
      group.appendChild(title);
      const meta = svgEl('text', {
        x: 0,
        y: 15,
        'text-anchor': 'middle',
        class: 'table-meta'
      });
      meta.textContent = `${item.capacity || 10} personas`;
      group.appendChild(meta);
    }

    appendRotateHandle(group, item);
    return group;
  };

  function axesForPhase2(poly) {
    return poly.map((point, index) => {
      const next = poly[(index + 1) % poly.length];
      const edgeX = next.x - point.x;
      const edgeY = next.y - point.y;
      const length = Math.hypot(edgeX, edgeY) || 1;
      return { x: -edgeY / length, y: edgeX / length };
    });
  }

  function projectPhase2(poly, axis) {
    const values = poly.map((point) => point.x * axis.x + point.y * axis.y);
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  polygonIntersectsPolygon = function phase2PolygonIntersectsPolygon(a, b) {
    for (const axis of [...axesForPhase2(a), ...axesForPhase2(b)]) {
      const A = projectPhase2(a, axis);
      const B = projectPhase2(b, axis);
      if (A.max <= B.min + RECT_SAT_TOLERANCE_PX || B.max <= A.min + RECT_SAT_TOLERANCE_PX) return false;
    }
    return true;
  };

  function ensureRiskStatus() {
    let node = document.getElementById('phase2RiskStatus');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'phase2RiskStatus';
    node.className = 'phase2-risk-status';
    validationBox.before(node);
    return node;
  }

  renderValidation = function phase2RenderValidation() {
    const conflicts = conflictIds();
    const status = ensureRiskStatus();
    if (conflicts.size) {
      status.className = 'phase2-risk-status bad';
      status.innerHTML = `<strong>Revisar distribución</strong><span>${conflicts.size} elemento(s) invaden áreas funcionales. Muévelos hasta que dejen de aparecer en rojo.</span>`;
    } else {
      status.className = 'phase2-risk-status good';
      status.innerHTML = '<strong>Distribución sin superposiciones</strong><span>No se detectan invasiones entre áreas funcionales visibles.</span>';
    }
    validationBox.innerHTML = validationMessages(conflicts)
      .map((msg) => `<div class="validation-item ${msg.type}">${msg.text}</div>`)
      .join('');
  };

  const originalValidationMessages = validationMessages;
  validationMessages = function phase2ValidationMessages(conflicts = conflictIds()) {
    const messages = originalValidationMessages(conflicts).filter((message) => !/menos de 60 cm libres/.test(message.text));
    const tableItems = getVisibleElements().filter((item) => item.type === 'table');
    let closeTables = 0;
    for (let i = 0; i < tableItems.length; i++) {
      for (let j = i + 1; j < tableItems.length; j++) {
        const A = tableItems[i];
        const B = tableItems[j];
        const minimumCenterDistance = (((A.widthM + B.widthM) / 2) + TABLE_CLEARANCE_MARGIN_M) * currentScale();
        const actualCenterDistance = Math.hypot(A.x - B.x, A.y - B.y);
        if (actualCenterDistance < minimumCenterDistance && actualCenterDistance > 5) closeTables++;
      }
    }
    if (closeTables) {
      messages.push({
        type: 'warn',
        text: `Se detectaron ${closeTables} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.`
      });
    }
    return messages;
  };

  const centerButton = document.getElementById('btnCenter');
  centerButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    updateSelected((item) => {
      item.x = CENTER_X;
      item.y = CENTER_Y;
    });
  }, true);

  resizePlannerSurface();
  // app.js ya creó un estado antes de que P0 se cargue. Reinicializamos aquí
  // para que el contrato real de P0 (mesa vacía y capacidades 4–16 libres)
  // sea el que llegue al usuario, no el seed heredado de 10 invitados.
  initialState();

  window.MiGranDiaDistributionPhase2P0 = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H, centerX: CENTER_X, centerY: CENTER_Y },
    table: {
      tabletopRadiusM: TABLETOP_RADIUS_M,
      clearanceDiameterM: 3.4,
      chairOrbitFactor: CHAIR_ORBIT_FACTOR,
      labelOrbitFactor: LABEL_ORBIT_FACTOR,
      clearanceMarginM: TABLE_CLEARANCE_MARGIN_M
    },
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p1.js ===== */
(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const ROTATION_STEP = 15;
  const KEYBOARD_STEP = 1;
  const KEYBOARD_FAST_STEP = 10;

  if (document.documentElement.dataset.phase2P1 === 'ready') return;
  document.documentElement.dataset.phase2P1 = 'ready';

  let p1Drag = null;

  const isEditing = () => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    return ['input', 'select', 'textarea'].includes(tag) || Boolean(document.activeElement?.isContentEditable);
  };

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, value));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, value));
  const normalizeRotation = (value) => {
    let next = Number(value) || 0;
    while (next > 180) next -= 360;
    while (next <= -180) next += 360;
    return next;
  };
  const snapRotation = (value) => Math.round(value / ROTATION_STEP) * ROTATION_STEP;

  function pointerTargetItem(event) {
    if (event.target?.closest?.('.tent-vertex')) return null;
    const node = event.target?.closest?.('[data-id]');
    if (!node) return null;
    return getItem(node.getAttribute('data-id'));
  }

  function pointerRotateItem(event) {
    const node = event.target?.closest?.('[data-rotate-id]');
    if (!node) return null;
    return getItem(node.getAttribute('data-rotate-id'));
  }

  function movableSelection(primary) {
    const selection = isSelected(primary.id) ? selectedItems() : [primary];
    return selection.filter((item) => !isItemLocked(item));
  }

  function updateSelectionChipP1() {
    if (!multiToolbarChip) return;
    const count = selectedIds.length;
    if (count > 1) {
      const locked = selectedItems().filter(isItemLocked).length;
      multiToolbarChip.hidden = false;
      multiToolbarChip.textContent = locked
        ? `${count} elementos seleccionados · ${locked} bloqueado(s)`
        : `${count} elementos seleccionados`;
    } else {
      multiToolbarChip.hidden = true;
      multiToolbarChip.textContent = '';
    }
  }

  function renderP1() {
    render();
    updateSelectionChipP1();
  }

  function beginRotate(event, item) {
    if (!item || isItemLocked(item) || measureMode || drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();

    setSelection(isSelected(item.id) ? selectedIds : [item.id], item.id);
    const point = svgPoint(event);
    p1Drag = {
      mode: 'rotate',
      pointerId: event.pointerId,
      id: item.id,
      startAngle: Math.atan2(point.y - item.y, point.x - item.x),
      startRotation: Number(item.rotation) || 0,
      moved: false
    };
    try { planner.setPointerCapture(event.pointerId); } catch (_) {}
    renderP1();
    return true;
  }

  function beginMove(event, item) {
    if (!item || measureMode || drawingTent) return false;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (isSelected(item.id)) {
        const remaining = selectedIds.filter((id) => id !== item.id);
        setSelection(remaining, remaining[0] || '');
      } else {
        setSelection([...selectedIds, item.id], item.id);
      }
      renderP1();
      return true;
    }

    if (isItemLocked(item)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSelection([item.id], item.id);
      renderP1();
      return true;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (!isSelected(item.id)) setSelection([item.id], item.id);
    else selectedId = item.id;

    const point = svgPoint(event);
    const group = movableSelection(item).map((entry) => ({
      id: entry.id,
      startX: entry.x,
      startY: entry.y
    }));
    p1Drag = {
      mode: 'move',
      pointerId: event.pointerId,
      id: item.id,
      dx: point.x - item.x,
      dy: point.y - item.y,
      originX: item.x,
      originY: item.y,
      group,
      moved: false
    };
    try { planner.setPointerCapture(event.pointerId); } catch (_) {}
    renderP1();
    return true;
  }

  function onPointerDown(event) {
    if (event.target === bgImage) return;
    if (event.target?.closest?.('.tent-vertex')) return;
    const rotateItem = pointerRotateItem(event);
    if (rotateItem && beginRotate(event, rotateItem)) return;

    const item = pointerTargetItem(event);
    if (item && beginMove(event, item)) return;

    if (!measureMode && !drawingTent) return;
  }

  function onPointerMove(event) {
    const point = svgPoint(event);
    const scale = currentScale();
    if (cursorCoords) cursorCoords.textContent = `x ${(point.x / scale).toFixed(2)} m · y ${(point.y / scale).toFixed(2)} m`;

    if (!p1Drag || event.pointerId !== p1Drag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const item = getItem(p1Drag.id);
    if (!item || isItemLocked(item)) return;

    if (p1Drag.mode === 'rotate') {
      const currentAngle = Math.atan2(point.y - item.y, point.x - item.x);
      let rotation = p1Drag.startRotation + (currentAngle - p1Drag.startAngle) * 180 / Math.PI;
      if (event.shiftKey) rotation = snapRotation(rotation);
      item.rotation = normalizeRotation(rotation);
      p1Drag.moved = true;
      renderP1();
      return;
    }

    const intendedX = clampX(point.x - p1Drag.dx);
    const intendedY = clampY(point.y - p1Drag.dy);
    const snapped = applySmartGuides(intendedX, intendedY, p1Drag.group.map((entry) => entry.id));
    const shiftX = snapped.x - p1Drag.originX;
    const shiftY = snapped.y - p1Drag.originY;

    p1Drag.group.forEach((entry) => {
      const current = getItem(entry.id);
      if (!current || isItemLocked(current)) return;
      current.x = clampX(entry.startX + shiftX);
      current.y = clampY(entry.startY + shiftY);
    });
    p1Drag.moved = true;
    renderP1();
  }

  function endPointerInteraction(event) {
    if (!p1Drag || event.pointerId !== p1Drag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { planner.releasePointerCapture(event.pointerId); } catch (_) {}
    const moved = p1Drag.moved;
    p1Drag = null;
    guideLines = { vertical: null, horizontal: null };
    if (moved) {
      pushHistory();
      saveCurrentProposalSnapshot();
    }
    renderP1();
  }

  function moveSelectedByKeyboard(dx, dy) {
    const targets = selectedItems().filter((item) => !isItemLocked(item));
    if (!targets.length) return false;
    targets.forEach((item) => {
      item.x = clampX(item.x + dx);
      item.y = clampY(item.y + dy);
    });
    pushHistory();
    renderP1();
    saveCurrentProposalSnapshot();
    return true;
  }

  function rotateSelectedByKeyboard(delta) {
    const targets = selectedItems().filter((item) => !isItemLocked(item));
    if (!targets.length) return false;
    targets.forEach((item) => {
      item.rotation = normalizeRotation((Number(item.rotation) || 0) + delta);
    });
    pushHistory();
    renderP1();
    saveCurrentProposalSnapshot();
    return true;
  }

  function onKeyDown(event) {
    if (isEditing() || measureMode || drawingTent) return;
    const step = event.shiftKey ? KEYBOARD_FAST_STEP : KEYBOARD_STEP;
    let handled = false;

    if (event.key === 'ArrowUp') handled = moveSelectedByKeyboard(0, -step);
    else if (event.key === 'ArrowDown') handled = moveSelectedByKeyboard(0, step);
    else if (event.key === 'ArrowLeft') handled = moveSelectedByKeyboard(-step, 0);
    else if (event.key === 'ArrowRight') handled = moveSelectedByKeyboard(step, 0);
    else if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'r') {
      handled = rotateSelectedByKeyboard(event.shiftKey ? -ROTATION_STEP : ROTATION_STEP);
    }

    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function reinforceLockButton() {
    const button = document.getElementById('btnToggleLock');
    if (!button || button.dataset.phase2P1Lock === 'ready') return;
    button.dataset.phase2P1Lock = 'ready';
    button.addEventListener('click', () => {
      queueMicrotask(updateSelectionChipP1);
    });
  }

  planner.addEventListener('pointerdown', onPointerDown, true);
  planner.addEventListener('pointermove', onPointerMove, true);
  planner.addEventListener('pointerup', endPointerInteraction, true);
  planner.addEventListener('pointercancel', endPointerInteraction, true);
  document.addEventListener('keydown', onKeyDown, true);
  reinforceLockButton();
  updateSelectionChipP1();

  window.MiGranDiaDistributionPhase2P1 = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H },
    interaction: {
      ctrlMetaMultiSelect: true,
      groupDrag: true,
      rotationHandle: true,
      shiftRotationSnapDeg: ROTATION_STEP,
      keyboardMovePx: KEYBOARD_STEP,
      keyboardFastMovePx: KEYBOARD_FAST_STEP,
      keyboardRotateDeg: ROTATION_STEP,
      lockedItemsIgnorePointerMove: true,
      lockedItemsIgnoreKeyboardMove: true,
      tentVertexReservedForSpatialEditor: true
    },
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p1-editor.js ===== */
(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const HISTORY_LIMIT = 80;
  const PASTE_OFFSET = 28;
  const DUPLICATE_OFFSET = 35;

  document.documentElement.dataset.phase2P1Editor = 'true';

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, Number(value) || 0));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, Number(value) || 0));

  function unlockedSelectedItems() {
    return selectedItems().filter((item) => !isItemLocked(item));
  }

  function hasUnlockedSelection() {
    return unlockedSelectedItems().length > 0;
  }

  function commitWhenChanged(changed) {
    if (!changed) return false;
    commitMutation();
    return true;
  }

  pushHistory = function phase2P1PushHistory() {
    if (restoringHistory) return;
    const raw = JSON.stringify(stateSnapshot());
    if (historyPast.at(-1) === raw) return;
    historyPast.push(raw);
    if (historyPast.length > HISTORY_LIMIT) historyPast.shift();
    historyFuture = [];
    updateHistoryButtons();
  };

  function bringUnlockedSelectionFront() {
    const chosen = unlockedSelectedItems();
    if (!chosen.length) return false;
    const ids = new Set(chosen.map((item) => item.id));
    const rest = elements.filter((item) => !ids.has(item.id));
    elements = [...rest, ...chosen];
    return commitWhenChanged(true);
  }

  function sendUnlockedSelectionBack() {
    const chosen = unlockedSelectedItems();
    if (!chosen.length) return false;
    const ids = new Set(chosen.map((item) => item.id));
    const rest = elements.filter((item) => !ids.has(item.id));
    elements = [...chosen, ...rest];
    return commitWhenChanged(true);
  }

  function alignUnlockedSelection() {
    const items = selectedItems();
    if (items.length < 2) return false;
    const base = getItem(selectedId) || items[0];
    if (!base) return false;
    let changed = false;
    items.forEach((item) => {
      if (item.id === base.id || isItemLocked(item)) return;
      if (item.y !== base.y) {
        item.y = base.y;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  function clonePlannerItem(item) {
    const copy = clone(item);
    if (item.type === 'tent' && Array.isArray(item.points)) {
      copy.points = item.points.map((point) => ({ ...point }));
    }
    return copy;
  }

  function clearCopiedTableSeats(copy) {
    if (copy.type !== 'table') return;
    const capacity = Math.max(1, Number(copy.capacity) || 10);
    copy.seats = Array.from({ length: capacity }, () => null);
  }

  function duplicatePrimarySelection() {
    const item = selected();
    if (!item || isItemLocked(item)) return false;
    const copy = clonePlannerItem(item);
    copy.id = makeId(item.type);
    copy.x = clampX((Number(item.x) || 0) + DUPLICATE_OFFSET);
    copy.y = clampY((Number(item.y) || 0) + DUPLICATE_OFFSET);
    copy.label = `${item.label} copia`;
    copy.locked = false;
    clearCopiedTableSeats(copy);
    elements.push(copy);
    setSelection([copy.id], copy.id);
    commitMutation();
    return true;
  }

  copySelectedPlannerItems = function phase2P1CopySelectedPlannerItems() {
    const items = selectedItems();
    if (!items.length) return false;
    copiedPlannerItems = items.map(clonePlannerItem);
    pasteSequence = 0;
    return true;
  };

  pastePlannerItems = function phase2P1PastePlannerItems() {
    if (!copiedPlannerItems.length) return false;
    pasteSequence += 1;
    const offset = PASTE_OFFSET * pasteSequence;
    const copies = copiedPlannerItems.map((sourceItem) => {
      const copy = clonePlannerItem(sourceItem);
      copy.id = makeId(sourceItem.type);
      copy.label = `${sourceItem.label} copia`;
      copy.x = clampX((Number(sourceItem.x) || 0) + offset);
      copy.y = clampY((Number(sourceItem.y) || 0) + offset);
      copy.locked = false;
      clearCopiedTableSeats(copy);
      if (copy.type === 'tent') hiddenLayers.tent = false;
      return copy;
    });
    elements.push(...copies);
    setSelection(copies.map((item) => item.id), copies[0]?.id || '');
    commitMutation();
    return true;
  };

  function deleteUnlockedSelection() {
    const unlocked = unlockedSelectedItems();
    if (!unlocked.length) return false;
    const ids = new Set(unlocked.map((item) => item.id));
    elements = elements.filter((item) => !ids.has(item.id));
    const survivors = selectedIds.filter((id) => getItem(id));
    setSelection(survivors, survivors.includes(selectedId) ? selectedId : (survivors[0] || ''));
    commitMutation();
    return true;
  }

  renderLayerList = function phase2P1RenderLayerList() {
    layerList.replaceChildren();
    const types = Object.keys(LAYERS).filter((type) => elements.some((item) => item.type === type));
    if (!types.length) {
      const empty = document.createElement('div');
      empty.className = 'validation-item';
      empty.textContent = 'Todavía no hay elementos en el plano.';
      layerList.appendChild(empty);
      return;
    }

    types.forEach((type) => {
      const row = document.createElement('div');
      row.className = 'layer-row';

      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'layer-eye';
      eye.textContent = hiddenLayers[type] ? '○' : '●';
      eye.title = hiddenLayers[type] ? 'Mostrar capa' : 'Ocultar capa';
      eye.dataset.layerAction = 'toggle-visibility';
      eye.dataset.layerType = type;
      eye.addEventListener('click', () => {
        hiddenLayers[type] = !hiddenLayers[type];
        if (hiddenLayers[type]) {
          const remaining = selectedIds.filter((id) => getItem(id)?.type !== type);
          const primary = selectedId && getItem(selectedId)?.type !== type ? selectedId : (remaining[0] || '');
          setSelection(remaining, primary);
        }
        commitMutation();
      });

      const text = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = LAYERS[type];
      const small = document.createElement('small');
      const count = elements.filter((item) => item.type === type).length;
      small.textContent = `${count} elemento(s)`;
      text.append(strong, small);

      const lock = document.createElement('button');
      lock.type = 'button';
      lock.className = 'layer-lock';
      lock.textContent = lockedLayers[type] ? '🔒' : '🔓';
      lock.title = lockedLayers[type] ? 'Desbloquear capa' : 'Bloquear capa';
      lock.dataset.layerAction = 'toggle-lock';
      lock.dataset.layerType = type;
      lock.addEventListener('click', () => {
        lockedLayers[type] = !lockedLayers[type];
        commitMutation();
      });

      row.append(eye, text, lock);
      layerList.appendChild(row);
    });
  };

  function showAllLayers() {
    let changed = false;
    Object.keys(LAYERS).forEach((type) => {
      if (hiddenLayers[type]) {
        hiddenLayers[type] = false;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  function unlockEverything() {
    let changed = false;
    Object.keys(LAYERS).forEach((type) => {
      if (lockedLayers[type]) {
        lockedLayers[type] = false;
        changed = true;
      }
    });
    elements.forEach((item) => {
      if (item.locked) {
        item.locked = false;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  const originalRenderInspector = typeof renderInspector === 'function' ? renderInspector : null;
  if (originalRenderInspector) {
    renderInspector = function phase2P1RenderInspector() {
      originalRenderInspector();
      const items = selectedItems();
      const primary = selected();
      const unlocked = items.filter((item) => !isItemLocked(item));
      const base = getItem(selectedId) || items[0] || null;
      const alignable = Boolean(base && items.some((item) => item.id !== base.id && !isItemLocked(item)));

      const deleteButton = document.getElementById('btnDelete');
      const duplicateButton = document.getElementById('btnDuplicate');
      const frontButton = document.getElementById('btnBringFront');
      const backButton = document.getElementById('btnSendBack');
      const alignButton = document.getElementById('btnAlignNow');

      if (deleteButton) deleteButton.disabled = unlocked.length === 0;
      if (duplicateButton) duplicateButton.disabled = !primary || isItemLocked(primary);
      if (frontButton) frontButton.disabled = unlocked.length === 0;
      if (backButton) backButton.disabled = unlocked.length === 0;
      if (alignButton) alignButton.disabled = items.length < 2 || !alignable;
    };
  }

  function captureButton(id, handler) {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler();
    }, true);
  }

  captureButton('btnBringFront', bringUnlockedSelectionFront);
  captureButton('btnSendBack', sendUnlockedSelectionBack);
  captureButton('btnAlignNow', alignUnlockedSelection);
  captureButton('btnDuplicate', duplicatePrimarySelection);
  captureButton('btnDelete', deleteUnlockedSelection);
  captureButton('btnShowAllLayers', showAllLayers);
  captureButton('btnUnlockAllLayers', unlockEverything);

  render();
  updateHistoryButtons();

  window.MiGranDiaDistributionPhase2P1Editor = Object.freeze({
    historyLimit: HISTORY_LIMIT,
    pasteOffset: PASTE_OFFSET,
    duplicateOffset: DUPLICATE_OFFSET,
    canvas: { width: CANVAS_W, height: CANVAS_H },
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p1-spatial.js ===== */
(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const MAX_PROPOSALS = 20;
  const TENT_CLOSE_THRESHOLD = 18;
  const AUTO_LAYOUT = Object.freeze([
    ['dance', 735, 520],
    ['altar', 620, 265],
    ['dj', 780, 370],
    ['bar', 1025, 295],
    ['couple', 820, 775]
  ]);

  if (document.documentElement.dataset.phase2P1Spatial === 'ready') return;
  document.documentElement.dataset.phase2P1Spatial = 'ready';

  let spatialDrag = null;

  const btnMeasureP1 = document.getElementById('btnMeasure');
  const btnClearMeasuresP1 = document.getElementById('btnClearMeasures');
  const drawAreaButtonsP1 = Array.from(document.querySelectorAll('[data-draw-area]'));
  let drawingAreaKind = 'tent';
  const toggleBgP1 = document.getElementById('toggleBg');
  const btnProposalsP1 = document.getElementById('btnProposals');
  const btnNewProposalP1 = document.getElementById('btnNewProposal');
  const btnDuplicateProposalP1 = document.getElementById('btnDuplicateProposal');
  const closeProposalModalP1 = document.getElementById('closeProposalModal');
  const canvasWrapP1 = document.getElementById('canvasWrap');
  const moveBackgroundButtonP1 = document.getElementById('btnMoveBackground');
  const btnFitP1 = document.getElementById('btnFit');

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, Number(value) || 0));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, Number(value) || 0));

  function captureButton(button, handler) {
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler(event);
    }, true);
  }

  function isEditing() {
    const target = document.activeElement;
    const tag = (target?.tagName || '').toLowerCase();
    return ['input', 'select', 'textarea'].includes(tag) || Boolean(target?.isContentEditable);
  }

  function formatMeters(value) {
    const meters = Math.max(0, Number(value) || 0);
    return `${(Math.round(meters * 100) / 100).toFixed(2).replace(/\.?0+$/, '')} m`;
  }

  function normalizeMeasure(item) {
    if (!item) return null;
    if (Number.isFinite(item.x1)) {
      return { id: item.id, start: { x: item.x1, y: item.y1 }, end: { x: item.x2, y: item.y2 } };
    }
    if (item.a && item.b) return { id: item.id, start: item.a, end: item.b };
    if (item.start && item.end) return { id: item.id, start: item.start, end: item.end };
    return null;
  }

  function measureLabelMarkup(start, end) {
    const scale = currentScale();
    const distancePx = Math.hypot(end.x - start.x, end.y - start.y);
    const distanceM = distancePx / scale;
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    let angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;
    return `<g transform="translate(${midpointX.toFixed(2)} ${midpointY.toFixed(2)}) rotate(${angle.toFixed(2)})"><text class="measure-label" text-anchor="middle" y="-6">${formatMeters(distanceM)}</text></g>`;
  }

  renderMeasureLayer = function phase2P1RenderMeasureLayer() {
    const normalized = measurements.map(normalizeMeasure).filter(Boolean);
    const draft = normalizeMeasure(measureDraft);
    if (draft) normalized.push({ ...draft, id: 'draft' });

    let markup = '';
    normalized.forEach((item) => {
      const { start, end } = item;
      markup += `<line class="measure-line" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
      markup += `<circle class="measure-end" cx="${start.x}" cy="${start.y}" r="5"/>`;
      markup += `<circle class="measure-end" cx="${end.x}" cy="${end.y}" r="5"/>`;
      markup += measureLabelMarkup(start, end);
    });
    measureLayer.innerHTML = markup;
  };

  function updateMeasureUi() {
    if (btnMeasureP1) btnMeasureP1.classList.toggle('active', measureMode);
    if (measureNote) measureNote.hidden = !measureMode;
    if (measureToolbarChip) measureToolbarChip.hidden = !measureMode;
  }

  function stopMeasureMode() {
    measureMode = false;
    measureDraft = null;
    updateMeasureUi();
    renderMeasureLayer();
  }

  function toggleMeasureModeP1() {
    measureMode = !measureMode;
    measureDraft = null;
    if (measureMode) cancelTentDrawing(false);
    updateMeasureUi();
    render();
  }

  function clearMeasurementsP1() {
    if (!measurements.length && !measureDraft) return;
    measurements = [];
    measureDraft = null;
    commitMutation();
    updateMeasureUi();
  }

  function measurementPointerDown(event) {
    if (!measureMode) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const point = svgPoint(event);
    if (!measureDraft?.start) {
      measureDraft = { start: point, end: point };
      renderMeasureLayer();
      return true;
    }
    measurements.push({
      id: measurementUid++,
      x1: measureDraft.start.x,
      y1: measureDraft.start.y,
      x2: point.x,
      y2: point.y
    });
    measureDraft = null;
    commitMutation();
    updateMeasureUi();
    return true;
  }

  function measurementPointerMove(event) {
    if (!measureMode || !measureDraft?.start) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    measureDraft.end = svgPoint(event);
    renderMeasureLayer();
    return true;
  }

  function refreshTentDimensions(item) {
    if (!item || item.type !== 'tent') return;
    const points = Array.isArray(item.pointsM) ? item.pointsM : [];
    if (!points.length) {
      item.widthM = Math.max(.2, Number(item.widthM) || .2);
      item.heightM = Math.max(.2, Number(item.heightM) || .2);
      return;
    }
    const xs = points.map((point) => Number(point.x) || 0);
    const ys = points.map((point) => Number(point.y) || 0);
    item.widthM = Math.max(.2, Math.max(...xs) - Math.min(...xs));
    item.heightM = Math.max(.2, Math.max(...ys) - Math.min(...ys));
  }

  function normalizeTentPoints(item) {
    if (!item || item.type !== 'tent') return [];
    if (Array.isArray(item.pointsM) && item.pointsM.length) return item.pointsM;
    if (Array.isArray(item.points) && item.points.length) {
      const scale = currentScale();
      item.pointsM = item.points.map((point) => ({ x: (Number(point.x) || 0) / scale, y: (Number(point.y) || 0) / scale }));
      item.points = undefined;
      refreshTentDimensions(item);
      return item.pointsM;
    }
    item.pointsM = [];
    return item.pointsM;
  }

  resizeTent = function phase2P1ResizeTent(item, nextWidth, nextHeight) {
    if (!item || item.type !== 'tent') return;
    const points = normalizeTentPoints(item);
    const oldWidth = Math.max(.001, Number(item.widthM) || 1);
    const oldHeight = Math.max(.001, Number(item.heightM) || 1);
    const width = Math.max(.2, Number(nextWidth) || oldWidth);
    const height = Math.max(.2, Number(nextHeight) || oldHeight);
    const sx = width / oldWidth;
    const sy = height / oldHeight;
    item.pointsM = points.map((point) => ({ x: point.x * sx, y: point.y * sy }));
    item.widthM = width;
    item.heightM = height;
  };

  function edgeLabel(pointA, pointB, index, rotation) {
    const scale = currentScale();
    const ax = pointA.x * scale;
    const ay = pointA.y * scale;
    const bx = pointB.x * scale;
    const by = pointB.y * scale;
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    let angle = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    const worldAngle = angle + (Number(rotation) || 0);
    if (worldAngle > 90 || worldAngle < -90) angle += 180;
    const text = svgEl('text', {
      x: midX,
      y: midY - 7,
      'text-anchor': 'middle',
      class: 'measure-label tent-side-label',
      transform: `rotate(${angle} ${midX} ${midY})`,
      'data-tent-side': index
    });
    text.textContent = formatMeters(distance);
    return text;
  }

  renderTent = function phase2P1RenderTent(item) {
    const selectedState = isSelected(item.id);
    const scale = currentScale();
    const pointsM = normalizeTentPoints(item);
    const pointsPx = pointsM.map((point) => ({ x: point.x * scale, y: point.y * scale }));
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable tent-hit draw-area draw-area-${item.areaKind || 'tent'}${selectedState ? ' item-selected' : ''}`,
      'data-id': item.id,
      'data-area-kind': item.areaKind || 'tent'
    });
    const points = pointsPx.map((point) => `${point.x},${point.y}`).join(' ');
    const opacity = Math.max(0, Math.min(1, 1 - (Number(item.transparency ?? 85) / 100)));
    group.appendChild(svgEl('polygon', {
      points,
      fill: item.fillColor || item.color || '#d8c9a6',
      'fill-opacity': opacity,
      stroke: selectedState ? '#d59b3c' : (item.outlineColor || '#555555'),
      'stroke-width': selectedState ? 5 : 3,
      class: 'object-shape'
    }));

    if (showLabels.checked) {
      const text = svgEl('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'object-title' });
      text.textContent = item.label;
      group.appendChild(text);
    }

    pointsM.forEach((point, index) => {
      const next = pointsM[(index + 1) % pointsM.length];
      if (next) group.appendChild(edgeLabel(point, next, index, item.rotation));
    });

    if (selectedState && !isItemLocked(item)) {
      pointsPx.forEach((point, index) => {
        group.appendChild(svgEl('circle', {
          class: 'vertex-handle tent-vertex',
          'data-id': item.id,
          'data-vertex-index': index,
          cx: point.x,
          cy: point.y,
          r: 9
        }));
      });
    }

    appendRotateHandle(group, item);
    return group;
  };

  function draftDistanceMarkup(pointA, pointB) {
    if (!pointA || !pointB) return '';
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y) / currentScale();
    const midX = (pointA.x + pointB.x) / 2;
    const midY = (pointA.y + pointB.y) / 2;
    return `<text class="measure-label" x="${midX}" y="${midY - 7}" text-anchor="middle">${formatMeters(distance)}</text>`;
  }

  function renderTentDraftP1() {
    if (!drawingTent || !tentDraft.length) {
      drawLayer.replaceChildren();
      drawLayer.setAttribute('display', 'none');
      return;
    }
    drawLayer.setAttribute('display', '');
    const points = [...tentDraft];
    if (tentHoverPoint) points.push(tentHoverPoint);
    let markup = `<polyline points="${points.map((point) => `${point.x},${point.y}`).join(' ')}" class="tent-draft-line" fill="none"/>`;
    tentDraft.forEach((point, index) => {
      markup += `<circle cx="${point.x}" cy="${point.y}" r="${index === 0 ? 8 : 6}" class="tent-draft-point${index === 0 ? ' tent-draft-start' : ''}"/>`;
      if (index > 0) markup += draftDistanceMarkup(tentDraft[index - 1], point);
    });
    if (tentHoverPoint && tentDraft.length) markup += draftDistanceMarkup(tentDraft.at(-1), tentHoverPoint);
    if (tentDraft.length >= 3) markup += draftDistanceMarkup(tentDraft.at(-1), tentDraft[0]);
    drawLayer.innerHTML = markup;
  }

  function setTentUi(active) {
    drawAreaButtonsP1.forEach((button) => {
      const selectedKind = button.dataset.drawArea || 'tent';
      button.classList.toggle('active', active && selectedKind === drawingAreaKind);
    });
    if (tentDrawHint) {
      tentDrawHint.hidden = !active;
      if (active) {
        const preset = DRAW_AREA_PRESETS[drawingAreaKind] || DRAW_AREA_PRESETS.custom;
        tentDrawHint.textContent = `Dibujando: ${preset.label}. Haz clic para marcar vértices. Doble clic o Enter para terminar; Esc cancela.`;
      }
    }
  }

  function cancelTentDrawing(shouldRender = true) {
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    spatialDrag = null;
    setTentUi(false);
    renderTentDraftP1();
    if (shouldRender) render();
  }

  function startTentDrawingP1(kind = 'tent') {
    const nextKind = DRAW_AREA_PRESETS[kind] ? kind : 'custom';
    if (drawingTent && drawingAreaKind === nextKind) {
      cancelTentDrawing();
      return;
    }
    stopMeasureMode();
    drawingAreaKind = nextKind;
    drawingTent = true;
    tentDraft = [];
    tentHoverPoint = null;
    clearSelection();
    setTentUi(true);
    render();
  }

  function finishTentDrawingP1() {
    const preset = DRAW_AREA_PRESETS[drawingAreaKind] || DRAW_AREA_PRESETS.custom;
    if (tentDraft.length < 3) {
      window.alert(`${preset.label} necesita como mínimo tres vértices.`);
      return false;
    }
    const closedPoints = tentDraft.map((point) => ({ x: Number(point.x), y: Number(point.y) }));
    const centroid = {
      x: closedPoints.reduce((sum, point) => sum + point.x, 0) / closedPoints.length,
      y: closedPoints.reduce((sum, point) => sum + point.y, 0) / closedPoints.length
    };
    const scale = currentScale();
    const pointsM = closedPoints.map((point) => ({
      x: (point.x - centroid.x) / scale,
      y: (point.y - centroid.y) / scale
    }));
    const sameKindCount = elements.filter((entry) => entry.type === 'tent' && (entry.areaKind || 'tent') === drawingAreaKind).length;
    const item = {
      id: makeId('tent'),
      type: 'tent',
      areaKind: drawingAreaKind,
      shape: 'polygon',
      label: `${preset.label} ${sameKindCount + 1}`,
      x: clampX(centroid.x),
      y: clampY(centroid.y),
      widthM: 1,
      heightM: 1,
      suggestedWidthM: preset.suggestedWidthM,
      suggestedHeightM: preset.suggestedHeightM,
      rotation: 0,
      color: preset.color,
      fillColor: preset.color,
      outlineColor: '#555555',
      transparency: preset.transparency,
      pointsM,
      locked: false
    };
    refreshTentDimensions(item);
    elements.push(item);
    hiddenLayers.tent = false;
    setSelection([item.id], item.id);
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    setTentUi(false);
    commitMutation();
    return true;
  }
  function tentPointerDown(event) {
    const vertex = event.target?.closest?.('.tent-vertex');
    if (vertex) {
      const item = getItem(vertex.getAttribute('data-id'));
      if (!item || isItemLocked(item)) return false;
      event.preventDefault();
      event.stopImmediatePropagation();
      setSelection([item.id], item.id);
      spatialDrag = {
        mode: 'tent-vertex',
        pointerId: event.pointerId,
        id: item.id,
        vertexIndex: Number(vertex.getAttribute('data-vertex-index')) || 0,
        moved: false
      };
      try { planner.setPointerCapture(event.pointerId); } catch (_) {}
      return true;
    }

    if (!drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const point = svgPoint(event);
    if (tentDraft.length >= 3) {
      const first = tentDraft[0];
      if (Math.hypot(point.x - first.x, point.y - first.y) <= TENT_CLOSE_THRESHOLD) {
        finishTentDrawingP1();
        return true;
      }
    }
    tentDraft.push({ x: point.x, y: point.y });
    tentHoverPoint = null;
    renderTentDraftP1();
    return true;
  }

  function tentPointerMove(event) {
    if (spatialDrag?.mode === 'tent-vertex' && event.pointerId === spatialDrag.pointerId) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = getItem(spatialDrag.id);
      if (!item || isItemLocked(item)) return true;
      const point = svgPoint(event);
      const angle = -(Number(item.rotation) || 0) * Math.PI / 180;
      const dx = point.x - item.x;
      const dy = point.y - item.y;
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
      normalizeTentPoints(item);
      item.pointsM[spatialDrag.vertexIndex] = { x: localX / currentScale(), y: localY / currentScale() };
      refreshTentDimensions(item);
      spatialDrag.moved = true;
      render();
      return true;
    }
    if (!drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    tentHoverPoint = svgPoint(event);
    renderTentDraftP1();
    return true;
  }

  function endSpatialDrag(event) {
    if (!spatialDrag || event.pointerId !== spatialDrag.pointerId) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { planner.releasePointerCapture(event.pointerId); } catch (_) {}
    const changed = spatialDrag.moved;
    spatialDrag = null;
    if (changed) {
      pushHistory();
      saveCurrentProposalSnapshot();
    }
    render();
    return true;
  }

  function makeLayoutItem(type, x, y) {
    const base = TYPE_DEFAULTS[type];
    if (!base) return null;
    return {
      id: makeId(type),
      type,
      shape: base.shape,
      label: base.label,
      x,
      y,
      widthM: base.widthM,
      heightM: base.heightM,
      rotation: 0,
      color: base.color,
      locked: false
    };
  }

  function autoLayoutP1() {
    cancelTentDrawing(false);
    stopMeasureMode();
    elements = AUTO_LAYOUT.map(([type, x, y]) => makeLayoutItem(type, x, y)).filter(Boolean);
    hiddenLayers = {};
    lockedLayers = {};
    clearSelection();
    commitMutation();
  }

  function installAutoLayoutButton() {
    if (document.getElementById('btnAutoLayoutP1')) return;
    const viewSection = toggleBgP1?.closest?.('.panel-section');
    if (!viewSection) return;
    const button = document.createElement('button');
    button.id = 'btnAutoLayoutP1';
    button.type = 'button';
    button.className = 'wide-button';
    button.textContent = 'Auto distribución';
    button.title = 'Replica la composición inicial del Distribución estable';
    button.addEventListener('click', autoLayoutP1);
    toggleBgP1.insertAdjacentElement('afterend', button);
  }

  function toggleBackgroundP1(event) {
    bgVisible = !bgVisible;
    if (event?.currentTarget) event.currentTarget.textContent = bgVisible ? 'Ocultar plano' : 'Mostrar plano';
    commitMutation();
  }

  saveCurrentProposalSnapshot = function phase2P1SaveCurrentProposalSnapshot() {
    if (!currentProposalId) return;
    const proposal = proposals.find((entry) => entry.id === currentProposalId);
    if (!proposal) return;
    proposal.state = clone(stateSnapshot());
    proposal.updatedAt = new Date().toISOString();
  };

  function proposalName(value, fallback) {
    const name = String(value || '').trim();
    return name || fallback;
  }

  function switchProposalP1(id) {
    saveCurrentProposalSnapshot();
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return false;
    currentProposalId = proposal.id;
    historyPast = [];
    historyFuture = [];
    restoreState(clone(proposal.state));
    pushHistory();
    proposalNameTop.textContent = proposal.name;
    proposalNameCanvas.textContent = `${proposal.name} · laboratorio`;
    renderProposalList();
    return true;
  }

  function createProposalP1({ duplicate = false } = {}) {
    saveCurrentProposalSnapshot();
    if (proposals.length >= MAX_PROPOSALS) {
      window.alert(`Puedes guardar como máximo ${MAX_PROPOSALS} propuestas. Elimina una para crear otra.`);
      return false;
    }
    const active = proposals.find((entry) => entry.id === currentProposalId);
    const suggestedName = duplicate
      ? `${active?.name || 'Propuesta'} copia`
      : `Propuesta ${proposals.length + 1}`;
    const answer = window.prompt(duplicate ? 'Nombre de la propuesta duplicada:' : 'Nombre de la nueva propuesta:', suggestedName);
    if (answer === null) return false;
    const state = duplicate && active ? clone(active.state) : blankState();
    const now = new Date().toISOString();
    const proposal = {
      id: makeId('proposal'),
      name: proposalName(answer, suggestedName),
      state,
      createdAt: now,
      updatedAt: now
    };
    proposals.push(proposal);
    return switchProposalP1(proposal.id);
  }

  function renameProposalP1(id) {
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return;
    const answer = window.prompt('Nuevo nombre de la propuesta:', proposal.name);
    if (answer === null) return;
    proposal.name = proposalName(answer, proposal.name);
    proposal.updatedAt = new Date().toISOString();
    if (proposal.id === currentProposalId) {
      proposalNameTop.textContent = proposal.name;
      proposalNameCanvas.textContent = `${proposal.name} · laboratorio`;
    }
    renderProposalList();
  }

  function deleteProposalP1(id) {
    if (proposals.length <= 1) {
      window.alert('Debe quedar al menos una propuesta en el laboratorio.');
      return;
    }
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return;
    if (!window.confirm(`¿Eliminar “${proposal.name}”?`)) return;
    const wasActive = proposal.id === currentProposalId;
    proposals = proposals.filter((entry) => entry.id !== id);
    if (wasActive) switchProposalP1(proposals[0].id);
    else renderProposalList();
  }

  renderProposalList = function phase2P1RenderProposalList() {
    if (!proposalList) return;
    saveCurrentProposalSnapshot();
    proposalList.replaceChildren();

    const count = document.createElement('div');
    count.className = 'proposal-count';
    count.textContent = `${proposals.length} de ${MAX_PROPOSALS} propuestas`;
    proposalList.appendChild(count);

    proposals.forEach((proposal) => {
      const row = document.createElement('article');
      row.className = `proposal-row${proposal.id === currentProposalId ? ' active' : ''}`;
      row.dataset.proposalId = proposal.id;

      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = proposal.name;
      const state = proposal.state || {};
      const tables = (state.elements || []).filter((item) => item.type === 'table').length;
      const small = document.createElement('small');
      small.textContent = `${tables} mesa(s) · ${(state.elements || []).length} elemento(s)${proposal.id === currentProposalId ? ' · Activa' : ''}`;
      info.append(title, small);

      const actions = document.createElement('div');
      actions.className = 'mini-actions';
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = proposal.id === currentProposalId ? 'Abierta' : 'Abrir';
      open.disabled = proposal.id === currentProposalId;
      open.addEventListener('click', () => switchProposalP1(proposal.id));
      const rename = document.createElement('button');
      rename.type = 'button';
      rename.textContent = 'Renombrar';
      rename.addEventListener('click', () => renameProposalP1(proposal.id));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Eliminar';
      remove.disabled = proposals.length <= 1;
      remove.addEventListener('click', () => deleteProposalP1(proposal.id));
      actions.append(open, rename, remove);

      row.append(info, actions);
      proposalList.appendChild(row);
    });
  };

  function openProposalsP1() {
    renderProposalList();
    proposalModal.hidden = false;
  }

  function closeProposalsP1() {
    proposalModal.hidden = true;
  }

  function setBackgroundMoveModeP1(next) {
    backgroundMoveMode = Boolean(next);
    moveBackgroundButtonP1?.setAttribute('aria-pressed', String(backgroundMoveMode));
    moveBackgroundButtonP1?.classList.toggle('active', backgroundMoveMode);
    canvasWrapP1?.classList.toggle('background-move-mode', backgroundMoveMode);
    canvasWrapP1?.classList.toggle('viewport-pan-mode', !backgroundMoveMode);
    bgImage?.setAttribute('pointer-events', backgroundMoveMode ? 'all' : 'none');
  }

  function applyViewportOffsetP1() {
    planner.style.transform = `translate3d(${viewportOffset.x}px,${viewportOffset.y}px,0)`;
  }

  function centerViewportP1() {
    if (!canvasWrapP1) return;
    const plannerWidth = CANVAS_W * zoom;
    const plannerHeight = CANVAS_H * zoom;
    viewportOffset = {
      x: Math.round((canvasWrapP1.clientWidth - plannerWidth) / 2),
      y: Math.round((canvasWrapP1.clientHeight - plannerHeight) / 2)
    };
    applyViewportOffsetP1();
  }

  function fitAndCenterViewportP1() {
    if (!canvasWrapP1) return;
    const fitWidth = canvasWrapP1.clientWidth / CANVAS_W;
    setZoom(Math.max(.65, Math.min(1, fitWidth)));
    requestAnimationFrame(centerViewportP1);
  }

  function isBlankPlannerTarget(event) {
    if (event.target?.closest?.('[data-id],[data-rotate-id],.tent-vertex')) return false;
    return true;
  }

  function beginViewportPanP1(event) {
    if (!canvasWrapP1 || backgroundMoveMode || measureMode || drawingTent) return false;
    if (event.pointerType === 'mouse' && event.button !== 0) return false;
    if (!isBlankPlannerTarget(event)) return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    clearSelection();

    viewportPan = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      startX: viewportOffset.x,
      startY: viewportOffset.y
    };
    canvasWrapP1.classList.add('is-panning');
    try { planner.setPointerCapture(event.pointerId); } catch (_) {}
    renderP1();
    return true;
  }

  function moveViewportPanP1(event) {
    if (!viewportPan || event.pointerId !== viewportPan.pointerId) return false;
    event.preventDefault();
    event.stopImmediatePropagation();

    viewportOffset = {
      x: viewportPan.startX + (event.clientX - viewportPan.clientX),
      y: viewportPan.startY + (event.clientY - viewportPan.clientY)
    };
    applyViewportOffsetP1();
    return true;
  }

  function endViewportPanP1(event) {
    if (!viewportPan || event.pointerId !== viewportPan.pointerId) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { planner.releasePointerCapture(event.pointerId); } catch (_) {}
    viewportPan = null;
    canvasWrapP1?.classList.remove('is-panning');
    return true;
  }

  function onPlannerPointerDown(event) {
    if (tentPointerDown(event)) return;
    if (measurementPointerDown(event)) return;
    beginViewportPanP1(event);
  }

  function onPlannerPointerMove(event) {
    if (tentPointerMove(event)) return;
    if (measurementPointerMove(event)) return;
    moveViewportPanP1(event);
  }

  function onPlannerDoubleClick(event) {
    if (!drawingTent) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    finishTentDrawingP1();
  }

  function onDocumentKeyDown(event) {
    if (isEditing()) return;
    if (drawingTent && event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishTentDrawingP1();
      return;
    }
    if ((drawingTent || measureMode) && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (drawingTent) cancelTentDrawing();
      if (measureMode) stopMeasureMode();
    }
  }

  captureButton(btnMeasureP1, toggleMeasureModeP1);
  captureButton(btnClearMeasuresP1, clearMeasurementsP1);
  drawAreaButtonsP1.forEach((button) => captureButton(button, () => startTentDrawingP1(button.dataset.drawArea || 'tent')));
  captureButton(toggleBgP1, toggleBackgroundP1);
  captureButton(moveBackgroundButtonP1, () => setBackgroundMoveModeP1(!backgroundMoveMode));
  captureButton(btnFitP1, fitAndCenterViewportP1);
  captureButton(btnProposalsP1, openProposalsP1);
  captureButton(btnNewProposalP1, () => createProposalP1({ duplicate: false }));
  captureButton(btnDuplicateProposalP1, () => createProposalP1({ duplicate: true }));
  captureButton(closeProposalModalP1, closeProposalsP1);

  proposalModal?.addEventListener('click', (event) => {
    if (event.target === proposalModal) closeProposalsP1();
  }, true);

  planner.addEventListener('pointerdown', onPlannerPointerDown, true);
  planner.addEventListener('pointermove', onPlannerPointerMove, true);
  planner.addEventListener('pointerup', (event) => {
    if (endViewportPanP1(event)) return;
    endSpatialDrag(event);
  }, true);
  planner.addEventListener('pointercancel', (event) => {
    if (endViewportPanP1(event)) return;
    endSpatialDrag(event);
  }, true);
  planner.addEventListener('dblclick', onPlannerDoubleClick, true);
  document.addEventListener('keydown', onDocumentKeyDown, true);

  installAutoLayoutButton();
  elements.filter((item) => item.type === 'tent').forEach((item) => normalizeTentPoints(item));
  updateMeasureUi();
  setTentUi(false);
  setBackgroundMoveModeP1(false);
  renderProposalList();
  render();
  requestAnimationFrame(centerViewportP1);

  window.MiGranDiaDistributionPhase2P1Spatial = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H },
    measurement: { multiple: true, livePreview: true, labelsInMeters: true },
    tent: { polygon: true, minVertices: 3, closeThresholdPx: TENT_CLOSE_THRESHOLD, editableVertices: true, sideMeasures: true, rotation: true, resize: true, color: true, transparency: true },
    drawAreas: Object.keys(DRAW_AREA_PRESETS),
    autoLayout: AUTO_LAYOUT.map(([type, x, y]) => ({ type, x, y })),
    background: { visiblePerProposal: true },
    proposals: { max: MAX_PROPOSALS, memoryOnly: true, create: true, duplicate: true, rename: true, delete: true, switch: true },
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p1-proposal-preview.js ===== */
(() => {
  if (document.documentElement.dataset.phase2P1ProposalPreview === 'ready') return;
  document.documentElement.dataset.phase2P1ProposalPreview = 'ready';

  function buildProposalPreview() {
    try {
      const cloneSvg = planner.cloneNode(true);
      cloneSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      cloneSvg.setAttribute('viewBox', '0 0 1448 1086');
      cloneSvg.querySelectorAll('.rotate-ui,.vertex-handle').forEach((node) => node.remove());
      cloneSvg.querySelector('#drawLayer')?.replaceChildren();
      const xml = new XMLSerializer().serializeToString(cloneSvg);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    } catch (_) {
      return '';
    }
  }

  function formatUpdatedAt(value) {
    if (!value) return 'Sesión actual';
    try {
      return new Date(value).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'Sesión actual';
    }
  }

  saveCurrentProposalSnapshot = function phase2P1SaveCurrentProposalWithPreview() {
    if (!currentProposalId) return;
    const proposal = proposals.find((entry) => entry.id === currentProposalId);
    if (!proposal) return;
    proposal.state = clone(stateSnapshot());
    proposal.updatedAt = new Date().toISOString();
    proposal.thumbnail = buildProposalPreview();
  };

  const baseRenderProposalList = renderProposalList;
  renderProposalList = function phase2P1RenderProposalListWithPreview() {
    baseRenderProposalList();
    proposalList.querySelectorAll('[data-proposal-id]').forEach((row) => {
      const proposal = proposals.find((entry) => entry.id === row.dataset.proposalId);
      if (!proposal) return;

      const preview = document.createElement('div');
      preview.className = 'proposal-preview-p1';
      if (proposal.thumbnail) {
        const image = document.createElement('img');
        image.src = proposal.thumbnail;
        image.alt = `Vista previa de ${proposal.name}`;
        preview.appendChild(image);
      } else {
        const placeholder = document.createElement('span');
        placeholder.textContent = 'Vista previa';
        preview.appendChild(placeholder);
      }
      row.prepend(preview);

      const info = row.children[1];
      const small = info?.querySelector('small');
      if (small) small.textContent += ` · ${formatUpdatedAt(proposal.updatedAt)}`;
    });
  };

  saveCurrentProposalSnapshot();
  renderProposalList();

  window.MiGranDiaDistributionPhase2P1ProposalPreview = Object.freeze({
    memoryOnly: true,
    svgPreview: true,
    updatedAt: true,
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p2.js ===== */
(() => {
  if (document.documentElement.dataset.phase2P2 === 'ready') return;
  document.documentElement.dataset.phase2P2 = 'ready';

  const SESSION_VERSION = 2;
  const MAX_PROPOSALS = 20;
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const ALLOWED_TYPES = new Set(Object.keys(TYPE_DEFAULTS));
  const touchPoints = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let toastTimer = 0;

  const byId = (id) => document.getElementById(id);
  const safeText = (value, fallback = '') => String(value ?? fallback).slice(0, 160);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bounded = (value, min, max, fallback) => Math.max(min, Math.min(max, finite(value, fallback)));
  const nowIso = () => new Date().toISOString();

  function toast(message, bad = false) {
    let node = byId('p2Toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'p2Toast';
      node.className = 'p2-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.toggle('bad', bad);
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function sanitizePoint(point) {
    return { x: bounded(point?.x, -100, 2000, 0), y: bounded(point?.y, -100, 1600, 0) };
  }

  function sanitizeElement(item) {
    if (!item || !ALLOWED_TYPES.has(item.type)) return null;
    const type = item.type;
    const out = {
      id: safeText(item.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
      type,
      shape: safeText(item.shape || (type === 'table' ? 'table' : 'rect')),
      label: safeText(item.label || type),
      x: bounded(item.x, 0, CANVAS_W, CANVAS_W / 2),
      y: bounded(item.y, 0, CANVAS_H, CANVAS_H / 2),
      widthM: bounded(item.widthM, .2, 50, 1),
      heightM: bounded(item.heightM, .2, 50, 1),
      rotation: bounded(item.rotation, -360, 360, 0),
      color: /^#[0-9a-f]{6}$/i.test(item.color || '') ? item.color : '#d9b978',
      locked: Boolean(item.locked)
    };
    if (type === 'table') {
      out.capacity = 10;
      out.seats = Array.isArray(item.seats) ? item.seats.slice(0, 10).map((id) => id ? safeText(id) : null) : Array(10).fill(null);
      while (out.seats.length < 10) out.seats.push(null);
    }
    if (type === 'tent') {
      const requestedAreaKind = safeText(item.areaKind || 'tent');
      out.areaKind = DRAW_AREA_PRESETS[requestedAreaKind] ? requestedAreaKind : 'custom';
      out.fillColor = /^#[0-9a-f]{6}$/i.test(item.fillColor || '') ? item.fillColor : out.color;
      out.outlineColor = /^#[0-9a-f]{6}$/i.test(item.outlineColor || '') ? item.outlineColor : '#555555';
      out.transparency = bounded(item.transparency, 0, 90, 45);
      out.suggestedWidthM = bounded(item.suggestedWidthM, .2, 50, DRAW_AREA_PRESETS[out.areaKind].suggestedWidthM);
      out.suggestedHeightM = bounded(item.suggestedHeightM, .2, 50, DRAW_AREA_PRESETS[out.areaKind].suggestedHeightM);
      const points = Array.isArray(item.pointsM) ? item.pointsM : [];
      out.pointsM = points.slice(0, 80).map((point) => ({ x: bounded(point?.x, -50, 50, 0), y: bounded(point?.y, -50, 50, 0) }));
    }
    return out;
  }

  function sanitizeState(input) {
    const raw = input && typeof input === 'object' ? input : {};
    const safeElements = Array.isArray(raw.elements) ? raw.elements.map(sanitizeElement).filter(Boolean).slice(0, 300) : [];
    const safeGuests = Array.isArray(raw.guests) ? raw.guests.slice(0, 1000).map((guest, index) => ({
      id: safeText(guest?.id || `guest-import-${index + 1}`),
      name: safeText(guest?.name || `Invitado ${index + 1}`)
    })) : [];
    const guestIds = new Set(safeGuests.map((guest) => guest.id));
    safeElements.filter((item) => item.type === 'table').forEach((table) => {
      table.seats = table.seats.map((id) => id && guestIds.has(id) ? id : null);
    });
    const ids = new Set(safeElements.map((item) => item.id));
    const selectedIdsSafe = Array.isArray(raw.selectedIds) ? raw.selectedIds.map(String).filter((id) => ids.has(id)).slice(0, 60) : [];
    const selectedIdSafe = ids.has(String(raw.selectedId || '')) ? String(raw.selectedId) : (selectedIdsSafe[0] || '');
    const safeMeasures = Array.isArray(raw.measurements) ? raw.measurements.slice(0, 200).map((measure, index) => {
      if (Number.isFinite(Number(measure?.x1))) {
        return { id: finite(measure.id, index + 1), x1: bounded(measure.x1, 0, CANVAS_W, 0), y1: bounded(measure.y1, 0, CANVAS_H, 0), x2: bounded(measure.x2, 0, CANVAS_W, 0), y2: bounded(measure.y2, 0, CANVAS_H, 0) };
      }
      return { id: finite(measure?.id, index + 1), a: sanitizePoint(measure?.a), b: sanitizePoint(measure?.b) };
    }) : [];
    const hidden = {};
    const locked = {};
    Object.keys(raw.hiddenLayers || {}).forEach((key) => { if (ALLOWED_TYPES.has(key)) hidden[key] = Boolean(raw.hiddenLayers[key]); });
    Object.keys(raw.lockedLayers || {}).forEach((key) => { if (ALLOWED_TYPES.has(key)) locked[key] = Boolean(raw.lockedLayers[key]); });
    return {
      elements: safeElements,
      guests: safeGuests,
      guestUid: Math.max(1, Math.floor(finite(raw.guestUid, safeGuests.length + 1))),
      selectedIds: selectedIdsSafe,
      selectedId: selectedIdSafe,
      scale: bounded(raw.scale, 18, 50, 32),
      hiddenLayers: hidden,
      lockedLayers: locked,
      measurements: safeMeasures,
      measurementUid: Math.max(1, Math.floor(finite(raw.measurementUid, safeMeasures.length + 1))),
      bgVisible: raw.bgVisible !== false,
      settings: {
        grid: raw.settings?.grid !== false,
        clearance: raw.settings?.clearance !== false,
        labels: raw.settings?.labels !== false,
        names: raw.settings?.names !== false
      }
    };
  }

  function sessionPayload() {
    saveCurrentProposalSnapshot();
    return {
      kind: 'mi-gran-dia-distribucion-lab-session',
      version: SESSION_VERSION,
      exportedAt: nowIso(),
      currentProposalId,
      proposals: proposals.slice(0, MAX_PROPOSALS).map((proposal) => ({
        id: safeText(proposal.id),
        name: safeText(proposal.name || 'Propuesta'),
        updatedAt: proposal.updatedAt || nowIso(),
        state: sanitizeState(proposal.state)
      }))
    };
  }

  function exportSessionJson() {
    const payload = sessionPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `distribucion-lab-${new Date().toISOString().slice(0,10)}.json`);
    toast('Sesión JSON exportada.');
  }

  async function importSessionJson(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('El JSON supera el límite de 5 MB.', true);
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.kind !== 'mi-gran-dia-distribucion-lab-session' || Number(parsed?.version) !== SESSION_VERSION) {
        throw new Error('Formato o versión no compatible.');
      }
      if (!Array.isArray(parsed.proposals) || !parsed.proposals.length) throw new Error('El archivo no contiene propuestas.');
      const imported = parsed.proposals.slice(0, MAX_PROPOSALS).map((proposal, index) => ({
        id: safeText(proposal?.id || `proposal-import-${index + 1}`),
        name: safeText(proposal?.name || `Propuesta ${index + 1}`),
        updatedAt: proposal?.updatedAt || nowIso(),
        state: sanitizeState(proposal?.state)
      }));
      const ids = new Set();
      imported.forEach((proposal, index) => {
        if (!proposal.id || ids.has(proposal.id)) proposal.id = `proposal-import-${Date.now()}-${index + 1}`;
        ids.add(proposal.id);
      });
      proposals = imported;
      const requested = safeText(parsed.currentProposalId || '');
      currentProposalId = ids.has(requested) ? requested : proposals[0].id;
      const active = proposals.find((proposal) => proposal.id === currentProposalId) || proposals[0];
      proposalNameTop.textContent = active.name;
      proposalNameCanvas.textContent = `${active.name} · laboratorio`;
      historyPast = [];
      historyFuture = [];
      restoreState(clone(active.state));
      pushHistory();
      renderProposalList();
      saveCurrentProposalSnapshot();
      toast(`Sesión importada: ${proposals.length} propuesta(s).`);
    } catch (error) {
      toast(error?.message || 'No se pudo importar el JSON.', true);
    }
  }

  function stripEditingUi(svg) {
    svg.querySelectorAll('.rotate-ui,.rotate-handle,.rotate-stem,.vertex-handle,.tent-vertex').forEach((node) => node.remove());
    svg.querySelector('#guideLayer')?.replaceChildren();
    svg.querySelector('#drawLayer')?.replaceChildren();
    svg.querySelectorAll('.item-selected,.table-selected').forEach((node) => node.classList.remove('item-selected','table-selected'));
    svg.querySelectorAll('[data-rotate-id],[data-vertex-index]').forEach((node) => {
      node.removeAttribute('data-rotate-id');
      node.removeAttribute('data-vertex-index');
    });
    svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);
    svg.setAttribute('width', String(CANVAS_W));
    svg.setAttribute('height', String(CANVAS_H));
    svg.style.width = '';
    svg.style.height = '';
    return svg;
  }

  function copyComputedSvgStyles(source, target) {
    const originalNodes = [source, ...source.querySelectorAll('*')];
    const clonedNodes = [target, ...target.querySelectorAll('*')];
    const props = ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','opacity','font-family','font-size','font-style','font-weight','text-anchor','paint-order','visibility','display'];
    originalNodes.forEach((node, index) => {
      const cloneNode = clonedNodes[index];
      if (!cloneNode || !(node instanceof SVGElement)) return;
      const style = getComputedStyle(node);
      props.forEach((prop) => {
        const value = style.getPropertyValue(prop);
        if (value) cloneNode.style.setProperty(prop, value);
      });
    });
  }

  function finalSvgClone({ inlineStyles = false } = {}) {
    render();
    const cloned = planner.cloneNode(true);
    if (inlineStyles) copyComputedSvgStyles(planner, cloned);
    stripEditingUi(cloned);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return cloned;
  }

  async function exportPng() {
    try {
      const svg = finalSvgClone({ inlineStyles: true });
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('No se pudo rasterizar el plano.'));
      });
      image.src = url;
      await loaded;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, CANVAS_W, CANVAS_H);
      context.drawImage(image, 0, 0, CANVAS_W, CANVAS_H);
      URL.revokeObjectURL(url);
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
      if (!pngBlob) throw new Error('No se pudo crear el PNG.');
      const name = (proposals.find((proposal) => proposal.id === currentProposalId)?.name || 'propuesta').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '');
      downloadBlob(pngBlob, `distribucion-${name || 'propuesta'}.png`);
      toast('PNG 1448 × 1086 exportado.');
    } catch (error) {
      toast(error?.message || 'No se pudo exportar el PNG.', true);
    }
  }

  function ensureFinalOverlay() {
    let overlay = byId('p2FinalOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'p2FinalOverlay';
    overlay.className = 'p2-final-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<header class="p2-final-head"><div><strong id="p2FinalTitle">Vista final</strong><small>Presentación limpia de la propuesta actual</small></div><div class="p2-final-actions"><button id="p2FinalPng" class="primary" type="button">Exportar PNG</button><button id="p2FinalClose" type="button">Cerrar</button></div></header><div class="p2-final-stage" id="p2FinalStage"></div>';
    document.body.appendChild(overlay);
    byId('p2FinalPng').addEventListener('click', exportPng);
    byId('p2FinalClose').addEventListener('click', closeFinalView);
    return overlay;
  }

  function openFinalView() {
    cancelModes?.();
    const overlay = ensureFinalOverlay();
    const stage = byId('p2FinalStage');
    stage.replaceChildren(finalSvgClone());
    const active = proposals.find((proposal) => proposal.id === currentProposalId);
    byId('p2FinalTitle').textContent = active?.name || 'Vista final';
    overlay.hidden = false;
    document.body.classList.add('p2-final-open');
  }

  function closeFinalView() {
    const overlay = byId('p2FinalOverlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('p2-final-open');
  }

  function buildDesktopActions() {
    const host = document.querySelector('.top-actions');
    if (!host || byId('p2ActionStrip')) return;
    const strip = document.createElement('div');
    strip.id = 'p2ActionStrip';
    strip.className = 'p2-action-strip';
    const jsonButton = document.createElement('button');
    jsonButton.type = 'button';
    jsonButton.textContent = '↓ JSON';
    jsonButton.title = 'Exportar sesión JSON';
    jsonButton.addEventListener('click', exportSessionJson);
    const pngButton = document.createElement('button');
    pngButton.type = 'button';
    pngButton.textContent = '↓ PNG';
    pngButton.title = 'Exportar plano PNG';
    pngButton.addEventListener('click', exportPng);
    const importLabel = document.createElement('label');
    importLabel.textContent = '↑ JSON';
    importLabel.title = 'Importar sesión JSON';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.addEventListener('change', async () => {
      const selectedFile = file.files?.[0];
      file.value = '';
      await importSessionJson(selectedFile);
    });
    importLabel.appendChild(file);
    strip.append(jsonButton, pngButton, importLabel);
    host.insertBefore(strip, byId('resetLab'));
  }

  function closeMobilePanels() {
    document.querySelector('.tools-panel')?.classList.remove('p2-sheet-open');
    document.querySelector('.properties-panel')?.classList.remove('p2-sheet-open');
    byId('p2MobileActions')?.classList.remove('show');
    byId('p2MobileBackdrop')?.classList.remove('show');
  }

  function openPanel(selector) {
    closeMobilePanels();
    document.querySelector(selector)?.classList.add('p2-sheet-open');
    byId('p2MobileBackdrop')?.classList.add('show');
  }

  function buildMobileUi() {
    if (byId('p2MobileFab')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'p2MobileBackdrop';
    backdrop.className = 'p2-mobile-backdrop';
    backdrop.addEventListener('click', closeMobilePanels);
    const actions = document.createElement('div');
    actions.id = 'p2MobileActions';
    actions.className = 'p2-mobile-sheet';
    actions.setAttribute('aria-label', 'Acciones de distribución');
    const makeButton = (text, handler, className = '') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      if (className) button.className = className;
      button.addEventListener('click', () => { handler(); if (!['Herramientas','Propiedades'].includes(text)) closeMobilePanels(); });
      return button;
    };
    actions.append(
      makeButton('Herramientas', () => openPanel('.tools-panel')),
      makeButton('Propiedades', () => openPanel('.properties-panel')),
      makeButton('Propuestas', () => { renderProposalList(); proposalModal.hidden = false; }),
      makeButton('Vista final', openFinalView),
      makeButton('Exportar PNG', exportPng),
      makeButton('Exportar JSON', exportSessionJson)
    );
    const importLabel = document.createElement('label');
    importLabel.textContent = 'Importar JSON';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      closeMobilePanels();
      await importSessionJson(file);
    });
    importLabel.appendChild(input);
    actions.append(importLabel, makeButton('Cerrar', closeMobilePanels, 'primary'));
    const fab = document.createElement('button');
    fab.id = 'p2MobileFab';
    fab.className = 'p2-mobile-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir acciones');
    fab.textContent = '+';
    fab.addEventListener('click', () => {
      const show = !actions.classList.contains('show');
      closeMobilePanels();
      actions.classList.toggle('show', show);
      backdrop.classList.toggle('show', show);
      fab.textContent = show ? '×' : '+';
    });
    document.body.append(backdrop, actions, fab);
  }

  function touchDistance() {
    const points = [...touchPoints.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function onTouchPointerDown(event) {
    if (event.pointerType !== 'touch') return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size === 2) {
      event.preventDefault();
      pinchStartDistance = touchDistance() || 1;
      pinchStartZoom = zoom;
      if (typeof p1Drag !== 'undefined') p1Drag = null;
      if (typeof drag !== 'undefined') drag = null;
      if (typeof spatialDrag !== 'undefined') spatialDrag = null;
    }
  }

  function onTouchPointerMove(event) {
    if (event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size >= 2) {
      event.preventDefault();
      const distance = touchDistance();
      if (!pinchStartDistance || !distance) return;
      setZoom(pinchStartZoom * distance / pinchStartDistance);
    }
  }

  function onTouchPointerEnd(event) {
    if (event.pointerType !== 'touch') return;
    touchPoints.delete(event.pointerId);
    if (touchPoints.size < 2) {
      pinchStartDistance = 0;
      pinchStartZoom = zoom;
    }
  }

  function installTouchZoom() {
    const wrap = byId('canvasWrap');
    if (!wrap || wrap.dataset.p2TouchZoom === 'ready') return;
    wrap.dataset.p2TouchZoom = 'ready';
    wrap.addEventListener('pointerdown', onTouchPointerDown, { capture: true, passive: false });
    wrap.addEventListener('pointermove', onTouchPointerMove, { capture: true, passive: false });
    wrap.addEventListener('pointerup', onTouchPointerEnd, { capture: true, passive: false });
    wrap.addEventListener('pointercancel', onTouchPointerEnd, { capture: true, passive: false });

    // Rueda del mouse = zoom del lienzo completo. No modifica ninguna medida
    // física: únicamente cambia la escala visual de planner.
    wrap.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.10 : 0.90;
      setZoom(zoom * factor);
    }, { passive:false });
  }

  function overridePresentationButton() {
    const button = byId('btnPresentation');
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openFinalView();
    }, true);
  }

  buildDesktopActions();
  buildMobileUi();
  installTouchZoom();
  overridePresentationButton();

  window.MiGranDiaDistributionPhase2P2 = Object.freeze({
    sessionVersion: SESSION_VERSION,
    jsonSession: true,
    png: { width: CANVAS_W, height: CANVAS_H },
    finalView: true,
    mobile: { sheets: true, fab: true, pinchZoom: true, wheelZoom: true },
    memoryOnly: true,
    status: 'ready'
  });
})();


/* ===== pruebas/distribucion/phase2-p2-close.js ===== */
(() => {
  if (document.documentElement.dataset.phase2P2Close === 'ready') return;
  document.documentElement.dataset.phase2P2Close = 'ready';

  const byId = (id) => document.getElementById(id);
  const fab = byId('p2MobileFab');
  const actions = byId('p2MobileActions');
  const backdrop = byId('p2MobileBackdrop');
  const toolsPanel = document.querySelector('.tools-panel');
  const propertiesPanel = document.querySelector('.properties-panel');
  if (!fab || !actions || !backdrop || !toolsPanel || !propertiesPanel) return;

  const openPanel = () => document.querySelector('.tools-panel.p2-sheet-open,.properties-panel.p2-sheet-open');

  function clearMenuPosition() {
    actions.classList.remove('p2-menu-up', 'p2-menu-down');
    actions.style.removeProperty('top');
    actions.style.removeProperty('bottom');
  }

  function resetFabPosition() {
    fab.style.removeProperty('top');
    fab.style.bottom = 'calc(16px + env(safe-area-inset-bottom))';
    clearMenuPosition();
  }

  function positionFabAboveSheet(panel) {
    if (!panel || !panel.classList.contains('p2-sheet-open')) {
      resetFabPosition();
      return;
    }
    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      const buttonHeight = fab.offsetHeight || 56;
      const minimumTop = 72;
      const desiredBottom = Math.max(12, window.innerHeight - rect.top + 10);
      const maximumBottom = Math.max(12, window.innerHeight - minimumTop - buttonHeight);
      fab.style.top = 'auto';
      fab.style.bottom = `${Math.min(desiredBottom, maximumBottom)}px`;
      updateFabMenuDirection();
    });
  }

  function updateFabMenuDirection() {
    const rect = fab.getBoundingClientRect();
    const estimatedMenuHeight = Math.max(220, actions.scrollHeight || 0);
    const availableAbove = rect.top - 12;
    const availableBelow = window.innerHeight - rect.bottom - 12;
    const openDown = availableAbove < estimatedMenuHeight && availableBelow > availableAbove;

    clearMenuPosition();
    actions.classList.add(openDown ? 'p2-menu-down' : 'p2-menu-up');
    if (openDown) {
      actions.style.top = `${Math.max(8, rect.bottom + 10)}px`;
      actions.style.bottom = 'auto';
    } else {
      actions.style.bottom = `${Math.max(8, window.innerHeight - rect.top + 10)}px`;
      actions.style.top = 'auto';
    }
  }

  function closeMobileUi() {
    toolsPanel.classList.remove('p2-sheet-open');
    propertiesPanel.classList.remove('p2-sheet-open');
    actions.classList.remove('show');
    backdrop.classList.remove('show');
    fab.textContent = '+';
    resetFabPosition();
  }

  function syncAfterAction() {
    requestAnimationFrame(() => {
      const panel = openPanel();
      if (panel) positionFabAboveSheet(panel);
      else if (actions.classList.contains('show')) updateFabMenuDirection();
      else resetFabPosition();
    });
  }

  actions.addEventListener('click', (event) => {
    const target = event.target.closest('button,label');
    if (!target) return;
    const text = target.textContent.trim();
    if (text === 'Herramientas' || text === 'Propiedades') syncAfterAction();
    else if (text === 'Cerrar') requestAnimationFrame(resetFabPosition);
  });

  fab.addEventListener('click', syncAfterAction);
  backdrop.addEventListener('click', () => requestAnimationFrame(resetFabPosition));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!openPanel() && !actions.classList.contains('show')) return;
    event.preventDefault();
    closeMobileUi();
  });

  window.addEventListener('resize', () => {
    const panel = openPanel();
    if (panel) positionFabAboveSheet(panel);
    else if (actions.classList.contains('show')) updateFabMenuDirection();
  });

  window.MiGranDiaDistributionPhase2Close = Object.freeze({
    status: 'ready',
    escapeClosesMobileUi: true,
    dynamicFab: true,
    adaptiveMenuDirection: true,
    positionFabAboveSheet,
    updateFabMenuDirection,
    resetFabPosition,
    closeMobileUi
  });
})();


/* ===== REESTRUCTURA: contrato final de zoom =====
   El zoom solo cambia el tamaño CSS del SVG. Nunca toca escala física,
   widthM/heightM, tabletop, capacidad, sillas ni posiciones del modelo. */
(() => {
  const LOGICAL_W = 1448;
  const LOGICAL_H = 1086;
  setZoom = function distributionViewOnlyZoom(next) {
    zoom = Math.max(.65, Math.min(1.8, Number(next) || 1));
    planner.style.width = `${LOGICAL_W * zoom}px`;
    planner.style.height = `${LOGICAL_H * zoom}px`;
    planner.setAttribute('viewBox', `0 0 ${LOGICAL_W} ${LOGICAL_H}`);
    planner.style.transform = `translate3d(${viewportOffset.x}px,${viewportOffset.y}px,0)`;
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom * 100)}%`;
    return zoom;
  };
  setZoom(zoom);
})();

/* ===== REESTRUCTURA: metadata de seguridad ===== */
document.documentElement.dataset.mgdDistributionArchitecture='app-integral-aligned';
document.documentElement.dataset.mgdDistributionStorageWrites='false';
document.documentElement.dataset.mgdDistributionPhysicalScale='32';
document.documentElement.dataset.mgdDistributionCanvas='1448x1086';

document.documentElement.dataset.mgdDistributionBackgroundDrag='true';
document.documentElement.dataset.mgdDistributionViewportPan='phase2-p1-spatial-camera';
