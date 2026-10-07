const READINESS_STATUS = Object.freeze({
  READY: 'ready',
  MISSING: 'missing',
  STALE: 'stale',
  LEGACY_ONLY: 'legacy-only',
  INACCESSIBLE: 'inaccessible'
});

function assessPlannerDomainEntry({ legacyHasValue, legacySyncToken, domainEntry, domainError = false }) {
  if (domainError) {
    return Object.freeze({
      status: READINESS_STATUS.INACCESSIBLE,
      safeToRetireLegacy: false
    });
  }

  const hasLegacy = Boolean(legacyHasValue);
  const token = String(legacySyncToken || '');
  const domainExists = Boolean(domainEntry?.exists);

  if (!hasLegacy && !domainExists) {
    return Object.freeze({
      status: READINESS_STATUS.READY,
      safeToRetireLegacy: true
    });
  }

  if (!token) {
    return Object.freeze({
      status: READINESS_STATUS.LEGACY_ONLY,
      safeToRetireLegacy: false
    });
  }

  if (!domainExists) {
    return Object.freeze({
      status: READINESS_STATUS.MISSING,
      safeToRetireLegacy: false
    });
  }

  if (String(domainEntry?.syncToken || '') !== token) {
    return Object.freeze({
      status: READINESS_STATUS.STALE,
      safeToRetireLegacy: false
    });
  }

  return Object.freeze({
    status: READINESS_STATUS.READY,
    safeToRetireLegacy: true
  });
}

function summarizePlannerDomainReadiness(entries = {}) {
  const values = Object.values(entries || {});
  const summary = {
    total: values.length,
    ready: 0,
    missing: 0,
    stale: 0,
    legacyOnly: 0,
    inaccessible: 0,
    safeToRetireLegacy: values.length > 0
  };

  values.forEach((entry) => {
    const status = entry?.status;
    if (status === READINESS_STATUS.READY) summary.ready += 1;
    else if (status === READINESS_STATUS.MISSING) summary.missing += 1;
    else if (status === READINESS_STATUS.STALE) summary.stale += 1;
    else if (status === READINESS_STATUS.LEGACY_ONLY) summary.legacyOnly += 1;
    else if (status === READINESS_STATUS.INACCESSIBLE) summary.inaccessible += 1;

    if (!entry?.safeToRetireLegacy) summary.safeToRetireLegacy = false;
  });

  return Object.freeze(summary);
}

export {
  READINESS_STATUS,
  assessPlannerDomainEntry,
  summarizePlannerDomainReadiness
};
