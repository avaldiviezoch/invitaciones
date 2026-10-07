const PUBLIC_INVITE_PREFIX = 'MGD-';
const PUBLIC_INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUBLIC_INVITE_CODE_LENGTH = 6;
const PUBLIC_INVITE_PATTERN = /^MGD-[A-HJ-NP-Z2-9]{6}$/;

function defaultRandomBytes(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function createPublicInviteId(randomBytes = defaultRandomBytes(PUBLIC_INVITE_CODE_LENGTH)) {
  const bytes = randomBytes instanceof Uint8Array
    ? randomBytes
    : Uint8Array.from(randomBytes || []);

  if (bytes.length < PUBLIC_INVITE_CODE_LENGTH) {
    throw new Error('No hay suficiente entropía para generar el ID público.');
  }

  let code = '';
  for (let index = 0; index < PUBLIC_INVITE_CODE_LENGTH; index += 1) {
    code += PUBLIC_INVITE_ALPHABET[bytes[index] % PUBLIC_INVITE_ALPHABET.length];
  }

  return PUBLIC_INVITE_PREFIX + code;
}

function normalizePublicInviteId(value) {
  return String(value || '').trim().toUpperCase();
}

function isValidPublicInviteId(value) {
  return PUBLIC_INVITE_PATTERN.test(normalizePublicInviteId(value));
}

function createPublicInviteResolution(input = {}) {
  const publicInviteId = normalizePublicInviteId(input.publicInviteId);
  if (!isValidPublicInviteId(publicInviteId)) {
    throw new Error('ID público de invitación inválido.');
  }

  return Object.freeze({
    publicInviteId,
    eventId: String(input.eventId || ''),
    templateId: String(input.templateId || ''),
    rsvpConfig: Object.freeze({ ...(input.rsvpConfig || {}) }),
    revoked: false,
    revokedAt: null
  });
}

function revokePublicInviteResolution(record, revokedAt = null) {
  return Object.freeze({
    ...record,
    revoked: true,
    revokedAt: revokedAt || null
  });
}

function resolveActivePublicInvite(record) {
  if (!record || record.revoked) return null;
  return Object.freeze({
    eventId: record.eventId,
    templateId: record.templateId,
    rsvpConfig: record.rsvpConfig
  });
}

export {
  PUBLIC_INVITE_PREFIX,
  PUBLIC_INVITE_ALPHABET,
  PUBLIC_INVITE_CODE_LENGTH,
  createPublicInviteId,
  normalizePublicInviteId,
  isValidPublicInviteId,
  createPublicInviteResolution,
  revokePublicInviteResolution,
  resolveActivePublicInvite
};
