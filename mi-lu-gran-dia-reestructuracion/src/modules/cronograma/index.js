import { weddingCapabilities } from '../../core/app/permissions.js';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js?v=2';

const STORAGE_KEY = 'planificador_bodas_cronograma_v1';
const FIELD_ALIASES = Object.freeze({
  id: ['id','eventId','eventoId','uuid'],
  title: ['title','titulo','name','nombre','activity','actividad'],
  time: ['time','hora','startTime','horaInicio'],
  duration: ['duration','duracion','durationMinutes','minutos'],
  responsible: ['responsible','responsable','owner','encargado'],
  status: ['status','estado'],
  notes: ['notes','notas','description','descripcion','observaciones'],
  order: ['order','orden','position','posicion']
});
const STATUS_LABELS = Object.freeze({ pending:'Pendiente', progress:'En progreso', completed:'Completado' });

let activeContext=null;
let state=null;
let search='';
let statusFilter='all';
let saving=false;
let pendingSave=false;
let mountEpoch=0;

const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function existingField(record,field){
  const aliases=FIELD_ALIASES[field]||[field];
  return aliases.find((key)=>Object.prototype.hasOwnProperty.call(record||{},key))||aliases[0];
}
function valueOf(record,field){
  const aliases=FIELD_ALIASES[field]||[field];
  for(const key of aliases){
    if(Object.prototype.hasOwnProperty.call(record||{},key)&&record[key]!==null&&record[key]!==undefined) return record[key];
  }
  return '';
}
function setValue(record,field,value){ record[existingField(record,field)]=value; }
function eventId(record,index){ return String(valueOf(record,'id')||`legacy-${index}`); }
function eventTitle(record){ return String(valueOf(record,'title')||'').trim(); }
function eventTime(record){ return String(valueOf(record,'time')||'').trim(); }
function eventResponsible(record){ return String(valueOf(record,'responsible')||'').trim(); }
function eventNotes(record){ return String(valueOf(record,'notes')||'').trim(); }
function eventDuration(record){
  const value=Number(valueOf(record,'duration'));
  return Number.isFinite(value)&&value>0?Math.round(value):0;
}
function eventOrder(record,index){
  const value=Number(valueOf(record,'order'));
  return Number.isFinite(value)?value:index;
}
function normalizedStatus(value){
  const raw=String(value||'').trim().toLowerCase();
  if(['completed','complete','done','completado','completada','listo','lista','finalizado','finalizada'].includes(raw)) return 'completed';
  if(['progress','in-progress','in_progress','en progreso','progreso','curso','en curso','coordinacion','coordinación'].includes(raw)) return 'progress';
  return 'pending';
}
function normalizeStored(value){
  if(value===null||value===undefined||value==='') return { root:{ settings:{}, events:[] }, events:[] };
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('La data existente de Cronograma tiene un formato no reconocido. No se modificó ni sobrescribió.');
  if(!Array.isArray(value.events)) throw new Error('La data existente de Cronograma no contiene una lista de eventos reconocible. No se modificó ni sobrescribió.');
  const root={...value,settings:value.settings&&typeof value.settings==='object'&&!Array.isArray(value.settings)?{...value.settings}:{}};
  return { root, events:value.events.map((item)=>item&&typeof item==='object'?{...item}:{}) };
}
function serializedState(){ return {...state.root,events:state.events}; }
function canEdit(){ return weddingCapabilities(activeContext?.role).canEdit; }
function formatWeddingDate(value){
  if(!value) return '—';
  const date=new Date(String(value).slice(0,10)+'T12:00:00');
  if(Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(date).replace('.','');
}
function durationLabel(minutes){
  if(!minutes) return '';
  if(minutes<60) return `${minutes} min`;
  const hours=Math.floor(minutes/60), rest=minutes%60;
  return rest?`${hours} h ${rest} min`:`${hours} h`;
}
function sortedRecords(){
  return state.events.map((record,index)=>({record,index,order:eventOrder(record,index),time:eventTime(record)}))
    .sort((a,b)=>a.order-b.order||a.time.localeCompare(b.time)||a.index-b.index);
}
function canUseTime(value){ return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||'').slice(0,5)); }

async function persist(message='Cambios guardados'){
  if(!activeContext||!canEdit()) return;
  if(saving){ pendingSave=true; return; }
  saving=true;
  const root=document.querySelector('[data-module-view="cronograma"]');
  const status=root?.querySelector('[data-timeline-state]');
  if(status) status.textContent='Guardando cambios…';
  try{
    await writePlannerStorageKey(activeContext,STORAGE_KEY,serializedState());
    if(status) status.textContent=message;
    window.dispatchEvent(new CustomEvent('migrandia:datachange',{detail:{module:'cronograma',weddingId:activeContext.id}}));
  }catch(error){
    if(status) status.textContent=error?.message||'No se pudo guardar Cronograma.';
    throw error;
  }finally{
    saving=false;
    if(pendingSave){ pendingSave=false; void persist(); }
  }
}

function cardMarkup(record,index){
  const title=eventTitle(record)||'Actividad sin título';
  const time=eventTime(record)||'—';
  const responsible=eventResponsible(record);
  const notes=eventNotes(record);
  const duration=durationLabel(eventDuration(record));
  const status=normalizedStatus(valueOf(record,'status'));
  const editable=canEdit();
  return `<article class="timeline-card is-${status}" data-timeline-index="${index}">
    <div class="timeline-time"><strong>${esc(time)}</strong><span>${esc(duration||'Hora')}</span></div>
    <div class="timeline-rail" aria-hidden="true"><i></i></div>
    <div class="timeline-card-copy">
      <div class="timeline-card-title"><h3>${esc(title)}</h3><span class="timeline-status is-${status}">${esc(STATUS_LABELS[status])}</span></div>
      ${responsible?`<p class="timeline-responsible"><span>Responsable</span> ${esc(responsible)}</p>`:''}
      ${notes?`<p class="timeline-notes">${esc(notes)}</p>`:''}
    </div>
    <button class="timeline-card-action" type="button" data-timeline-edit aria-label="${editable?'Editar':'Ver'} ${esc(title)}">${editable?'✎':'＋'}</button>
  </article>`;
}

function render(){
  const root=document.querySelector('[data-module-view="cronograma"]');
  if(!root||!state) return;
  const records=state.events;
  const counts=records.reduce((acc,record)=>{acc[normalizedStatus(valueOf(record,'status'))]+=1;return acc;},{pending:0,progress:0,completed:0});
  root.querySelector('[data-timeline-total]').textContent=String(records.length);
  root.querySelector('[data-timeline-pending]').textContent=String(counts.pending+counts.progress);
  root.querySelector('[data-timeline-completed]').textContent=String(counts.completed);
  root.querySelector('[data-timeline-wedding-date]').textContent=formatWeddingDate(state.root.settings?.weddingDate||'');
  const ordered=sortedRecords();
  const next=ordered.find(({record})=>normalizedStatus(valueOf(record,'status'))!=='completed')||ordered[0]||null;
  root.querySelector('[data-timeline-next-time]').textContent=next?eventTime(next.record)||'—':'—';
  root.querySelector('[data-timeline-next-name]').textContent=next?eventTitle(next.record)||'Actividad sin título':'Sin eventos';

  const needle=search.trim().toLocaleLowerCase('es');
  const filtered=ordered.filter(({record})=>{
    const status=normalizedStatus(valueOf(record,'status'));
    if(statusFilter!=='all'&&status!==statusFilter) return false;
    if(!needle) return true;
    return [eventTitle(record),eventResponsible(record),eventNotes(record),eventTime(record)].join(' ').toLocaleLowerCase('es').includes(needle);
  });
  root.querySelector('[data-timeline-results]').textContent=`${filtered.length} ${filtered.length===1?'actividad':'actividades'}`;
  root.querySelector('[data-timeline-list]').innerHTML=filtered.length
    ? filtered.map(({record,index})=>cardMarkup(record,index)).join('')
    : '<div class="timeline-empty"><span aria-hidden="true">◷</span><strong>No hay actividades para mostrar</strong><p>Agrega una actividad o cambia los filtros.</p></div>';
}

function field(label,control,extra=''){ return `<label class="timeline-form-field ${extra}"><span>${label}</span>${control}</label>`; }

function openDialog(record=null,index=-1){
  const root=document.querySelector('[data-module-view="cronograma"]');
  const dialog=root?.querySelector('[data-timeline-dialog]');
  if(!dialog) return;
  const editing=index>=0;
  const title=eventTitle(record||{});
  const time=eventTime(record||{});
  const duration=eventDuration(record||{});
  const responsible=eventResponsible(record||{});
  const notes=eventNotes(record||{});
  const status=normalizedStatus(valueOf(record||{},'status'));
  root.querySelector('[data-timeline-dialog-title]').textContent=editing?'Editar actividad':'Nueva actividad';
  root.querySelector('[data-timeline-dialog-body]').innerHTML=`<form id="timelineEditorForm" class="timeline-form" data-timeline-form data-index="${editing?index:''}">
    <section class="timeline-form-section"><h3>Actividad</h3>
      ${field('Nombre de la actividad',`<input name="title" required maxlength="140" value="${esc(title)}">`)}
      <div class="timeline-form-grid">
        ${field('Hora',`<input name="time" type="time" value="${esc(canUseTime(time)?time.slice(0,5):'')}">`)}
        ${field('Duración (minutos)',`<input name="duration" type="number" min="0" step="5" value="${duration||''}">`)}
        ${field('Estado',`<select name="status">${Object.entries(STATUS_LABELS).map(([value,label])=>`<option value="${value}"${status===value?' selected':''}>${label}</option>`).join('')}</select>`)}
      </div>
    </section>
    <section class="timeline-form-section"><h3>Coordinación</h3>
      ${field('Responsable',`<input name="responsible" maxlength="120" value="${esc(responsible)}" placeholder="Persona, equipo o proveedor">`)}
      ${field('Notas',`<textarea name="notes" rows="4" maxlength="900">${esc(notes)}</textarea>`)}
    </section>
  </form>`;
  root.querySelector('[data-timeline-dialog-footer]').innerHTML=(editing&&canEdit()?'<button class="timeline-delete" type="button" data-timeline-delete>Eliminar</button>':'')
    +'<span class="timeline-dialog-spacer"></span><button type="button" data-timeline-close>Cancelar</button>'
    +(canEdit()?'<button class="timeline-save" type="submit" form="timelineEditorForm">Guardar cambios</button>':'<button type="button" data-timeline-close>Cerrar</button>');
  dialog.showModal();
  if(!window.matchMedia('(max-width:760px)').matches) dialog.querySelector('input,select,textarea')?.focus();
}

function showDetails(record){
  const root=document.querySelector('[data-module-view="cronograma"]');
  const dialog=root?.querySelector('[data-timeline-dialog]');
  if(!dialog) return;
  const values=[
    ['Hora',eventTime(record)||'—'],['Duración',durationLabel(eventDuration(record))||'—'],
    ['Estado',STATUS_LABELS[normalizedStatus(valueOf(record,'status'))]],['Responsable',eventResponsible(record)||'—'],['Notas',eventNotes(record)||'—']
  ];
  root.querySelector('[data-timeline-dialog-title]').textContent=eventTitle(record)||'Actividad';
  root.querySelector('[data-timeline-dialog-body]').innerHTML=`<dl class="timeline-details">${values.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
  root.querySelector('[data-timeline-dialog-footer]').innerHTML='<span class="timeline-dialog-spacer"></span><button type="button" data-timeline-close>Cerrar</button>';
  dialog.showModal();
}

async function handleSubmit(event){
  if(!event.target.matches('[data-timeline-form]')) return;
  event.preventDefault();
  if(!canEdit()) return;
  const form=event.target;
  const data=new FormData(form);
  const index=form.dataset.index===''?-1:Number(form.dataset.index);
  const title=String(data.get('title')||'').trim();
  if(!title) return;
  const patch={
    title,
    time:String(data.get('time')||'').trim(),
    duration:Math.max(0,Number(data.get('duration'))||0),
    responsible:String(data.get('responsible')||'').trim(),
    status:normalizedStatus(data.get('status')),
    notes:String(data.get('notes')||'').trim()
  };
  if(index>=0&&state.events[index]){
    const record={...state.events[index]};
    Object.entries(patch).forEach(([field,value])=>setValue(record,field,value));
    state.events[index]=record;
  }else{
    const record={id:crypto.randomUUID()};
    Object.entries(patch).forEach(([field,value])=>setValue(record,field,value));
    setValue(record,'order',state.events.length);
    state.events.push(record);
  }
  form.closest('dialog')?.close();
  render();
  await persist(index>=0?'Actividad actualizada':'Actividad agregada');
}

function bind(root){
  if(root.dataset.timelineBound==='true') return;
  root.dataset.timelineBound='true';
  root.addEventListener('input',(event)=>{
    if(!event.target.matches('[data-timeline-search]')) return;
    search=event.target.value; render();
    const input=root.querySelector('[data-timeline-search]'); input?.focus(); input?.setSelectionRange(search.length,search.length);
  });
  root.addEventListener('change',(event)=>{
    if(!event.target.matches('[data-timeline-status-filter]')) return;
    statusFilter=event.target.value; render();
  });
  root.addEventListener('click',async(event)=>{
    if(event.target.closest('[data-timeline-close]')){ event.target.closest('dialog')?.close(); return; }
    if(event.target.closest('[data-timeline-new]')){ if(canEdit()) openDialog(); return; }
    const card=event.target.closest('[data-timeline-index]');
    if(card&&event.target.closest('[data-timeline-edit]')){
      const index=Number(card.dataset.timelineIndex),record=state.events[index];
      if(record) canEdit()?openDialog(record,index):showDetails(record);
      return;
    }
    if(event.target.closest('[data-timeline-delete]')){
      const form=root.querySelector('[data-timeline-form]');
      const index=Number(form?.dataset.index);
      if(!Number.isInteger(index)||!state.events[index]||!canEdit()) return;
      if(!window.confirm('¿Eliminar esta actividad? Esta acción no se puede deshacer.')) return;
      state.events.splice(index,1);
      root.querySelector('[data-timeline-dialog]')?.close();
      render();
      await persist('Actividad eliminada');
    }
  });
  root.addEventListener('submit',handleSubmit);
}

async function mountCronograma(context){
  const root=document.querySelector('[data-module-view="cronograma"]');
  if(!root||!context?.id) return false;
  const epoch=++mountEpoch;
  activeContext=context; pendingSave=false;
  root.innerHTML='<div class="timeline-loading">Cargando Cronograma…</div>';
  try{
    const [template,stored]=await Promise.all([
      fetch(new URL('./index.html?v=1',import.meta.url)).then((response)=>{if(!response.ok) throw new Error('No se pudo cargar la interfaz.');return response.text();}),
      readPlannerStorageKey(context,STORAGE_KEY)
    ]);
    if(epoch!==mountEpoch||activeContext?.id!==context.id) return false;
    state=normalizeStored(stored);
    root.innerHTML=template;
    search=''; statusFilter='all';
    bind(root); render();
    const editable=canEdit();
    root.querySelector('[data-timeline-new]').hidden=!editable;
    root.querySelector('[data-timeline-state]').textContent=editable?'Datos de la boda activa · edición habilitada':'Datos de la boda activa · solo lectura';
    return true;
  }catch(error){
    if(epoch!==mountEpoch) return false;
    root.innerHTML='<div class="timeline-loading">No se pudo cargar Cronograma: '+esc(error?.message||'Error de lectura')+'</div>';
    return false;
  }
}

export { mountCronograma };