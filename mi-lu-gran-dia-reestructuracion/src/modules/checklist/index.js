import { weddingCapabilities } from '../../core/app/permissions.js';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';

const STORAGE_KEY = 'planificador_bodas_checklist_v1';
let activeContext = null;
let state = { tasks: [] };
let filter = 'all';
let search = '';
let saving = false;
let mountEpoch = 0;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function taskId(task, index) {
  return String(task?.id || task?.taskId || task?.uuid || `legacy-${index}`);
}

function taskTitle(task) {
  return String(task?.title || task?.name || task?.text || task?.task || 'Tarea sin título');
}

function taskResponsible(task) {
  return String(task?.responsible || task?.responsable || task?.assignee || task?.owner || '');
}

function taskDate(task) {
  return String(task?.dueDate || task?.deadline || task?.date || task?.fecha || '');
}

function taskCategory(task) {
  return String(task?.category || task?.categoria || task?.group || '');
}

function taskStatus(task) {
  const raw = String(task?.status || '').trim().toLowerCase();
  if (['completed','complete','done','completada','completado','finalizada','finalizado'].includes(raw)) return 'completed';
  if (['progress','in-progress','in_progress','en progreso','progreso'].includes(raw)) return 'progress';
  return 'pending';
}

function isCompleted(task) {
  return taskStatus(task) === 'completed';
}

function isOverdue(task) {
  const date = taskDate(task);
  if (!date || isCompleted(task)) return false;
  const due = new Date(date + 'T23:59:59');
  return Number.isFinite(due.getTime()) && due.getTime() < Date.now();
}

function normalizedState(value) {
  const source = value && typeof value === 'object' ? value : {};
  return { ...source, tasks: Array.isArray(source.tasks) ? source.tasks : [] };
}

function visibleTasks() {
  const needle = search.trim().toLocaleLowerCase('es');
  return state.tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => {
      const done = isCompleted(task);
      if (filter === 'pending' && done) return false;
      if (filter === 'completed' && !done) return false;
      if (!needle) return true;
      return [taskTitle(task), taskResponsible(task), taskCategory(task)]
        .join(' ').toLocaleLowerCase('es').includes(needle);
    });
}

function summary() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(isCompleted).length;
  const progress = state.tasks.filter((task) => taskStatus(task) === 'progress').length;
  const overdue = state.tasks.filter(isOverdue).length;
  const pending = Math.max(0, total - completed - progress);
  return { total, completed, progress, overdue, pending, percent: total ? Math.round(completed * 100 / total) : 0 };
}

function taskMarkup(task, index, editable) {
  const id = taskId(task, index);
  const done = isCompleted(task);
  const status = taskStatus(task);
  const overdue = isOverdue(task);
  const responsible = taskResponsible(task);
  const date = taskDate(task);
  const category = taskCategory(task);
  return `<article class="ck-task ${done ? 'is-done' : ''}" data-task-index="${index}">
    <label class="ck-check" aria-label="${done ? 'Marcar pendiente' : 'Marcar completada'}">
      <input type="checkbox" data-task-toggle ${done ? 'checked' : ''} ${editable ? '' : 'disabled'}>
      <span></span>
    </label>
    <div class="ck-task-main">
      <div class="ck-task-title-row"><strong>${esc(taskTitle(task))}</strong>${category ? `<span class="ck-category">${esc(category)}</span>` : ''}</div>
      <div class="ck-task-meta">
        ${responsible ? `<span>Responsable · ${esc(responsible)}</span>` : ''}
        ${date ? `<span>Fecha · ${esc(date)}</span>` : ''}
        <span class="ck-status-dot ck-status-${overdue ? 'overdue' : status}"><i></i>${overdue ? 'Vencida' : status === 'completed' ? 'Completada' : status === 'progress' ? 'En progreso' : 'Pendiente'}</span>
      </div>
    </div>
    ${editable ? `<div class="ck-task-actions"><button type="button" data-task-edit aria-label="Editar ${esc(taskTitle(task))}">Editar</button><button type="button" data-task-delete aria-label="Eliminar ${esc(taskTitle(task))}">Eliminar</button></div>` : ''}
    <span class="ck-task-id" hidden>${esc(id)}</span>
  </article>`;
}

function render() {
  const root = document.querySelector('[data-module-view="checklist"]');
  if (!root || !activeContext) return;
  const editable = weddingCapabilities(activeContext.role).canEdit;
  const stats = summary();
  const rows = visibleTasks();

  root.innerHTML = `<div class="ck-shell">
    <header class="ck-header">
      <div><span class="ck-eyebrow">PLANIFICACIÓN</span><h1>Checklist de boda</h1><p>Organiza las tareas de esta boda. Los cambios se guardan en Firebase dentro del espacio activo.</p></div>
      ${editable ? '<button class="ck-primary" type="button" data-checklist-add>+ Nueva tarea</button>' : '<span class="ck-readonly">Solo lectura</span>'}
    </header>
    <section class="ck-summary" aria-label="Resumen del checklist">
      <div class="ck-mini-pies">
        <div class="ck-pie-card"><div class="ck-pie" style="--value:${stats.percent};--pie-color:#7f8962"><span>${stats.percent}%</span></div><div><strong>Avance</strong><small>${stats.completed} de ${stats.total} tareas</small></div></div>
        <div class="ck-pie-card"><div class="ck-pie ck-pie-status" style="--done:${stats.total ? stats.completed * 100 / stats.total : 0};--progress:${stats.total ? (stats.completed + stats.progress) * 100 / stats.total : 0}"><span>${stats.pending}</span></div><div><strong>Pendientes</strong><small>${stats.progress} en progreso</small></div></div>
      </div>
      <div class="ck-summary-main">
        <div class="ck-progress-head"><span>Progreso general</span><b>${stats.percent}%</b></div>
        <div class="ck-progress"><i style="width:${stats.percent}%"></i></div>
        <div class="ck-indicators">
          <span class="is-completed"><i></i><b>${stats.completed}</b> Completadas</span>
          <span class="is-progress"><i></i><b>${stats.progress}</b> En progreso</span>
          <span class="is-pending"><i></i><b>${stats.pending}</b> Pendientes</span>
          <span class="is-overdue"><i></i><b>${stats.overdue}</b> Vencidas</span>
        </div>
      </div>
    </section>
    <section class="ck-toolbar">
      <div class="ck-filters" role="group" aria-label="Filtrar tareas">
        <button type="button" data-checklist-filter="all" class="${filter === 'all' ? 'is-active' : ''}">Todas</button>
        <button type="button" data-checklist-filter="pending" class="${filter === 'pending' ? 'is-active' : ''}">Pendientes</button>
        <button type="button" data-checklist-filter="completed" class="${filter === 'completed' ? 'is-active' : ''}">Completadas</button>
      </div>
      <label class="ck-search"><span>Buscar</span><input type="search" data-checklist-search value="${esc(search)}" placeholder="Buscar tarea, responsable o categoría"></label>
    </section>
    <section class="ck-list" aria-live="polite">
      ${rows.length ? rows.map(({ task, index }) => taskMarkup(task, index, editable)).join('') : '<div class="ck-empty">No hay tareas para mostrar con este filtro.</div>'}
    </section>
    <p class="ck-save-state" data-checklist-status>${saving ? 'Guardando en Firebase…' : 'Datos de la boda activa'}</p>
    <dialog class="ck-dialog" data-checklist-dialog>
      <form method="dialog" data-checklist-form>
        <input type="hidden" name="index" value="">
        <div class="ck-dialog-head"><div><span>CHECKLIST</span><h2>Nueva tarea</h2></div><button type="button" data-dialog-close aria-label="Cerrar">×</button></div>
        <label><span>Tarea</span><input name="title" maxlength="160" required></label>
        <div class="ck-form-grid"><label><span>Responsable</span><input name="responsible" maxlength="100" placeholder="Ej. Antonio"></label><label><span>Fecha</span><input name="dueDate" type="date"></label></div>
        <label><span>Categoría</span><input name="category" maxlength="80" placeholder="Ej. Ceremonia, local, proveedores"></label>
        <label><span>Notas</span><textarea name="notes" maxlength="700" rows="3"></textarea></label>
        <div class="ck-dialog-actions"><button type="button" data-dialog-close>Cancelar</button><button class="ck-primary" type="submit">Guardar tarea</button></div>
      </form>
    </dialog>
  </div>`;
}

async function persist(message = 'Guardado en Firebase') {
  if (!activeContext || saving) return;
  saving = true;
  const status = document.querySelector('[data-checklist-status]');
  if (status) status.textContent = 'Guardando en Firebase…';
  try {
    await writePlannerStorageKey(activeContext, STORAGE_KEY, state);
    if (status) status.textContent = message;
    window.dispatchEvent(new CustomEvent('migrandia:datachange', { detail: { module: 'checklist', weddingId: activeContext.id } }));
  } catch (error) {
    if (status) status.textContent = error?.message || 'No se pudo guardar en Firebase.';
    throw error;
  } finally {
    saving = false;
  }
}

function openForm(index = -1) {
  const dialog = document.querySelector('[data-checklist-dialog]');
  const form = document.querySelector('[data-checklist-form]');
  if (!dialog || !form) return;
  const task = index >= 0 ? state.tasks[index] || {} : {};
  form.elements.index.value = index >= 0 ? String(index) : '';
  form.elements.title.value = index >= 0 ? taskTitle(task) : '';
  form.elements.responsible.value = index >= 0 ? taskResponsible(task) : '';
  form.elements.dueDate.value = index >= 0 ? taskDate(task) : '';
  form.elements.category.value = index >= 0 ? taskCategory(task) : '';
  form.elements.notes.value = String(task?.notes || task?.nota || '');
  form.querySelector('h2').textContent = index >= 0 ? 'Editar tarea' : 'Nueva tarea';
  dialog.showModal();
  form.elements.title.focus();
}

async function handleClick(event) {
  const root = event.currentTarget;
  const filterButton = event.target.closest('[data-checklist-filter]');
  if (filterButton) {
    filter = filterButton.dataset.checklistFilter;
    render();
    return;
  }
  if (event.target.closest('[data-checklist-add]')) {
    openForm();
    return;
  }
  if (event.target.closest('[data-dialog-close]')) {
    root.querySelector('[data-checklist-dialog]')?.close();
    return;
  }
  const row = event.target.closest('[data-task-index]');
  if (!row) return;
  const index = Number(row.dataset.taskIndex);
  if (!Number.isInteger(index) || !state.tasks[index]) return;
  if (event.target.closest('[data-task-edit]')) {
    openForm(index);
    return;
  }
  if (event.target.closest('[data-task-delete]')) {
    const title = taskTitle(state.tasks[index]);
    if (!window.confirm(`¿Eliminar “${title}” del checklist?`)) return;
    state.tasks.splice(index, 1);
    render();
    await persist('Tarea eliminada');
  }
}

async function handleChange(event) {
  const toggle = event.target.closest('[data-task-toggle]');
  if (!toggle) return;
  const row = toggle.closest('[data-task-index]');
  const index = Number(row?.dataset.taskIndex);
  if (!Number.isInteger(index) || !state.tasks[index]) return;
  state.tasks[index] = { ...state.tasks[index], status: toggle.checked ? 'completed' : 'pending' };
  render();
  await persist(toggle.checked ? 'Tarea completada' : 'Tarea marcada como pendiente');
}

function handleInput(event) {
  if (!event.target.matches('[data-checklist-search]')) return;
  search = event.target.value;
  render();
  const input = document.querySelector('[data-checklist-search]');
  input?.focus();
  input?.setSelectionRange(search.length, search.length);
}

async function handleSubmit(event) {
  if (!event.target.matches('[data-checklist-form]')) return;
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const title = String(data.get('title') || '').trim();
  if (!title) return;
  const indexText = String(data.get('index') || '');
  const index = indexText === '' ? -1 : Number(indexText);
  const patch = {
    title,
    responsible: String(data.get('responsible') || '').trim(),
    dueDate: String(data.get('dueDate') || ''),
    category: String(data.get('category') || '').trim(),
    notes: String(data.get('notes') || '').trim()
  };
  if (index >= 0 && state.tasks[index]) {
    state.tasks[index] = { ...state.tasks[index], ...patch };
  } else {
    state.tasks.push({ id: crypto.randomUUID(), ...patch, status: 'pending', createdAt: new Date().toISOString() });
  }
  form.closest('dialog')?.close();
  render();
  await persist(index >= 0 ? 'Tarea actualizada' : 'Tarea agregada');
}

function bindRoot(root) {
  if (root.dataset.checklistBound === 'true') return;
  root.dataset.checklistBound = 'true';
  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  root.addEventListener('input', handleInput);
  root.addEventListener('submit', handleSubmit);
}

async function mountChecklist(context) {
  const root = document.querySelector('[data-module-view="checklist"]');
  if (!root || !context?.id) return;
  const epoch = ++mountEpoch;
  activeContext = context;
  root.innerHTML = '<div class="ck-loading">Cargando Checklist desde Firebase…</div>';
  bindRoot(root);
  try {
    const stored = await readPlannerStorageKey(context, STORAGE_KEY);
    if (epoch !== mountEpoch || activeContext?.id !== context.id) return;
    state = normalizedState(stored);
    filter = 'all';
    search = '';
    render();
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = `<div class="ck-error"><strong>No se pudo cargar el Checklist</strong><span>${esc(error?.message || 'Revisa la conexión con Firebase.')}</span></div>`;
  }
}

export { mountChecklist };
