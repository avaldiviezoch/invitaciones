import { PILOT_CANDIDATE_STORAGE_KEY } from './planner-domain-pilot.js';
import { assertDomainOnlyActivation } from './planner-domain-retirement.js';

function buildDomainOnlyActivationRequest({
  storageKey = PILOT_CANDIDATE_STORAGE_KEY,
  readiness,
  explicitlyApproved = false
} = {}) {
  const activation = assertDomainOnlyActivation({
    storageKey,
    readiness,
    explicitlyApproved
  });

  return Object.freeze({
    storageKey: activation.storageKey,
    requestedMode: activation.nextMode,
    verifiedReady: readiness?.safeToRetireLegacy === true,
    explicitlyApproved: explicitlyApproved === true,
    apply: false
  });
}

export {
  buildDomainOnlyActivationRequest
};
