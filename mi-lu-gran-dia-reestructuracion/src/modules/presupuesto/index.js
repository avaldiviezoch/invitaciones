import { weddingCapabilities } from '../../core/app/permissions.js';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';

const STORAGE_KEY='planificador_bodas_presupuesto_v5_etiquetas';
let activeContext=null,state=null,search='',mountEpoch=0,saving=false,pendingSave=null,draggedItemId='';
const fallbackTags=[{id:'tag_urgent',name:'Urgente',color:'#d9485f'},{id:'tag_wait',name:'Puede esperar',color:'#d5a72c'},{id:'tag_later',name:'No es necesario',color:'#2fa36b'}];
const CATEGORY_ICONS=[
['🏛️','Local'],['🏠','Casa'],['⛪','Iglesia'],['💒','Ceremonia'],['🌿','Jardín'],['🏖️','Playa'],['🏨','Hotel'],['📍','Ubicación'],
['💍','Anillos'],['❤️','Pareja'],['💐','Flores'],['🌹','Rosas'],['🌸','Flor'],['🌺','Arreglo floral'],['🪴','Plantas'],['🎀','Decoración'],
['✨','Detalles'],['🕯️','Velas'],['💡','Iluminación'],['🏮','Luces'],['🪞','Espejos'],['🪑','Mobiliario'],['🛋️','Sala'],['🪵','Madera'],
['🍽️','Catering'],['🍴','Menaje'],['🥂','Brindis'],['🍾','Bebidas'],['🍷','Vino'],['🍸','Bar'],['☕','Café'],['🍰','Torta'],
['🧁','Postres'],['🍬','Dulces'],['🍓','Frutas'],['🎂','Pastel'],['🎵','Música'],['🎧','DJ'],['🎤','Show'],['🎸','Banda'],
['🎻','Músicos'],['🔊','Sonido'],['📷','Fotografía'],['🎥','Video'],['📸','Cámara'],['🖼️','Recuerdos'],['👰','Novia'],['🤵','Novio'],
['👗','Vestido'],['👔','Traje'],['👠','Calzado'],['💄','Maquillaje'],['💇','Peinado'],['💅','Belleza'],['🚗','Auto'],['🚐','Transporte'],
['✈️','Viaje'],['🧳','Equipaje'],['🛏️','Alojamiento'],['🎁','Regalos'],['💌','Invitaciones'],['✉️','Papelería'],['📋','Organización'],['🗓️','Agenda'],
['💰','Presupuesto'],['💳','Pago'],['🧾','Comprobantes'],['🤝','Proveedor'],['👥','Invitados'],['🪩','Fiesta'],['🎉','Celebración'],['🎊','Hora loca'],
['🎇','Fuegos'],['🚌','Movilidad'],['🛡️','Seguridad'],['🧹','Limpieza'],['🧊','Hielo'],['🧺','Servicio'],['🛍️','Compras'],['⭐','Especial']
];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
function normalized(value){const v=value&&typeof value==='object'?value:{};return{...v,settings:{totalBudget:n(v.settings?.totalBudget),guestCount:Math.max(0,Math.floor(n(v.settings?.guestCount))),currency:['PEN','USD','EUR'].includes(v.settings?.currency)?v.settings.currency:'PEN'},categories:Array.isArray(v.categories)?v.categories:[],items:Array.isArray(v.items)?v.items:[],tags:Array.isArray(v.tags)&&v.tags.length?v.tags:fallbackTags,packages:Array.isArray(v.packages)?v.packages:[],openCategories:Array.isArray(v.openCategories)?v.openCategories:[],openPackages:Array.isArray(v.openPackages)?v.openPackages:[]}}
function money(v){return new Intl.NumberFormat('es-PE',{style:'currency',currency:state?.settings?.currency||'PEN',minimumFractionDigits:2,maximumFractionDigits:2}).format(n(v))}
function symbol(){return({PEN:'S/',USD:'$',EUR:'€'})[state?.settings?.currency]||state?.settings?.currency||'S/'}
function packageById(id){return state.packages.find(p=>String(p.id)===String(id))}function packageItems(id){return state.items.filter(i=>String(i.packageId||'')===String(id))}function totals(items=state.items){return items.reduce((a,x)=>{const pack=packageById(x.packageId);if(pack&&pack.pricingMode!=='items')return a;return{planned:a.planned+n(x.planned),quoted:a.quoted+n(x.quoted),paid:a.paid+n(x.paid),guarantee:a.guarantee+n(x.guarantee)}},{planned:0,quoted:0,paid:0,guarantee:0})}function grandTotals(){const t=totals();state.packages.filter(p=>p.pricingMode!=='items').forEach(p=>{t.planned+=n(p.planned);t.quoted+=n(p.quoted);t.paid+=n(p.paid);t.guarantee+=n(p.guarantee)});return t}
function tagById(id){return state.tags.find(t=>String(t.id)===String(id))}
function itemMeta(item){return[item.provider,item.paymentDate,({pending:'Pendiente',quoted:'Cotizado',partial:'Pago parcial',paid:'Pagado'})[item.status]].filter(Boolean).join(' · ')}function packageBalance(p){return Math.max(0,(n(p.quoted)||n(p.planned))-n(p.paid))}
const makeId=prefix=>prefix+'_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
function canEdit(){return weddingCapabilities(activeContext?.role).canEdit}
async function persist(message='Guardado en Firebase'){
 if(!activeContext||!canEdit())return;
 if(saving){pendingSave=message;return}
 saving=true;
 const root=document.querySelector('[data-module-view="presupuesto"]'),status=root?.querySelector('[data-budget-state]');
 if(status)status.textContent='Guardando en Firebase…';
 try{
  await writePlannerStorageKey(activeContext,STORAGE_KEY,state);
  if(status)status.textContent=message;
  window.dispatchEvent(new CustomEvent('migrandia:datachange',{detail:{module:'presupuesto',weddingId:activeContext.id}}));
 }catch(error){
  if(status)status.textContent=error?.message||'No se pudo guardar en Firebase.';
  throw error;
 }finally{
  saving=false;
  if(pendingSave){
   const nextMessage=pendingSave;
   pendingSave=null;
   void persist(nextMessage);
  }
 }
}
function categoryName(id){return state.categories.find(c=>String(c.id)===String(id))?.name||'—'}
function itemBalance(item){return Math.max(0,(n(item.quoted)||n(item.planned))-n(item.paid))}
function tagIds(item){return Array.isArray(item.tagIds)?item.tagIds.map(String):[]}
function moveItemToPackage(itemId,packageId){
 if(!canEdit())return false;
 const item=state.items.find(value=>String(value.id)===String(itemId));
 if(!item)return false;
 const nextPackageId=packageId?String(packageId):'';
 if(String(item.packageId||'')===nextPackageId)return false;
 if(nextPackageId&&!packageById(nextPackageId))return false;
 item.packageId=nextPackageId;
 render();
 void persist(nextPackageId?'Gasto agregado al paquete':'Gasto retirado del paquete');
 return true;
}
function openPackageChooser(item){
 if(!canEdit()||!item)return;
 const root=document.querySelector('[data-module-view="presupuesto"]'),dialog=root?.querySelector('[data-budget-dialog]');
 if(!dialog)return;
 root.querySelector('[data-budget-dialog-title]').textContent='Agrupar gasto';
 const body=root.querySelector('[data-budget-dialog-body]');
 const current=String(item.packageId||'');
 body.innerHTML='<div class="budget-package-chooser"><p>Elige el paquete para <strong>'+esc(item.name||'este gasto')+'</strong>.</p>'+(state.packages.length?'<div>'+state.packages.map(pack=>'<button type="button" data-budget-choose-package="'+esc(pack.id)+'" class="'+(String(pack.id)===current?'is-current':'')+'"><span><b>'+esc(pack.name||'Paquete')+'</b><small>'+esc(pack.provider||'Sin proveedor')+'</small></span><strong>'+(String(pack.id)===current?'Actual':'Mover aquí')+'</strong></button>').join('')+(current?'<button type="button" data-budget-choose-package="" class="budget-package-remove-choice"><span><b>Sin paquete</b><small>Dejar el gasto independiente</small></span><strong>Retirar</strong></button>':'')+'</div>':'<div class="budget-package-chooser-empty"><strong>No hay paquetes creados.</strong><span>Crea el primero y luego podrás agrupar este gasto.</span><button type="button" data-budget-create-package-from-chooser>＋ Crear paquete</button></div>')+'</div>';
 root.querySelector('[data-budget-dialog-footer]').innerHTML='<button type="button" data-budget-close>Cerrar</button>';
 dialog.showModal();
}
function formField(label,control){return '<label class="budget-form-field"><span>'+label+'</span>'+control+'</label>'}
function categoryIconPicker(current){
 const selected=String(current||'•');
 return '<div class="budget-icon-picker"><input type="hidden" name="icon" value="'+esc(selected)+'"><div class="budget-icon-current"><span data-budget-icon-preview>'+esc(selected)+'</span><div><strong>Icono de la categoría</strong><small>Elige uno de la biblioteca.</small></div></div><div class="budget-icon-grid" role="list" aria-label="Biblioteca de iconos">'+CATEGORY_ICONS.map(([icon,label])=>'<button type="button" data-budget-category-icon="'+esc(icon)+'" class="'+(icon===selected?'is-selected':'')+'" title="'+esc(label)+'" aria-label="'+esc(label)+'"><span>'+esc(icon)+'</span><small>'+esc(label)+'</small></button>').join('')+'</div></div>';
}
function openEditor(kind,payload={}){if(!canEdit())return;const root=document.querySelector('[data-module-view="presupuesto"]'),dialog=root?.querySelector('[data-budget-dialog]');if(!dialog)return;const title=root.querySelector('[data-budget-dialog-title]'),body=root.querySelector('[data-budget-dialog-body]'),footer=root.querySelector('[data-budget-dialog-footer]');let html='';
 if(kind==='item'){const item=payload.item||{},categoryId=payload.categoryId||item.categoryId||state.categories[0]?.id||'';title.textContent=item.id?'Editar gasto':'Nuevo gasto';html='<form data-budget-edit-form data-kind="item" data-id="'+esc(item.id||'')+'">'+formField('Gasto','<input name="name" required maxlength="140" value="'+esc(item.name||'')+'">')+'<div class="budget-form-grid">'+formField('Categoría','<select name="categoryId">'+state.categories.map(cat=>'<option value="'+esc(cat.id)+'"'+(String(cat.id)===String(categoryId)?' selected':'')+'>'+esc(cat.name||'Categoría')+'</option>').join('')+'</select>')+formField('Estado','<select name="status">'+[['pending','Pendiente'],['quoted','Cotizado'],['partial','Pago parcial'],['paid','Pagado']].map(([v,l])=>'<option value="'+v+'"'+((item.status||'pending')===v?' selected':'')+'>'+l+'</option>').join('')+'</select>')+'</div><div class="budget-form-grid">'+formField('Presupuestado','<input name="planned" type="number" min="0" step="0.01" value="'+n(item.planned)+'">')+formField('Cotizado','<input name="quoted" type="number" min="0" step="0.01" value="'+n(item.quoted)+'">')+'</div><div class="budget-form-grid">'+formField('Pagado','<input name="paid" type="number" min="0" step="0.01" value="'+n(item.paid)+'">')+formField('Garantía','<input name="guarantee" type="number" min="0" step="0.01" value="'+n(item.guarantee)+'">')+'</div><div class="budget-form-grid">'+formField('Proveedor','<input name="provider" maxlength="140" value="'+esc(item.provider||'')+'">')+formField('Fecha de pago','<input name="paymentDate" type="date" value="'+esc(item.paymentDate||'')+'">')+'</div>'+formField('Etiquetas','<div class="budget-tag-picker">'+state.tags.map(tag=>'<label style="--tag:'+esc(tag.color||'#777')+'"><input type="checkbox" name="tagIds" value="'+esc(tag.id)+'"'+(tagIds(item).includes(String(tag.id))?' checked':'')+'><i></i><span>'+esc(tag.name||'Etiqueta')+'</span></label>').join('')+'</div>')+formField('Notas','<textarea name="notes" rows="3" maxlength="700">'+esc(item.notes||'')+'</textarea>')+'</form>'}
 else if(kind==='category'){const cat=payload.category||{};title.textContent=cat.id?'Editar categoría':'Nueva categoría';html='<form data-budget-edit-form data-kind="category" data-id="'+esc(cat.id||'')+'">'+formField('Nombre','<input name="name" required maxlength="80" value="'+esc(cat.name||'')+'">')+formField('Descripción','<input name="description" maxlength="180" value="'+esc(cat.description||'')+'">')+'<div class="budget-form-field"><span>Icono</span>'+categoryIconPicker(cat.icon||'•')+'</div></form>'}
 else if(kind==='tag'){const tag=payload.tag||{};title.textContent=tag.id?'Editar etiqueta':'Nueva etiqueta';html='<form data-budget-edit-form data-kind="tag" data-id="'+esc(tag.id||'')+'">'+formField('Nombre','<input name="name" required maxlength="50" value="'+esc(tag.name||'')+'">')+formField('Color','<input name="color" type="color" value="'+esc(/^#[0-9a-f]{6}$/i.test(tag.color||'')?tag.color:'#7f8962')+'">')+'</form>'}
 else if(kind==='package'){const pack=payload.package||{},members=new Set(packageItems(pack.id).map(i=>String(i.id)));title.textContent=pack.id?'Editar paquete':'Nuevo paquete';html='<form data-budget-edit-form data-kind="package" data-id="'+esc(pack.id||'')+'">'+formField('Nombre del paquete','<input name="name" required maxlength="100" placeholder="Ej. Paquete Integral" value="'+esc(pack.name||'')+'">')+'<div class="budget-form-grid">'+formField('Empresa / proveedor','<input name="provider" maxlength="140" value="'+esc(pack.provider||'')+'">')+formField('Forma de cálculo','<select name="pricingMode"><option value="package"'+((pack.pricingMode||'package')==='package'?' selected':'')+'>Precio por todo el paquete</option><option value="items"'+(pack.pricingMode==='items'?' selected':'')+'>Sumar precios individuales</option></select>')+'</div><div class="budget-form-grid">'+formField('Presupuestado del paquete','<input name="planned" type="number" min="0" step="0.01" value="'+n(pack.planned)+'">')+formField('Cotizado / contratado','<input name="quoted" type="number" min="0" step="0.01" value="'+n(pack.quoted)+'">')+'</div><div class="budget-form-grid">'+formField('Pagado','<input name="paid" type="number" min="0" step="0.01" value="'+n(pack.paid)+'">')+formField('Garantía','<input name="guarantee" type="number" min="0" step="0.01" value="'+n(pack.guarantee)+'">')+'</div>'+'<section class="budget-package-concepts"><header><div><span class="budget-package-concepts-icon">☷</span><span><b>Conceptos incluidos</b><small>Selecciona los conceptos que formarán parte de este paquete.</small></span></div><strong data-package-selected-count>'+members.size+' seleccionados</strong></header><div class="budget-package-picker">'+state.items.filter(i=>!i.packageId||String(i.packageId)===String(pack.id)).map(i=>'<label><input type="checkbox" name="itemIds" value="'+esc(i.id)+'"'+(members.has(String(i.id))?' checked':'')+'><span class="budget-package-check"></span><span class="budget-package-concept-copy"><b>'+esc(i.name||'Gasto')+'</b><small>'+esc(categoryName(i.categoryId))+'</small></span><strong>'+money(n(i.quoted)||n(i.planned))+'</strong></label>').join('')+'</div></section>'+formField('Notas','<textarea name="notes" rows="3" maxlength="700">'+esc(pack.notes||'')+'</textarea>')+'</form>'} body.innerHTML=html;footer.innerHTML='<button type="button" data-budget-close>Cancelar</button><button class="budget-save" type="submit" form="'+(body.querySelector('form')?.id||'')+'" data-budget-save>Guardar cambios</button>';const form=body.querySelector('form');if(form){form.id='budgetEditorForm';footer.querySelector('[data-budget-save]').setAttribute('form','budgetEditorForm')}if(kind==='package'){const count=()=>{const target=body.querySelector('[data-package-selected-count]');if(target)target.textContent=body.querySelectorAll('input[name="itemIds"]:checked').length+' seleccionados'};body.querySelector('.budget-package-picker')?.addEventListener('change',count)}dialog.showModal();form?.querySelector('input,select,textarea')?.focus()}

function render(){
 const root=document.querySelector('[data-module-view="presupuesto"]');if(!root||!state)return;
 const t=grandTotals(),budget=n(state.settings.totalBudget),available=Math.max(0,budget-t.paid),pct=budget?Math.min(100,Math.round(t.paid*100/budget)):0,guests=n(state.settings.guestCount);
 root.querySelector('[data-budget-available]').textContent=money(available);root.querySelector('[data-budget-symbol]').textContent=symbol();root.querySelector('[data-budget-total]').textContent=money(budget).replace(symbol(),'').trim();const currencyControl=root.querySelector('[data-budget-currency]'),guestControl=root.querySelector('[data-budget-guests]');currencyControl.value=state.settings.currency;guestControl.value=String(guests);currencyControl.disabled=!canEdit();guestControl.disabled=!canEdit();root.querySelector('[data-budget-progress]').style.width=pct+'%';root.querySelector('[data-budget-progress-text]').textContent=pct+'% del presupuesto pagado';root.querySelector('[data-budget-per-guest]').textContent=guests?money(budget/guests)+' por invitado':'Sin invitados definidos';
 [['planned',t.planned],['quoted',t.quoted],['paid',t.paid],['guarantee',t.guarantee]].forEach(([k,v])=>root.querySelector('[data-budget-'+k+']').textContent=money(v));
 root.querySelector('[data-budget-planned-note]').textContent=budget?money(Math.max(0,budget-t.planned))+' sin asignar':'Sin presupuesto definido';root.querySelector('[data-budget-quoted-note]').textContent=t.quoted?'Cotizaciones registradas':'Sin cotizaciones';root.querySelector('[data-budget-paid-note]').textContent=t.paid?'Pagos registrados':'Sin adelantos registrados';root.querySelector('[data-budget-guarantee-note]').textContent=t.guarantee?'Garantías registradas':'Sin garantías registradas';root.querySelector('[data-budget-analysis]').textContent=budget?(t.paid>budget?'Los pagos registrados superan el presupuesto total.':money(available)+' disponibles después de los pagos registrados.'):'Define el presupuesto total y registra los gastos para ver el análisis.';
 const packageHost=root.querySelector('[data-budget-packages]');if(packageHost){const opened=new Set(state.openPackages.map(String));packageHost.innerHTML=state.packages.length?state.packages.map(pack=>{const members=packageItems(pack.id),isOpen=opened.has(String(pack.id)),pt=pack.pricingMode==='items'?totals(members):{planned:n(pack.planned),quoted:n(pack.quoted),paid:n(pack.paid),guarantee:n(pack.guarantee)};return '<article class="budget-package'+(isOpen?' open':'')+'" data-package-id="'+esc(pack.id)+'" data-budget-package-dropzone><header data-budget-package-toggle><div><span>PAQUETE · '+esc(pack.pricingMode==='items'?'SUMA INDIVIDUAL':'PRECIO GLOBAL')+'</span><h3>'+esc(pack.name||'Paquete')+'</h3><p>'+esc(pack.provider||'Sin proveedor')+' · '+members.length+' conceptos</p></div><div class="budget-package-money"><strong>'+money(pt.quoted||pt.planned)+'</strong><small>'+money(pt.paid)+' pagado</small></div><div class="budget-package-actions">'+(canEdit()?'<button type="button" data-budget-edit-package>Editar</button>':'')+'<button type="button" class="budget-chevron">'+(isOpen?'⌃':'⌄')+'</button></div></header>'+(canEdit()?'<div class="budget-package-drop-hint"><span aria-hidden="true">⋮⋮</span><strong>Arrastra gastos aquí</strong><small>O usa “Agrupar” desde cada gasto.</small></div>':'')+'<div class="budget-package-body">'+(members.length?members.map(i=>'<div class="budget-package-child" data-item-id="'+esc(i.id)+'"><span>↳</span><div><b>'+esc(i.name||'Gasto')+'</b><small>'+esc(categoryName(i.categoryId))+'</small></div><strong>'+money(i.quoted||i.planned)+'</strong>'+(canEdit()?'<button type="button" data-budget-unpack-item aria-label="Quitar del paquete">×</button>':'')+'</div>').join(''):'<p class="budget-empty">Este paquete todavía no tiene conceptos agrupados.</p>')+'</div></article>'}).join(''):'<div class="budget-package-empty"><span class="budget-package-empty-icon" aria-hidden="true">▱</span><div><strong>Aún no tienes paquetes</strong><p>Crea uno para reunir conceptos como local, decoración, mobiliario u otros servicios de un mismo proveedor.</p></div>'+(canEdit()?'<button type="button" data-budget-new-package>＋ Crear primer paquete</button>':'')+'</div>'} root.querySelector('[data-budget-tags]').innerHTML=state.tags.map(tag=>{const count=state.items.filter(i=>tagIds(i).includes(String(tag.id))).length;return '<button type="button" class="budget-tag" data-budget-edit-tag data-tag-id="'+esc(tag.id)+'" style="--tag:'+esc(tag.color||'#777')+'"><span><i></i>'+esc(tag.name||'Etiqueta')+'</span><b>'+count+'</b></button>'}).join('');
 const needle=search.toLocaleLowerCase('es');const open=new Set(state.openCategories.map(String));
 root.querySelector('[data-budget-categories]').innerHTML=state.categories.map(cat=>{const all=state.items.filter(i=>String(i.categoryId)===String(cat.id));const items=all.filter(i=>!needle||[cat.name,i.name,i.provider,i.notes].join(' ').toLocaleLowerCase('es').includes(needle));if(needle&&!items.length&&!String(cat.name||'').toLocaleLowerCase('es').includes(needle))return'';const ct=totals(all),isOpen=open.has(String(cat.id))||Boolean(needle);return '<article class="budget-category'+(isOpen?' open':'')+'" data-category-id="'+esc(cat.id)+'"><header data-budget-toggle><div class="budget-category-title"><span class="budget-category-icon">'+esc(cat.icon||'•')+'</span><div><h3>'+esc(cat.name||'Categoría')+'</h3><p>'+esc(cat.description||'')+'</p></div></div><div class="budget-category-actions">'+(canEdit()?'<button type="button" data-budget-edit-category>Editar</button><button type="button" data-budget-add-item>＋ Gasto</button>':'')+'<button class="budget-chevron" type="button">'+(isOpen?'⌃':'⌄')+'</button></div></header><div class="budget-category-summary"><div><span>Presupuestado</span><strong>'+money(ct.planned)+'</strong></div><div><span>Cotizado</span><strong>'+money(ct.quoted)+'</strong></div><div><span>Pagado</span><strong>'+money(ct.paid)+'</strong></div></div><div class="budget-category-body"><div class="budget-item-list">'+(items.length?items.map(item=>itemMarkup(item)).join(''):'<div class="budget-empty">Sin gastos en esta categoría.</div>')+'</div></div></article>'}).join('')||'<div class="budget-empty">No hay resultados.</div>';
}
function itemMarkup(item){const tags=tagIds(item).map(tagById).filter(Boolean);const balance=itemBalance(item),editable=canEdit();return '<div class="budget-item" data-item-id="'+esc(item.id)+'"'+(editable?' draggable="true" data-budget-draggable-item':'')+'><div class="budget-item-main"><strong>'+esc(item.name||'Gasto')+'</strong><small>'+esc(itemMeta(item))+'</small><div class="budget-item-tags">'+tags.map(t=>'<span class="budget-item-tag" style="--tag:'+esc(t.color||'#777')+'">'+esc(t.name)+'</span>').join('')+'</div></div>'+[['Presup.',item.planned],['Cotizado',item.quoted],['Pagado',item.paid],['Saldo',balance]].map(([l,v])=>'<div class="budget-item-value"><span>'+l+'</span><strong>'+money(v)+'</strong></div>').join('')+'<div class="budget-item-actions">'+(editable?'<span class="budget-item-drag" aria-hidden="true" title="Arrastrar">⋮⋮</span><button class="budget-item-group" type="button" data-budget-group-item>Agrupar</button>':'')+'<button class="budget-item-action" type="button" data-budget-view-item aria-label="'+(editable?'Editar gasto':'Ver gasto')+'">'+(editable?'✎':'＋')+'</button></div></div>'}
function showDetails(item){const root=document.querySelector('[data-module-view="presupuesto"]'),dialog=root.querySelector('[data-budget-dialog]');root.querySelector('[data-budget-dialog-title]').textContent=item.name||'Gasto';root.querySelector('[data-budget-dialog-body]').innerHTML='<dl>'+[['Categoría',categoryName(item.categoryId)],['Presupuestado',money(item.planned)],['Cotizado',money(item.quoted)],['Pagado',money(item.paid)],['Saldo',money(itemBalance(item))],['Garantía',money(item.guarantee)],['Proveedor',item.provider||'—'],['Fecha de pago',item.paymentDate||'—'],['Estado',item.status||'pending'],['Notas',item.notes||'—']].map(([a,b])=>'<div><dt>'+esc(a)+'</dt><dd>'+esc(b)+'</dd></div>').join('')+'</dl>';root.querySelector('[data-budget-dialog-footer]').innerHTML='<button type="button" data-budget-close>Cerrar</button>';dialog.showModal()}
async function handleSubmit(event){if(!event.target.matches('[data-budget-edit-form]'))return;event.preventDefault();if(!canEdit())return;const form=event.target,data=new FormData(form),kind=form.dataset.kind,id=form.dataset.id;
 if(kind==='item'){const patch={name:String(data.get('name')||'').trim(),categoryId:String(data.get('categoryId')||''),status:String(data.get('status')||'pending'),planned:n(data.get('planned')),quoted:n(data.get('quoted')),paid:n(data.get('paid')),guarantee:n(data.get('guarantee')),provider:String(data.get('provider')||'').trim(),paymentDate:String(data.get('paymentDate')||''),tagIds:data.getAll('tagIds').map(String),notes:String(data.get('notes')||'').trim()};if(!patch.name)return;const index=state.items.findIndex(x=>String(x.id)===String(id));if(index>=0)state.items[index]={...state.items[index],...patch};else state.items.push({id:makeId('item'),...patch});}
 if(kind==='category'){const patch={name:String(data.get('name')||'').trim(),description:String(data.get('description')||'').trim(),icon:String(data.get('icon')||'•').trim()||'•'};if(!patch.name)return;const index=state.categories.findIndex(x=>String(x.id)===String(id));if(index>=0)state.categories[index]={...state.categories[index],...patch};else state.categories.push({id:makeId('cat'),...patch});}
 if(kind==='package'){const patch={name:String(data.get('name')||'').trim(),provider:String(data.get('provider')||'').trim(),pricingMode:String(data.get('pricingMode')||'package'),planned:n(data.get('planned')),quoted:n(data.get('quoted')),paid:n(data.get('paid')),guarantee:n(data.get('guarantee')),notes:String(data.get('notes')||'').trim()};if(!patch.name)return;let packageId=id,index=state.packages.findIndex(x=>String(x.id)===String(id));if(index>=0)state.packages[index]={...state.packages[index],...patch};else{packageId=makeId('pack');state.packages.push({id:packageId,...patch})}const selected=new Set(data.getAll('itemIds').map(String));state.items=state.items.map(item=>String(item.packageId||'')===String(packageId)||selected.has(String(item.id))?{...item,packageId:selected.has(String(item.id))?packageId:''}:item)}
 if(kind==='tag'){const patch={name:String(data.get('name')||'').trim(),color:String(data.get('color')||'#7f8962')};if(!patch.name)return;const index=state.tags.findIndex(x=>String(x.id)===String(id));if(index>=0)state.tags[index]={...state.tags[index],...patch};else state.tags.push({id:makeId('tag'),...patch});}
 form.closest('dialog')?.close();render();await persist(kind==='item'?'Gasto guardado':kind==='category'?'Categoría guardada':kind==='package'?'Paquete guardado':'Etiqueta guardada')}
function bind(root){
 if(root.dataset.budgetBound)return;
 root.dataset.budgetBound='true';
 root.addEventListener('submit',handleSubmit);
 root.addEventListener('dragstart',e=>{
  const row=e.target.closest('[data-budget-draggable-item]');
  if(!row||!canEdit())return;
  draggedItemId=String(row.dataset.itemId||'');
  row.classList.add('is-dragging');
  if(e.dataTransfer){
   e.dataTransfer.effectAllowed='move';
   e.dataTransfer.setData('text/plain',draggedItemId);
  }
 });
 root.addEventListener('dragend',e=>{
  e.target.closest('[data-budget-draggable-item]')?.classList.remove('is-dragging');
  root.querySelectorAll('.budget-package.is-drop-target').forEach(node=>node.classList.remove('is-drop-target'));
  draggedItemId='';
 });
 root.addEventListener('dragover',e=>{
  const target=e.target.closest('[data-budget-package-dropzone]');
  if(!target||!draggedItemId||!canEdit())return;
  e.preventDefault();
  if(e.dataTransfer)e.dataTransfer.dropEffect='move';
  root.querySelectorAll('.budget-package.is-drop-target').forEach(node=>{if(node!==target)node.classList.remove('is-drop-target')});
  target.classList.add('is-drop-target');
 });
 root.addEventListener('dragleave',e=>{
  const target=e.target.closest('[data-budget-package-dropzone]');
  if(target&&!target.contains(e.relatedTarget))target.classList.remove('is-drop-target');
 });
 root.addEventListener('drop',e=>{
  const target=e.target.closest('[data-budget-package-dropzone]');
  if(!target||!canEdit())return;
  e.preventDefault();
  const itemId=draggedItemId||e.dataTransfer?.getData('text/plain')||'';
  target.classList.remove('is-drop-target');
  if(itemId)moveItemToPackage(itemId,target.dataset.packageId);
  draggedItemId='';
 });
 root.addEventListener('input',e=>{
  if(e.target.matches('[data-budget-search]')){
   search=e.target.value;
   render();
   const input=root.querySelector('[data-budget-search]');
   input.focus();
   input.setSelectionRange(search.length,search.length);
   return;
  }
  if(e.target.matches('[data-budget-guests]')){
   state.settings.guestCount=Math.max(0,Math.floor(n(e.target.value)));
   render();
  }
 });
 root.addEventListener('change',e=>{
  if(e.target.matches('[data-budget-guests]')){
   state.settings.guestCount=Math.max(0,Math.floor(n(e.target.value)));
   render();
   void persist('Número de invitados actualizado');
   return;
  }
  if(e.target.matches('[data-budget-currency]')){
   state.settings.currency=['PEN','USD','EUR'].includes(e.target.value)?e.target.value:'PEN';
   render();
   void persist('Moneda actualizada');
  }
 });
 root.addEventListener('click',e=>{if(e.target.closest('[data-budget-close]')){root.querySelector('[data-budget-dialog]')?.close();return}
 const iconChoice=e.target.closest('[data-budget-category-icon]');
 if(iconChoice){
  const picker=iconChoice.closest('.budget-icon-picker'),input=picker?.querySelector('input[name="icon"]'),preview=picker?.querySelector('[data-budget-icon-preview]');
  if(input&&preview){
   input.value=iconChoice.dataset.budgetCategoryIcon||'•';
   preview.textContent=input.value;
   picker.querySelectorAll('[data-budget-category-icon]').forEach(button=>button.classList.toggle('is-selected',button===iconChoice));
  }
  return;
 }
 const createPackageFromChooser=e.target.closest('[data-budget-create-package-from-chooser]');
 if(createPackageFromChooser){
  const dialog=root.querySelector('[data-budget-dialog]');
  if(dialog){delete dialog.dataset.groupItemId;dialog.close()}
  openEditor('package');
  return;
 }
 const packageChoice=e.target.closest('[data-budget-choose-package]');
 if(packageChoice){
  const dialog=root.querySelector('[data-budget-dialog]'),itemId=dialog?.dataset.groupItemId||'';
  if(itemId)moveItemToPackage(itemId,packageChoice.dataset.budgetChoosePackage);
  if(dialog){delete dialog.dataset.groupItemId;dialog.close()}
  return;
 }
 const packageCard=e.target.closest('[data-package-id]');if(packageCard&&e.target.closest('[data-budget-edit-package]')){const pack=packageById(packageCard.dataset.packageId);if(pack)openEditor('package',{package:pack});return}if(packageCard&&e.target.closest('[data-budget-package-toggle]')){const id=packageCard.dataset.packageId,list=new Set(state.openPackages.map(String));list.has(id)?list.delete(id):list.add(id);state.openPackages=[...list];render();return}if(packageCard&&e.target.closest('[data-budget-unpack-item]')){const child=e.target.closest('[data-item-id]');if(child)moveItemToPackage(child.dataset.itemId,'');return}if(e.target.closest('[data-budget-new-package]')){openEditor('package');return}
 const row=e.target.closest('[data-item-id]');
 if(row&&e.target.closest('[data-budget-group-item]')){
  const item=state.items.find(i=>String(i.id)===row.dataset.itemId);
  if(item){
   const dialog=root.querySelector('[data-budget-dialog]');
   if(dialog)dialog.dataset.groupItemId=String(item.id);
   openPackageChooser(item);
  }
  return;
 }
 if(row&&e.target.closest('[data-budget-view-item]')){const item=state.items.find(i=>String(i.id)===row.dataset.itemId);if(item)(canEdit()?openEditor('item',{item}):showDetails(item));return}
 const tag=e.target.closest('[data-budget-edit-tag]');if(tag){const value=state.tags.find(t=>String(t.id)===String(tag.dataset.tagId));if(value)openEditor('tag',{tag:value});return}
 const card=e.target.closest('[data-category-id]');if(card&&e.target.closest('[data-budget-edit-category]')){const cat=state.categories.find(x=>String(x.id)===String(card.dataset.categoryId));if(cat)openEditor('category',{category:cat});return}
 if(card&&e.target.closest('[data-budget-add-item]')){openEditor('item',{categoryId:card.dataset.categoryId});return}
 if(card&&e.target.closest('[data-budget-toggle]')){const id=card.dataset.categoryId,list=new Set(state.openCategories.map(String));list.has(id)?list.delete(id):list.add(id);state.openCategories=[...list];render();return}
 if(e.target.closest('[data-budget-new-item]')){openEditor('item');return}if(e.target.closest('[data-budget-new-category]')){openEditor('category');return}if(e.target.closest('[data-budget-new-tag]')){openEditor('tag');return}
 if(e.target.closest('[data-budget-export]')){const rows=[['Categoría','Gasto','Presupuestado','Cotizado','Pagado','Garantía','Proveedor','Estado']];state.items.forEach(i=>rows.push([categoryName(i.categoryId),i.name,n(i.planned),n(i.quoted),n(i.paid),n(i.guarantee),i.provider||'',i.status||'']));const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='presupuesto-boda.csv';a.click();URL.revokeObjectURL(url)}})}
async function mountPresupuesto(context){const root=document.querySelector('[data-module-view="presupuesto"]');if(!root||!context?.id)return;const epoch=++mountEpoch;activeContext=context;pendingSave=null;root.innerHTML='<div class="budget-empty">Cargando Presupuesto desde Firebase…</div>';try{const [template,stored]=await Promise.all([fetch(new URL('./index.html?v=6',import.meta.url)).then(r=>{if(!r.ok)throw new Error('No se pudo cargar la interfaz.');return r.text()}),readPlannerStorageKey(context,STORAGE_KEY)]);if(epoch!==mountEpoch||activeContext?.id!==context.id)return;root.innerHTML=template;state=normalized(stored);search='';bind(root);render();const editable=weddingCapabilities(context.role).canEdit;root.querySelector('[data-budget-state]').textContent=editable?'Datos de la boda activa · edición habilitada':'Datos reales de Firebase · solo lectura';}catch(error){if(epoch!==mountEpoch)return;root.innerHTML='<div class="budget-empty">No se pudo cargar el Presupuesto: '+esc(error?.message||'Error de lectura')+'</div>'}}
export{mountPresupuesto};