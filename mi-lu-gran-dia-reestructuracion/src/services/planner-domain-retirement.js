const RETIREMENT_MODE = Object.freeze({
  HYBRID: 'hybrid',
  DOMAIN_ONLY: 'domain-only'
});

const DOMAIN_ONLY_KEYS = Object.freeze(new Set());

function getPlannerReadMode(storageKey) {
  return DOMAIN_ONLY_KEYS.has(String(storageKey || ''))
    ? RETIREMENT_MODE.DOMAIN_ONLY
    : RETIREMENT_MODE.HYBRID;
}

function canEnableDomainOnly({ readiness, explicitlyApproved = false } = {}) {
  return Boolean(explicitlyApproved && readiness?.safeToRetireLegacy === true);
}

function assertDomainOnlyActivation({ storageKey, readiness, explicitlyApproved = false } = {}) {
  if (!String(storageKey || '').trim()) {
    throw new Error('Clave de almacenamiento inválida.');
  }

  if (!canEnableDomainOnly({ readiness, explicitlyApproved })) {
    throw new Error('La clave todavía no está autorizada para retirar fallback legacy.');
  }

  return Object.freeze({
    storageKey: String(storageKey),
    nextMode: RETIREMENT_MODE.DOMAIN_ONLY
  });
}

export {
  RETIREMENT_MODE,
  getPlannerReadMode,
  canEnableDomainOnly,
  assertDomainOnlyActivation
};
