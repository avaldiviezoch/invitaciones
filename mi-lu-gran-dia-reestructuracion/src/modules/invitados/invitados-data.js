import { readPlannerStorageKey } from '../../services/planner-cloud.js?v=2';

const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

function cloneRecord(value) {
  return value && typeof value === 'object' ? { ...value } : {};
}

function normalizeGuestState(value) {
  if (value === null || value === undefined || value === '') {
    return { root: null, guests: [], tables: [] };
  }
  if (Array.isArray(value)) {
    return { root: value, guests: value.map(cloneRecord), tables: [] };
  }
  if (value && typeof value === 'object') {
    if (!Array.isArray(value.guests)) {
      throw new Error('La data existente de Invitados no contiene una lista guests reconocible. No se modificó ningún dato.');
    }
    return {
      root: value,
      guests: value.guests.map(cloneRecord),
      tables: Array.isArray(value.tables) ? value.tables.map(cloneRecord) : []
    };
  }
  throw new Error('La data existente de Invitados tiene un formato no reconocido. No se modificó ningún dato.');
}

function normalizeSharedState(value) {
  if (!value || typeof value !== 'object') return { guests: [], tables: [] };
  return {
    guests: Array.isArray(value.guests) ? value.guests.map(cloneRecord) : [],
    tables: Array.isArray(value.tables) ? value.tables.map(cloneRecord) : []
  };
}

async function loadInvitadosSnapshot(context) {
  if (!context?.id) throw new Error('No hay una boda activa.');
  const [guestValue, sharedValue] = await Promise.all([
    readPlannerStorageKey(context, GUEST_STORAGE_KEY),
    readPlannerStorageKey(context, SHARED_STORAGE_KEY)
  ]);
  return {
    canonical: normalizeGuestState(guestValue),
    shared: normalizeSharedState(sharedValue)
  };
}

export { loadInvitadosSnapshot };