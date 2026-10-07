import { normalizeWeddingRole } from '../core/app/permissions.js';

function normalizeConfirmation(value) {
  return String(value || '').trim();
}

function buildEventDeletionPhrase(context) {
  const name = normalizeConfirmation(context?.name);
  const id = normalizeConfirmation(context?.id);
  if (!id) throw new Error('No hay un evento válido para eliminar.');
  return name ? `${name} :: ${id}` : id;
}

function assertStrongEventDeletionConfirmation(context, confirmation) {
  if (normalizeWeddingRole(context?.role) !== 'owner') {
    throw new Error('Solo el propietario puede eliminar este evento.');
  }

  const expected = buildEventDeletionPhrase(context);
  const received = normalizeConfirmation(confirmation);

  if (!received || received !== expected) {
    throw new Error('La confirmación de eliminación no coincide.');
  }

  return true;
}

function buildEventDeletionPlan(context, confirmation) {
  assertStrongEventDeletionConfirmation(context, confirmation);

  const eventId = normalizeConfirmation(context.id);
  return Object.freeze({
    eventId,
    execute: false,
    destructive: true,
    resources: Object.freeze([
      `weddings/${eventId}`,
      `weddings/${eventId}/members/*`,
      `weddings/${eventId}/cloudSync/*`,
      `weddings/${eventId}/cloudChunks/*`,
      `weddings/${eventId}/domainData/*`,
      `weddings/${eventId}/rsvpConfig/*`,
      `weddings/${eventId}/rsvpManagement/*`,
      'users/*/weddings/{eventId}',
      'invitations?weddingId={eventId}',
      'publicRsvp/{token} + responses/*'
    ])
  });
}

export {
  buildEventDeletionPhrase,
  assertStrongEventDeletionConfirmation,
  buildEventDeletionPlan
};
