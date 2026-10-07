const EVENT_BACKUP_SCHEMA_VERSION = 1;

function normalizeText(value) {
  return String(value || '').trim();
}

function isoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Fecha de backup inválida.');
  return date.toISOString();
}

function createEventBackupEnvelope({ context, payload, createdAt = new Date(), sourceVersion = 1 } = {}) {
  const eventId = normalizeText(context?.id);
  if (!eventId) throw new Error('No hay un eventId válido para crear el backup.');

  return Object.freeze({
    type: 'migrandia_event_backup',
    schemaVersion: EVENT_BACKUP_SCHEMA_VERSION,
    eventId,
    eventName: normalizeText(context?.name),
    eventType: normalizeText(context?.eventType || 'wedding'),
    themeId: normalizeText(context?.themeId || ''),
    sourceVersion: Number(sourceVersion || 1),
    createdAt: isoDate(createdAt),
    payload: payload ?? null
  });
}

function validateEventBackupEnvelope(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('El backup no tiene un formato válido.');
  }
  if (backup.type !== 'migrandia_event_backup') {
    throw new Error('El archivo no es un backup formal de Migrandia.');
  }
  if (Number(backup.schemaVersion) !== EVENT_BACKUP_SCHEMA_VERSION) {
    throw new Error('La versión del backup no es compatible.');
  }
  if (!normalizeText(backup.eventId)) {
    throw new Error('El backup no contiene eventId.');
  }
  isoDate(backup.createdAt);
  return true;
}

function buildEventRestorePlan({ backup, targetContext } = {}) {
  validateEventBackupEnvelope(backup);

  const sourceEventId = normalizeText(backup.eventId);
  const targetEventId = normalizeText(targetContext?.id);
  if (!targetEventId) throw new Error('No hay un evento destino válido.');

  if (sourceEventId !== targetEventId) {
    throw new Error('El backup pertenece a otro evento y no puede restaurarse aquí.');
  }

  return Object.freeze({
    sourceEventId,
    targetEventId,
    schemaVersion: Number(backup.schemaVersion),
    createdAt: backup.createdAt,
    restore: false,
    overwriteAllowed: false,
    payload: backup.payload ?? null
  });
}

export {
  EVENT_BACKUP_SCHEMA_VERSION,
  createEventBackupEnvelope,
  validateEventBackupEnvelope,
  buildEventRestorePlan
};
