import {
  readPlannerStorageKeys,
  writePlannerStorageKeys
} from '../../services/planner-cloud.js?v=4';

const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

function cloneRecord(value) {
  return value && typeof value === 'object' ? { ...value } : {};
}

function normalizeGuestState(value) {
  if (value === null || value === undefined || value === '') {
    return { mode: 'object', root: {}, guests: [], tables: [] };
  }
  if (Array.isArray(value)) {
    return { mode: 'array', root: null, guests: value.map(cloneRecord), tables: [] };
  }
  if (value && typeof value === 'object') {
    if (!Array.isArray(value.guests)) {
      throw new Error('La data existente de Invitados no contiene una lista guests reconocible. No se modificó ningún dato.');
    }
    return {
      mode: 'object',
      root: { ...value },
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

function serializeCanonical(canonical) {
  if (canonical.mode === 'array') return canonical.guests.map(cloneRecord);
  return {
    ...(canonical.root || {}),
    guests: canonical.guests.map(cloneRecord),
    tables: canonical.tables.map(cloneRecord)
  };
}

function deriveTableGuestIds(tableId, guests) {
  return guests
    .filter((guest) => String(guest.tableId || '') === String(tableId || ''))
    .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
    .map((guest) => guest.id);
}

function buildSharedState(canonical) {
  const guests = canonical.guests;
  const tables = canonical.tables;
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    source: 'invitados',
    guests: guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      status: guest.status,
      invitationSent: Boolean(guest.invitationSent),
      side: guest.side || 'ambos',
      relation: guest.relation || '',
      restriction: guest.restriction || 'Ninguna',
      tableId: guest.tableId || '',
      seatId: guest.seatId || '',
      seatNumber: guest.seatNumber ?? null,
      photoId: guest.photoId || '',
      photoThumb: guest.photoThumb || '',
      notes: guest.notes || '',
      rsvpResponseId: guest.rsvpResponseId || '',
      rsvpResponseName: guest.rsvpResponseName || '',
      rsvpGroup: guest.rsvpGroup || '',
      rsvpFamilyLabel: guest.rsvpFamilyLabel || '',
      rsvpTags: Array.isArray(guest.rsvpTags) ? [...guest.rsvpTags] : []
    })),
    tables: tables.map((table) => ({
      ...table,
      guestIds: deriveTableGuestIds(table.id, guests)
    }))
  };
}

async function loadInvitadosSnapshot(context) {
  if (!context?.id) throw new Error('No hay una boda activa.');
  const values = await readPlannerStorageKeys(context, [GUEST_STORAGE_KEY, SHARED_STORAGE_KEY]);
  const guestValue = values[GUEST_STORAGE_KEY];
  const sharedValue = values[SHARED_STORAGE_KEY];
  return {
    canonical: normalizeGuestState(guestValue),
    shared: normalizeSharedState(sharedValue)
  };
}

async function saveInvitadosSnapshot(context, canonical) {
  const canonicalValue = serializeCanonical(canonical);
  const sharedValue = buildSharedState(canonical);
  await writePlannerStorageKeys(context, {
    [GUEST_STORAGE_KEY]: canonicalValue,
    [SHARED_STORAGE_KEY]: sharedValue
  });
  return { canonicalValue, sharedValue };
}

export { loadInvitadosSnapshot, saveInvitadosSnapshot };