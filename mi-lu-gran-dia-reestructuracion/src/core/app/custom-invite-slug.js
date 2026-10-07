import { isValidPublicInviteId, normalizePublicInviteId } from './public-invite-id.js';

const CUSTOM_INVITE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CUSTOM_INVITE_SLUG_MIN_LENGTH = 3;
const CUSTOM_INVITE_SLUG_MAX_LENGTH = 64;

function normalizeCustomInviteSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function isValidCustomInviteSlug(value) {
  const slug = normalizeCustomInviteSlug(value);
  return slug.length >= CUSTOM_INVITE_SLUG_MIN_LENGTH
    && slug.length <= CUSTOM_INVITE_SLUG_MAX_LENGTH
    && CUSTOM_INVITE_SLUG_PATTERN.test(slug);
}

function createCustomInviteAlias(input = {}) {
  const slug = normalizeCustomInviteSlug(input.slug);
  const publicInviteId = normalizePublicInviteId(input.publicInviteId);

  if (!isValidCustomInviteSlug(slug)) {
    throw new Error('URL personalizada inválida.');
  }
  if (!isValidPublicInviteId(publicInviteId)) {
    throw new Error('ID público seguro inválido.');
  }

  return Object.freeze({
    slug,
    publicInviteId,
    revoked: false
  });
}

function revokeCustomInviteAlias(alias) {
  return Object.freeze({
    ...alias,
    revoked: true
  });
}

function resolveCustomInviteAlias(alias) {
  if (!alias || alias.revoked) return null;
  return alias.publicInviteId;
}

export {
  CUSTOM_INVITE_SLUG_MIN_LENGTH,
  CUSTOM_INVITE_SLUG_MAX_LENGTH,
  normalizeCustomInviteSlug,
  isValidCustomInviteSlug,
  createCustomInviteAlias,
  revokeCustomInviteAlias,
  resolveCustomInviteAlias
};
