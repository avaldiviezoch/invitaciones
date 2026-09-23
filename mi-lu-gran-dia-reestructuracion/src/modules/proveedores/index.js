import { weddingCapabilities } from '../../core/app/permissions.js';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';

const STORAGE_KEY = 'planificador_bodas_proveedores_v1';

const FIELD_ALIASES = Object.freeze({
  id: ['id','providerId','proveedorId','uuid'],
  name: ['name','nombre','empresa','proveedor'],
  service: ['service','servicio','category','categoria','rubro'],
  contact: ['contact','contacto','contactName','nombreContacto','personaContacto'],
  phone: ['phone','telefono','tel','celular','whatsapp'],
  email: ['email','correo','mail'],
  website: ['website','web','url','instagram'],
  quote: ['quote','quoted','cotizacion','cotizado','montoCotizado'],
  contracted: ['contracted','contractAmount','contrato','contratado','montoContrato'],
  paid: ['paid','pagado','montoPagado'],
  status: ['status','estado'],
  notes: ['notes','notas','observaciones']
});

const STATUS_LABELS = Object.freeze({
  pending: 'Pendiente',
  quoting: 'Cotizando',
  contracted: 'Contratado',
  completed: 'Completado',
  discarded: 'Descartado'
});

let activeContext = null;
let state = null;
let search = '';
let statusFilter = 'all';
let mountEpoch = 0;
let saving = false;
let pendingSave = false;

const esc = (value) => String(value ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function existingField(record, field) {
  const aliases = FIELD_ALIASES[field] || [field];
  return aliases.find((key) => Object.prototype.hasOwnProperty.call(record || {}, key)) || aliases[0];
}

function valueOf(record, field) {
  if (!record || typeof record !== 'object') return '';
  const aliases = FIELD_ALIASES[field] || [field];
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(record, key) && record[key] !== null && record[key] !== undefined) return record[key];
  }
  return '';
}

function setValue(record, field, value) {
  const key = existingField(record, field);
  record[key] = value;
}

function recordId(record, index) {
  return String(valueOf(record, 'id') || `legacy-${index}`);
}

function normalizedStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['cotizando','cotizacion','cotización','quoted','quoting'].includes(raw)) return 'quoting';
  if (['contratado','contratada','contracted','contrato'].includes(raw)) return 'contracted';
  if (['completado','completada','pagado','pagada','completed','paid'].includes(raw)) return 'completed';
  if (['descartado','descartada','cancelado','cancelada','discarded','cancelled'].includes(raw)) return 'discarded';
  return 'pending';
}

function paidValue(record) {
  const direct = numeric(valueOf(record, 'paid'));
  if (direct) return direct;
  if (Array.isArray(record?.payments)) {
    return record.payments.reduce((sum, payment) => sum + numeric(
      payment?.amount ?? payment?.monto ?? payment?.value ?? payment?.importe
    ), 0);
  }
  if (Array.isArray(record?.pagos)) {
    return record.pagos.reduce((sum, payment) => sum + numeric(
      payment?.amount ?? payment?.monto ?? payment?.value ?? payment?.importe
    ), 0);
  }
  return 0;
}

function normalizeStored(value) {
  if (Array.isArray(value)) return { mode: 'array', containerKey: '', root: null, records: value.map(item => item && typeof item === 'object' ? { ...item } : {}) };
  if (value && typeof value === 'object') {
    const key = ['providers','proveedores','items','vendors'].find(candidate => Array.isArray(value[candidate]));
    if (key) return {
      mode: 'object',
      containerKey: key,
      root: { ...value },
      records: value[key].map(item => item && typeof item === 'object' ? { ...item } : {})
    };
  }
  return { mode: 'array', containerKey: '', root: null, records: [] };
}

function serializedState() {
  if (state.mode === 'object') return { ...state.root, [state.containerKey]: state.records };
  return state.records;
}

function canEdit() {
  return weddingCapabilities(activeContext?.role).canEdit;
}

async function persist(message = 'Cambios guardados') {
  if (!activeContext || !canEdit()) return;
  if (saving) {
    pendingSave = true;
    return;
  }
  saving = true;
  const root = document.querySelector('[data-module-view="proveedores"]');
  const status = root?.querySelector('[data-provider-state]');
  if (status) status.textContent = 'Guardando en Firebase…';
  try {
    await writePlannerStorageKey(activeContext, STORAGE_KEY, serializedState());
    if (status) status.textContent = message;
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: { module: 'proveedores', weddingId: activeContext.id }
    }));
  } catch (error) {
    if (status) status.textContent = error?.message || 'No se pudo guardar en Firebase.';
    throw error;
  } finally {
    saving = false;
    if (pendingSave) {
      pendingSave = false;
      void persist();
    }
  }
}

function money(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric(value));
}

function providerValues(record) {
  const payments = paidValue(record);
  return {
    name: String(valueOf(record, 'name') || '').trim(),
    service: String(valueOf(record, 'service') || '').trim(),
    contact: String(valueOf(record, 'contact') || '').trim(),
    phone: String(valueOf(record, 'phone') || '').trim(),
    email: String(valueOf(record, 'email') || '').trim(),
    website: String(valueOf(record, 'website') || '').trim(),
    quote: numeric(valueOf(record, 'quote')),
    contracted: numeric(valueOf(record, 'contracted')),
    paid: payments,
    status: normalizedStatus(valueOf(record, 'status')),
    notes: String(valueOf(record, 'notes') || '').trim()
  };
}

function providerMarkup(record, index) {
  const values = providerValues(record);
  const balance = Math.max(0, (values.contracted || values.quote) - values.paid);
  const contact = [values.contact, values.phone, values.email].filter(Boolean).join(' · ');
  const editable = canEdit();
  return `<article class="provider-card" data-provider-index="${index}">
    <div class="provider-card-main">
      <span class="provider-card-icon" aria-hidden="true">▦</span>
      <div>
        <div class="provider-card-title"><h3>${esc(values.name || 'Proveedor sin nombre')}</h3><span class="provider-status is-${esc(values.status)}">${esc(STATUS_LABELS[values.status])}</span></div>
        <p>${esc(values.service || 'Servicio sin definir')}</p>
        <small>${esc(contact || 'Sin datos de contacto')}</small>
      </div>
    </div>
    <div class="provider-card-money"><span>Cotizado</span><strong>${money(values.quote)}</strong></div>
    <div class="provider-card-money"><span>Contratado</span><strong>${money(values.contracted)}</strong></div>
    <div class="provider-card-money"><span>Pagado</span><strong>${money(values.paid)}</strong></div>
    <div class="provider-card-money"><span>Saldo</span><strong>${money(balance)}</strong></div>
    <button class="provider-card-action" type="button" data-provider-edit aria-label="${editable ? 'Editar proveedor' : 'Ver proveedor'}">${editable ? '✎' : '＋'}</button>
  </article>`;
}

function render() {
  const root = document.querySelector('[data-module-view="proveedores"]');
  if (!root || !state) return;

  const records = state.records;
  const totals = records.reduce((acc, record) => {
    const values = providerValues(record);
    acc.paid += values.paid;
    acc[values.status] = (acc[values.status] || 0) + 1;
    return acc;
  }, { paid: 0, pending: 0, quoting: 0, contracted: 0, completed: 0, discarded: 0 });

  root.querySelector('[data-provider-total]').textContent = String(records.length);
  root.querySelector('[data-provider-quoting]').textContent = String(totals.quoting);
  root.querySelector('[data-provider-contracted]').textContent = String(totals.contracted + totals.completed);
  root.querySelector('[data-provider-contracted-count]').textContent = String(totals.contracted + totals.completed);
  root.querySelector('[data-provider-paid]').textContent = money(totals.paid);

  const needle = search.trim().toLocaleLowerCase('es');
  const filtered = records.map((record, index) => ({ record, index, values: providerValues(record) })).filter(({ values }) => {
    if (statusFilter !== 'all' && values.status !== statusFilter) return false;
    if (!needle) return true;
    return [values.name, values.service, values.contact, values.phone, values.email, values.notes]
      .join(' ').toLocaleLowerCase('es').includes(needle);
  });

  root.querySelector('[data-provider-results]').textContent = `${filtered.length} ${filtered.length === 1 ? 'proveedor' : 'proveedores'}`;
  root.querySelector('[data-provider-list]').innerHTML = filtered.length
    ? filtered.map(({ record, index }) => providerMarkup(record, index)).join('')
    : '<div class="provider-empty"><span aria-hidden="true">▦</span><strong>No hay proveedores para mostrar</strong><p>Agrega un proveedor o cambia los filtros de búsqueda.</p></div>';
}

function field(label, control, extra = '') {
  return `<label class="provider-form-field ${extra}"><span>${label}</span>${control}</label>`;
}

function openDialog(record = null, index = -1) {
  const root = document.querySelector('[data-module-view="proveedores"]');
  const dialog = root?.querySelector('[data-provider-dialog]');
  if (!dialog) return;
  const values = providerValues(record || {});
  const editing = index >= 0;
  root.querySelector('[data-provider-dialog-title]').textContent = editing ? 'Editar proveedor' : 'Nuevo proveedor';

  const body = root.querySelector('[data-provider-dialog-body]');
  body.innerHTML = `<form id="providerEditorForm" data-provider-form data-index="${editing ? index : ''}">
    ${field('Proveedor / empresa', `<input name="name" required maxlength="120" value="${esc(values.name)}">`)}
    <div class="provider-form-grid">
      ${field('Servicio / categoría', `<input name="service" maxlength="100" value="${esc(values.service)}">`)}
      ${field('Estado', `<select name="status">${Object.entries(STATUS_LABELS).map(([value,label]) => `<option value="${value}"${values.status === value ? ' selected' : ''}>${label}</option>`).join('')}</select>`)}
    </div>
    <div class="provider-form-grid">
      ${field('Persona de contacto', `<input name="contact" maxlength="100" value="${esc(values.contact)}">`)}
      ${field('Teléfono / WhatsApp', `<input name="phone" inputmode="tel" maxlength="40" value="${esc(values.phone)}">`)}
    </div>
    <div class="provider-form-grid">
      ${field('Correo', `<input name="email" type="email" maxlength="140" value="${esc(values.email)}">`)}
      ${field('Web / red social', `<input name="website" maxlength="180" value="${esc(values.website)}">`)}
    </div>
    <div class="provider-form-grid provider-form-money">
      ${field('Cotizado', `<input name="quote" type="number" min="0" step="0.01" value="${values.quote}">`)}
      ${field('Contratado', `<input name="contracted" type="number" min="0" step="0.01" value="${values.contracted}">`)}
      ${field('Pagado', `<input name="paid" type="number" min="0" step="0.01" value="${values.paid}">`)}
    </div>
    ${field('Notas', `<textarea name="notes" rows="4" maxlength="900">${esc(values.notes)}</textarea>`)}
  </form>`;

  const footer = root.querySelector('[data-provider-dialog-footer]');
  footer.innerHTML = (editing && canEdit() ? '<button class="provider-delete" type="button" data-provider-delete>Eliminar</button>' : '')
    + '<span class="provider-dialog-spacer"></span>'
    + '<button type="button" data-provider-close>Cancelar</button>'
    + (canEdit() ? '<button class="provider-save" type="submit" form="providerEditorForm" data-provider-save>Guardar cambios</button>' : '<button type="button" data-provider-close>Cerrar</button>');

  dialog.querySelectorAll('form').forEach(form => { form.autocomplete = 'off'; });
  dialog.showModal();
  if (!window.matchMedia('(max-width:760px)').matches) dialog.querySelector('input,select,textarea')?.focus();
}

function showDetails(record) {
  const root = document.querySelector('[data-module-view="proveedores"]');
  const dialog = root?.querySelector('[data-provider-dialog]');
  if (!dialog) return;
  const values = providerValues(record);
  root.querySelector('[data-provider-dialog-title]').textContent = values.name || 'Proveedor';
  root.querySelector('[data-provider-dialog-body]').innerHTML = `<dl class="provider-details">
    ${[
      ['Servicio', values.service || '—'],
      ['Estado', STATUS_LABELS[values.status]],
      ['Contacto', values.contact || '—'],
      ['Teléfono', values.phone || '—'],
      ['Correo', values.email || '—'],
      ['Web / red social', values.website || '—'],
      ['Cotizado', money(values.quote)],
      ['Contratado', money(values.contracted)],
      ['Pagado', money(values.paid)],
      ['Notas', values.notes || '—']
    ].map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}
  </dl>`;
  root.querySelector('[data-provider-dialog-footer]').innerHTML = '<span class="provider-dialog-spacer"></span><button type="button" data-provider-close>Cerrar</button>';
  dialog.showModal();
}

async function handleSubmit(event) {
  if (!event.target.matches('[data-provider-form]')) return;
  event.preventDefault();
  if (!canEdit()) return;

  const form = event.target;
  const data = new FormData(form);
  const indexValue = form.dataset.index;
  const index = indexValue === '' ? -1 : Number(indexValue);
  const patch = {
    name: String(data.get('name') || '').trim(),
    service: String(data.get('service') || '').trim(),
    contact: String(data.get('contact') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    website: String(data.get('website') || '').trim(),
    quote: numeric(data.get('quote')),
    contracted: numeric(data.get('contracted')),
    paid: numeric(data.get('paid')),
    status: normalizedStatus(data.get('status')),
    notes: String(data.get('notes') || '').trim()
  };
  if (!patch.name) return;

  if (index >= 0 && state.records[index]) {
    const record = { ...state.records[index] };
    Object.entries(patch).forEach(([fieldName,value]) => setValue(record, fieldName, value));
    state.records[index] = record;
  } else {
    const record = { id: crypto.randomUUID() };
    Object.entries(patch).forEach(([fieldName,value]) => setValue(record, fieldName, value));
    state.records.push(record);
  }

  form.closest('dialog')?.close();
  render();
  await persist(index >= 0 ? 'Proveedor actualizado' : 'Proveedor agregado');
}

function bind(root) {
  if (root.dataset.providerBound === 'true') return;
  root.dataset.providerBound = 'true';

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-provider-search]')) return;
    search = event.target.value;
    render();
    const input = root.querySelector('[data-provider-search]');
    input?.focus();
    input?.setSelectionRange(search.length, search.length);
  });

  root.addEventListener('change', (event) => {
    if (!event.target.matches('[data-provider-status-filter]')) return;
    statusFilter = event.target.value;
    render();
  });

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-provider-close]')) {
      event.target.closest('dialog')?.close();
      return;
    }
    if (event.target.closest('[data-provider-new]')) {
      if (canEdit()) openDialog();
      return;
    }
    const card = event.target.closest('[data-provider-index]');
    if (card && event.target.closest('[data-provider-edit]')) {
      const index = Number(card.dataset.providerIndex);
      const record = state.records[index];
      if (record) canEdit() ? openDialog(record, index) : showDetails(record);
      return;
    }
    if (event.target.closest('[data-provider-delete]')) {
      const form = root.querySelector('[data-provider-form]');
      const index = Number(form?.dataset.index);
      if (!Number.isInteger(index) || !state.records[index] || !canEdit()) return;
      if (!window.confirm('¿Eliminar este proveedor? Esta acción no se puede deshacer.')) return;
      state.records.splice(index, 1);
      root.querySelector('[data-provider-dialog]')?.close();
      render();
      await persist('Proveedor eliminado');
    }
  });

  root.addEventListener('submit', handleSubmit);
}

async function mountProveedores(context) {
  const root = document.querySelector('[data-module-view="proveedores"]');
  if (!root || !context?.id) return;

  const epoch = ++mountEpoch;
  activeContext = context;
  pendingSave = false;
  root.innerHTML = '<div class="provider-loading">Cargando Proveedores desde Firebase…</div>';

  try {
    const [template, stored] = await Promise.all([
      fetch(new URL('./index.html?v=1', import.meta.url)).then(response => {
        if (!response.ok) throw new Error('No se pudo cargar la interfaz.');
        return response.text();
      }),
      readPlannerStorageKey(context, STORAGE_KEY)
    ]);
    if (epoch !== mountEpoch || activeContext?.id !== context.id) return;

    root.innerHTML = template;
    state = normalizeStored(stored);
    search = '';
    statusFilter = 'all';
    bind(root);
    render();

    const editable = weddingCapabilities(context.role).canEdit;
    root.querySelector('[data-provider-state]').textContent = editable
      ? 'Datos de la boda activa · edición habilitada'
      : 'Datos reales de Firebase · solo lectura';
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = '<div class="provider-loading">No se pudo cargar Proveedores: ' + esc(error?.message || 'Error de lectura') + '</div>';
  }
}

export { mountProveedores };
