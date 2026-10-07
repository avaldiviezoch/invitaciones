import { normalizeWeddingRole, weddingCapabilities } from '../core/app/permissions.js';

const IDEAS_STORAGE_KEY = 'planificador_bodas_ideas_v1';
const IDEAS_WRITE_ROLES = Object.freeze(new Set(['owner', 'admin']));

function canWritePlannerStorageKey(role, storageKey) {
  const normalizedRole = normalizeWeddingRole(role);
  const key = String(storageKey || '');

  if (key === IDEAS_STORAGE_KEY) {
    return IDEAS_WRITE_ROLES.has(normalizedRole);
  }

  return weddingCapabilities(normalizedRole).canEdit;
}

function assertPlannerStorageWriteAllowed(role, storageKeys) {
  const keys = Array.isArray(storageKeys)
    ? [...new Set(storageKeys.map(String).filter(Boolean))]
    : [];

  const denied = keys.filter((key) => !canWritePlannerStorageKey(role, key));
  if (denied.length) {
    throw new Error('Tu rol no tiene permiso para modificar este módulo.');
  }

  return true;
}

export {
  IDEAS_STORAGE_KEY,
  IDEAS_WRITE_ROLES,
  canWritePlannerStorageKey,
  assertPlannerStorageWriteAllowed
};
