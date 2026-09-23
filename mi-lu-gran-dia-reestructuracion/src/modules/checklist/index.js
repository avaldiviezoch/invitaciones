import { weddingCapabilities } from '../../core/app/permissions.js';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';

const STORAGE_KEY = 'planificador_bodas_checklist_v1';
let activeContext = null;
let state = { tasks: [] };
let filter = 'all';
let search = '';
let responsibleFilter = 'all';
let priorityFilter = 'all';
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
  return String(task?.category || task?.categoria || task?.group || task?.section || task?.fase || 'Sin categoría');
}

function taskPriority(task) {
  return String(task?.priority || task?.prioridad || '').trim().toLowerCase();
}

function priorityLabel(task) {
  const value = taskPriority(task);
  if (['high','alta','urgent','urgente'].includes(value)) return 'Alta';
  if (['low','baja'].includes(value)) return 'Baja';
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function priorityClass(task, index) {
  const value = taskPriority(task);
  if (['high','alta','urgent','urgente'].includes(value)) return 'high';
  if (['low','baja'].includes(value)) return 'low';
  return index % 3 === 1 ? 'medium' : 'high';
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
      const status = taskStatus(task);
      const overdue = isOverdue(task);
      if (filter === 'pending' && status !== 'pending') return false;
      if (filter === 'progress' && status !== 'progress') return false;
      if (filter === 'completed' && status !== 'completed') return false;
      if (filter === 'overdue' && !overdue) return false;
      const responsible = taskResponsible(task);
      if (responsibleFilter !== 'all' && responsible !== responsibleFilter) return false;
      const priority = priorityLabel(task);
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false;
      if (!needle) return true;
      return [taskTitle(task), responsible, taskCategory(task), task?.notes, task?.nota]
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
  const done = isCompleted(task);
  const status = taskStatus(task);
  const overdue = isOverdue(task);
  const responsible = taskResponsible(task);
  const date = taskDate(task);
  const priority = priorityClass(task, index);
  return `<div class="ck-original-task ${done ? 'is-done' : ''}" data-task-index="${index}">
    <span class="ck-drag" aria-hidden="true">⠿</span>
    <label class="ck-square-check" aria-label="${done ? 'Marcar pendiente' : 'Marcar completada'}">
      <input type="checkbox" data-task-toggle ${done ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>✓</span>
    </label>
    <div class="ck-original-task-copy">
      <strong><i class="ck-priority-dot is-${priority}"></i>${esc(taskTitle(task))}</strong>
      <small>${overdue ? 'Atrasada' : status === 'completed' ? 'Completada' : status === 'progress' ? 'En proceso' : 'Pendiente'}${responsible ? ` · ${esc(responsible)}` : ''}${date ? ` · ${esc(date)}` : ''}</small>
    </div>
    ${editable ? '<button class="ck-task-plus" type="button" data-task-edit aria-label="Editar tarea">＋</button>' : ''}
  </div>`;
}

function render() {
  const root = document.querySelector('[data-module-view="checklist"]');
  if (!root || !activeContext) return;
  const editable = weddingCapabilities(activeContext.role).canEdit;
  const stats = summary();
  const rows = visibleTasks();
  const groups = new Map();
  rows.forEach(({ task, index }) => {
    const name = taskCategory(task);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ task, index });
  });
  const responsibleOptions = [...new Set(state.tasks.map(taskResponsible).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const priorityOptions = [...new Set(state.tasks.map(priorityLabel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));

  root.innerHTML = `<div class="ck-shell ck-original">
    <header class="ck-original-hero">
      <span class="ck-original-eyebrow">MÓDULO · PLANIFICACIÓN</span>
      <div class="ck-original-title-row"><div class="ck-title-icon">▣</div><div><h1>Checklist de boda</h1><p>Organiza las tareas, responsables, fechas y avances de la preparación.</p></div><div class="ck-hero-percent"><strong>${stats.percent}%</strong><span>${stats.completed} de ${stats.total} completadas</span></div></div>
      <div class="ck-hero-progress"><i style="width:${stats.percent}%"></i></div>
    </header>

    <section class="ck-actions">
      <div class="ck-actions-left">
        ${editable ? '<button class="ck-primary ck-new" type="button" data-checklist-add><b>＋</b>Nueva tarea</button>' : ''}
        <button type="button" data-apply-date>▣ <span>Aplicar fecha</span></button>
        <button type="button" data-save-template>▣ <span>Guardar como</span></button>
        <button type="button" data-open-template>▱ <span>Abrir</span></button>
      </div>
      <div class="ck-actions-right"><button type="button" data-export-csv>Exportar CSV</button><button class="ck-reset" type="button" data-reset-base>Restablecer base</button></div>
    </section>

    <section class="ck-kpis">
      <article><span>Total de tareas</span><strong>${stats.total}</strong></article>
      <article><span>Pendientes</span><strong>${stats.pending}</strong></article>
      <article><span>En proceso</span><strong>${stats.progress}</strong></article>
      <article><span>Completadas</span><strong>${stats.completed}</strong></article>
      <article><span>Atrasadas</span><strong>${stats.overdue}</strong></article>
    </section>

    <section class="ck-original-toolbar">
      <div class="ck-segments">
        <button data-checklist-filter="all" class="${filter==='all'?'is-active':''}">Todas</button>
        <button data-checklist-filter="pending" class="${filter==='pending'?'is-active':''}">Pendientes</button>
        <button data-checklist-filter="progress" class="${filter==='progress'?'is-active':''}">En proceso</button>
        <button data-checklist-filter="completed" class="${filter==='completed'?'is-active':''}">Completadas</button>
        <button data-checklist-filter="overdue" class="${filter==='overdue'?'is-active':''}">Atrasadas</button>
      </div>
      <label class="ck-original-search"><span>⌕</span><input type="search" data-checklist-search value="${esc(search)}" placeholder="Buscar tarea, proveedor o nota"></label>
      <label class="ck-select"><b>RESPONSABLE</b><select data-responsible-filter><option value="all">Todos</option>${responsibleOptions.map(v=>`<option ${responsibleFilter===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
      <label class="ck-select"><b>PRIORIDAD</b><select data-priority-filter><option value="all">Todas</option>${priorityOptions.map(v=>`<option ${priorityFilter===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
    </section>

    <section class="ck-groups">
      ${groups.size ? [...groups.entries()].map(([name, items]) => {
        const done = items.filter(({task})=>isCompleted(task)).length;
        const pct = items.length ? Math.round(done*100/items.length) : 0;
        return `<article class="ck-group"><header><div class="ck-group-ring" style="--p:${pct}"><span>${pct}%</span></div><div><h2>${esc(name)}</h2><div class="ck-group-line"><i style="width:${pct}%"></i></div><small>${done} / ${items.length}</small></div><button type="button" class="ck-collapse" aria-label="Contraer">⌄</button></header><div class="ck-group-tasks">${items.map(({task,index})=>taskMarkup(task,index,editable)).join('')}</div></article>`;
      }).join('') : '<div class="ck-empty">No hay tareas para mostrar con este filtro.</div>'}
    </section>
    <p class="ck-save-state" data-checklist-status>${saving ? 'Guardando en Firebase…' : 'Datos de la boda activa'}</p>
    <dialog class="ck-dialog" data-checklist-dialog>
      <form method="dialog" data-checklist-form>
        <input type="hidden" name="index" value="">
        <div class="ck-dialog-head"><div><span>CHECKLIST</span><h2>Nueva tarea</h2></div><button type="button" data-dialog-close aria-label="Cerrar">×</button></div>
        <label><span>Tarea</span><input name="title" maxlength="160" required></label>
        <div class="ck-form-grid"><label><span>Responsable</span><input name="responsible" maxlength="100"></label><label><span>Fecha</span><input name="dueDate" type="date"></label></div>
        <div class="ck-form-grid"><label><span>Categoría</span><input name="category" maxlength="80"></label><label><span>Prioridad</span><select name="priority"><option value="">Normal</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></label></div>
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
  form.elements.priority.value = index >= 0 ? taskPriority(task) : '';
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
  if (event.target.matches('[data-responsible-filter]')) {
    responsibleFilter = event.target.value;
    render();
    return;
  }
  if (event.target.matches('[data-priority-filter]')) {
    priorityFilter = event.target.value;
    render();
    return;
  }
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
    priority: String(data.get('priority') || '').trim(),
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
    responsibleFilter = 'all';
    priorityFilter = 'all';
    render();
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = `<div class="ck-error"><strong>No se pudo cargar el Checklist</strong><span>${esc(error?.message || 'Revisa la conexión con Firebase.')}</span></div>`;
  }
}

export { mountChecklist };
