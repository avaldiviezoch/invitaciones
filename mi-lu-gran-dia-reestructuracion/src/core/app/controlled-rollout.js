const ROLLOUT_PHASES = Object.freeze({
  INTERNAL: Object.freeze({ id: 'internal', minUsers: 0, maxUsers: 4 }),
  EXTERNAL_SMALL: Object.freeze({ id: 'external-small', minUsers: 5, maxUsers: 10 }),
  EXTERNAL_EXPANDED: Object.freeze({ id: 'external-expanded', minUsers: 20, maxUsers: 30 })
});

const ROLLOUT_METRICS = Object.freeze([
  'errors',
  'firebase',
  'workers',
  'costs',
  'ux',
  'mobile',
  'persistence',
  'permissions',
  'rsvp'
]);

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function rolloutPhaseForUsers(userCount) {
  const count = normalizeCount(userCount);
  if (count <= ROLLOUT_PHASES.INTERNAL.maxUsers) return ROLLOUT_PHASES.INTERNAL;
  if (count <= ROLLOUT_PHASES.EXTERNAL_SMALL.maxUsers) return ROLLOUT_PHASES.EXTERNAL_SMALL;
  return ROLLOUT_PHASES.EXTERNAL_EXPANDED;
}

function assessRolloutGate(input = {}) {
  const criticalErrors = normalizeCount(input.criticalErrors);
  const permissionViolations = normalizeCount(input.permissionViolations);
  const persistenceFailures = normalizeCount(input.persistenceFailures);
  const rsvpFailures = normalizeCount(input.rsvpFailures);
  const checks = Object.freeze({
    e2ePassed: input.e2ePassed === true,
    mobilePassed: input.mobilePassed === true,
    desktopPassed: input.desktopPassed === true,
    criticalErrorsZero: criticalErrors === 0,
    permissionViolationsZero: permissionViolations === 0,
    persistenceFailuresZero: persistenceFailures === 0,
    rsvpFailuresZero: rsvpFailures === 0,
    firebaseHealthy: input.firebaseHealthy === true,
    workersHealthy: input.workersHealthy === true,
    costsWithinExpectedRange: input.costsWithinExpectedRange === true
  });

  return Object.freeze({
    checks,
    canAdvance: Object.values(checks).every(Boolean)
  });
}

function buildControlledRolloutPlan({ currentUsers = 0, gate = {} } = {}) {
  const phase = rolloutPhaseForUsers(currentUsers);
  const assessment = assessRolloutGate(gate);

  return Object.freeze({
    phase,
    metrics: ROLLOUT_METRICS,
    assessment,
    autoEnroll: false,
    publicBeta: false
  });
}

export {
  ROLLOUT_PHASES,
  ROLLOUT_METRICS,
  rolloutPhaseForUsers,
  assessRolloutGate,
  buildControlledRolloutPlan
};
