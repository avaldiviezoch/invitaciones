import {
  readPlannerStorageKeys,
  writePlannerStorageKeys
} from '../../services/planner-cloud.js?v=4';
import { normalizeTableShape } from './table-geometry.js?v=6';

const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

function cloneRecord(value) {
  return value && typeof value === 'object' ? { ...value } : {};
}

function guestStatus(guest) {
  const status = String(guest?.status || '').trim().toLowerCase();
  if (status === 'confirmed') return 'confirmed';
  if (status === 'declined') return 'declined';
  if (status === 'tentative') return 'tentative';
  return 'pending';
}

function tableCapacity(table) {
  const direct = Number(table?.capacity);
  if (Number.isInteger(direct) && direct >= 4 && direct <= 16) return direct;
  const seatCount = Array.isArray(table?.seats) ? table.seats.length : 0;
  if (Number.isInteger(seatCount) && seatCount >= 4 && seatCount <= 16) return seatCount;
  return 10;
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

function summarizeInvitadosValue(value) {
  const canonical = normalizeGuestState(value);
  const guests = canonical.guests;
  const confirmed = guests.filter((guest) => guestStatus(guest) === 'confirmed');
  const pending = guests.filter((guest) => !['confirmed', 'declined'].includes(guestStatus(guest)));
  const seated = guests.filter((guest) => String(guest?.tableId || '').trim());
  const confirmedSeated = confirmed.filter((guest) => String(guest?.tableId || '').trim());
  const confirmedWithoutTable = confirmed
    .filter((guest) => !String(guest?.tableId || '').trim())
    .map((guest) => ({
      name: String(guest?.name || '').trim() || '(sin nombre)',
      status: guestStatus(guest),
      tableId: String(guest?.tableId || '').trim(),
      rsvpResponseId: String(guest?.rsvpResponseId || '').trim()
    }));
  if (confirmedWithoutTable.length) {
    console.group('[Migrandia diagnóstico temporal] Confirmados sin mesa');
    console.table(confirmedWithoutTable);
    console.groupEnd();
  }
  const usedTableIds = new Set(seated.map((guest) => String(guest.tableId || '').trim()).filter(Boolean));
  const tables = canonical.tables.map((table, index) => {
    const tableId = String(table?.id || '').trim();
    const assigned = guests.filter((guest) => String(guest?.tableId || '').trim() === tableId);
    const confirmedAtTable = assigned.filter((guest) => guestStatus(guest) === 'confirmed').length;
    return {
      id: tableId || `legacy-table-${index}`,
      name: String(table?.name || `Mesa ${index + 1}`).trim(),
      shape: normalizeTableShape(table?.type || table?.shape),
      capacity: tableCapacity(table),
      assigned: assigned.length,
      confirmed: confirmedAtTable
    };
  });
  return {
    total: guests.length,
    confirmed: confirmed.length,
    pending: pending.length,
    seated: seated.length,
    confirmedSeated: confirmedSeated.length,
    tablesUsed: usedTableIds.size,
    tables,
    confirmedPercent: guests.length ? Math.round(confirmed.length * 100 / guests.length) : 0
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

async function updateCanonicalTable(context, tableId, mutateTable) {
  if (typeof mutateTable !== 'function') throw new Error('La actualización de mesa no es válida.');
  const snapshot = await loadInvitadosSnapshot(context);
  const targetId = String(tableId || '').trim();
  const table = snapshot.canonical.tables.find((item) => String(item?.id || '').trim() === targetId);
  if (!table) throw new Error('La mesa ya no existe en la información actual.');
  mutateTable(table);
  table.updatedAt = new Date().toISOString();
  await saveInvitadosSnapshot(context, snapshot.canonical);
  return { ...table, dimensions: table.dimensions && typeof table.dimensions === 'object' ? { ...table.dimensions } : undefined };
}

export {
  GUEST_STORAGE_KEY,
  SHARED_STORAGE_KEY,
  guestStatus,
  tableCapacity,
  summarizeInvitadosValue,
  loadInvitadosSnapshot,
  saveInvitadosSnapshot,
  updateCanonicalTable
};