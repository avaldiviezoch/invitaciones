// MGD-021: contrato puro; no importa Firebase y no realiza escrituras.
const DRAFT_SCHEMA = 'migrandia-invitation-draft-v1';
const DRAFT_EVENT_TYPES = Object.freeze(['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom']);
const DRAFT_FIELDS = Object.freeze(['eventType','eventName','date','location','guestName','message','templateId','fontStyle','colorPalette']);
const DRAFT_LIMITS = Object.freeze({ eventName:100, date:10, location:140, guestName:100, message:240, templateId:48, fontStyle:12, colorPalette:12 });
const DRAFT_PALETTES = Object.freeze(['auto','ivory','sage','rose','navy']);
const DRAFT_FONTS = Object.freeze(['serif','sans']);
const DRAFT_TEMPLATES = Object.freeze(['classic-elegant','minimal-black','one-piece-elegant']);

function normalizeDraftInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== DRAFT_SCHEMA) {
    throw new Error('Esquema de borrador inválido.');
  }
  const allowed = new Set(['schema', ...DRAFT_FIELDS]);
  if (Object.keys(value).some((field) => !allowed.has(field))) throw new Error('Campos de borrador no autorizados.');
  for (const field of DRAFT_FIELDS) {
    if (typeof value[field] !== 'string' || value[field].length > DRAFT_LIMITS[field]) {
      throw new Error('Campo de borrador inválido: ' + field);
    }
  }
  if (!DRAFT_EVENT_TYPES.includes(value.eventType)
    || !DRAFT_TEMPLATES.includes(value.templateId)
    || !DRAFT_FONTS.includes(value.fontStyle)
    || !DRAFT_PALETTES.includes(value.colorPalette)
    || (value.date && ! /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value.date))) {
    throw new Error('Opciones de borrador inválidas.');
  }
  return Object.freeze(Object.fromEntries(['schema', ...DRAFT_FIELDS].map((field) => [field, value[field]])));
}

// La ruta es una propuesta pendiente de autorización de Rules; nunca se utiliza para leer/escribir todavía.
function draftStorageScope(uid, eventId) {
  const validSegment = (value) => typeof value === 'string'
    && value.length >= 1 && value.length <= 128
    && !['/', '\\\\', '?', '#'].some((char) => value.includes(char)) && value !== '.' && value !== '..';
  if (!validSegment(uid) || !validSegment(eventId)) throw new Error('Se requiere cuenta y evento válidos.');
  return Object.freeze({ ownerUid:uid, eventId, proposedCollectionPath:`users/${uid}/eventInvitationDrafts/${eventId}/drafts` });
}
function isDraftInScope(draft, scope) {
  return Boolean(draft && scope && draft.ownerUid === scope.ownerUid && draft.eventId === scope.eventId);
}
export { DRAFT_SCHEMA, DRAFT_FIELDS, normalizeDraftInput, draftStorageScope, isDraftInScope };
