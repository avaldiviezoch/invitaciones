// MGD-021: matriz de autorización para preflight y tests; NO reemplaza Firestore Security Rules.
const READ_ROLES = Object.freeze(['owner', 'admin', 'editor', 'provider', 'viewer']);
const WRITE_ROLES = Object.freeze(['owner', 'admin', 'editor']);

function assessInvitationDraftAccess({ authenticated = false, membershipStatus = '', role = '', memberEventId = '', eventId = '', operation = 'read' } = {}) {
  if (!authenticated || !eventId || memberEventId !== eventId || membershipStatus !== 'active') return false;
  if (operation === 'read' || operation === 'list') return READ_ROLES.includes(role);
  if (['create', 'update', 'delete'].includes(operation)) return WRITE_ROLES.includes(role);
  return false;
}
export { assessInvitationDraftAccess, READ_ROLES, WRITE_ROLES };
