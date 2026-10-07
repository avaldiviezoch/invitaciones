const PUBLIC_INVITATION_ORIGIN = 'https://migrandiapp.com';
const PUBLIC_INVITATION_PATH = '/i/';

function normalizePublicInviteId(value) {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

function buildPublicInvitationUrl(publicInviteId, options = {}) {
  const id = normalizePublicInviteId(publicInviteId);
  if (!id) return '';
  const origin = String(options.origin || PUBLIC_INVITATION_ORIGIN).replace(/\/+$/g, '');
  return `${origin}${PUBLIC_INVITATION_PATH}${encodeURIComponent(id)}`;
}

function isMigrandiaPublicInvitationUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:'
      && url.hostname === 'migrandiapp.com'
      && url.pathname.startsWith(PUBLIC_INVITATION_PATH)
      && url.pathname.length > PUBLIC_INVITATION_PATH.length;
  } catch {
    return false;
  }
}

export {
  PUBLIC_INVITATION_ORIGIN,
  PUBLIC_INVITATION_PATH,
  normalizePublicInviteId,
  buildPublicInvitationUrl,
  isMigrandiaPublicInvitationUrl
};
