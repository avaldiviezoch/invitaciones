const PUBLIC_BETA_REQUIREMENTS = Object.freeze([
  'MGD-002',
  'MGD-003',
  'MGD-004',
  'MGD-006',
  'MGD-008',
  'MGD-010',
  'MGD-026',
  'multiEventBase',
  'eventIsolation',
  'backupTested',
  'mobileDesktopQa'
]);

function normalizeRequirementState(value) {
  return value === true || value?.closed === true;
}

function assessPublicBetaReadiness(requirements = {}) {
  const checks = Object.fromEntries(
    PUBLIC_BETA_REQUIREMENTS.map((key) => [key, normalizeRequirementState(requirements[key])])
  );
  const missing = PUBLIC_BETA_REQUIREMENTS.filter((key) => !checks[key]);

  return Object.freeze({
    checks: Object.freeze(checks),
    missing: Object.freeze(missing),
    publicBeta: missing.length === 0
  });
}

function buildPublicBetaPlan(requirements = {}) {
  const readiness = assessPublicBetaReadiness(requirements);
  return Object.freeze({
    readiness,
    publicBeta: readiness.publicBeta,
    autoPublish: false
  });
}

export {
  PUBLIC_BETA_REQUIREMENTS,
  assessPublicBetaReadiness,
  buildPublicBetaPlan
};
