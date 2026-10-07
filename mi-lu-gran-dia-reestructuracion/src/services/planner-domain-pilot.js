import { assertDomainOnlyActivation } from './planner-domain-retirement.js';

const PILOT_CANDIDATE_STORAGE_KEY = 'planificador_bodas_checklist_v1';

function getPilotCandidate() {
  return Object.freeze({
    storageKey: PILOT_CANDIDATE_STORAGE_KEY,
    module: 'checklist',
    rationale: Object.freeze([
      'single-storage-key',
      'direct-read-write',
      'no-planner-subscription'
    ]),
    enabled: false
  });
}

function validatePilotActivation({ readiness, explicitlyApproved = false } = {}) {
  return assertDomainOnlyActivation({
    storageKey: PILOT_CANDIDATE_STORAGE_KEY,
    readiness,
    explicitlyApproved
  });
}

export {
  PILOT_CANDIDATE_STORAGE_KEY,
  getPilotCandidate,
  validatePilotActivation
};
