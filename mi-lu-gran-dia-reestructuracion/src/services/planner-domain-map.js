const DOMAIN_SCHEMA_VERSION = 1;

const PLANNER_DOMAIN_BY_STORAGE_KEY = Object.freeze({
  planificador_bodas_checklist_v1: 'checklist',
  planificador_bodas_cronograma_v1: 'timeline',
  planificador_bodas_presupuesto_v5_etiquetas: 'budget',
  planificador_bodas_invitados_v1: 'guests',
  planificador_bodas_datos_compartidos_v1: 'guests',
  planificador_bodas_distribucion_v1: 'distribution',
  planificador_bodas_distribucion_vista_v1: 'distribution',
  planificador_bodas_ideas_v1: 'ideas',
  'migrandia.music.v1': 'music',
  planificador_bodas_proveedores_v1: 'vendors'
});

function getPlannerDomain(storageKey) {
  return PLANNER_DOMAIN_BY_STORAGE_KEY[String(storageKey || '')] || 'other';
}

function isPlannerDomainMigrated(storageKey) {
  return Object.hasOwn(PLANNER_DOMAIN_BY_STORAGE_KEY, String(storageKey || ''));
}

function plannerDomainEntryId(storageKey) {
  return String(storageKey || '').trim();
}

export {
  DOMAIN_SCHEMA_VERSION,
  PLANNER_DOMAIN_BY_STORAGE_KEY,
  getPlannerDomain,
  isPlannerDomainMigrated,
  plannerDomainEntryId
};
