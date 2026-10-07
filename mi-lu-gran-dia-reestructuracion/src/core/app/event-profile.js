import { EVENT_TYPE_BY_ID } from './event-types.js';

const CURRENT_MODULES = Object.freeze([
  'checklist',
  'presupuesto',
  'proveedores',
  'invitados',
  'distribucion',
  'cronograma',
  'invitaciones',
  'musica',
  'ideas'
]);

const DEFAULT_TERMINOLOGY = Object.freeze({
  event: 'evento',
  eventPlural: 'eventos',
  host: 'organizador',
  guest: 'invitado',
  guestPlural: 'invitados'
});

function freezeProfile(profile) {
  Object.values(profile).forEach((value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) Object.freeze(value);
  });
  return Object.freeze(profile);
}

function profile(type, overrides = {}) {
  return freezeProfile({
    type,
    terminology: { ...DEFAULT_TERMINOLOGY, ...(overrides.terminology || {}) },
    modules: overrides.modules || CURRENT_MODULES,
    checklist: overrides.checklist || { templateId: type },
    distributionCatalog: overrides.distributionCatalog || { profileId: type },
    theme: overrides.theme || { defaultThemeId: null },
    onboarding: overrides.onboarding || { profileId: type },
    invitationCapabilities: overrides.invitationCapabilities || { enabled: true },
    audienceProfile: overrides.audienceProfile || { mode: 'general' }
  });
}

const EVENT_PROFILES = Object.freeze({
  wedding: profile('wedding', {
    terminology: { event: 'boda', eventPlural: 'bodas', host: 'pareja' },
    audienceProfile: { mode: 'couple' }
  }),
  birthday: profile('birthday', {
    terminology: { event: 'cumpleaños', eventPlural: 'cumpleaños', host: 'festejado' },
    audienceProfile: { mode: 'age-aware' }
  }),
  quince: profile('quince', {
    terminology: { event: '15 años', eventPlural: 'fiestas de 15 años', host: 'quinceañera/o' },
    audienceProfile: { mode: 'teen' }
  }),
  baby_shower: profile('baby_shower', {
    terminology: { event: 'baby shower', eventPlural: 'baby showers', host: 'familia' },
    audienceProfile: { mode: 'family' }
  }),
  religious: profile('religious', {
    terminology: { event: 'celebración religiosa', eventPlural: 'celebraciones religiosas', host: 'familia' },
    audienceProfile: { mode: 'family' }
  }),
  graduation: profile('graduation', {
    terminology: { event: 'graduación', eventPlural: 'graduaciones', host: 'graduado' },
    audienceProfile: { mode: 'graduate' }
  }),
  corporate: profile('corporate', {
    terminology: { event: 'evento corporativo', eventPlural: 'eventos corporativos', host: 'organización' },
    audienceProfile: { mode: 'organization' }
  }),
  custom: profile('custom')
});

function getEventProfile(eventType) {
  const id = String(eventType || '').trim().toLowerCase();
  return EVENT_PROFILES[Object.hasOwn(EVENT_TYPE_BY_ID, id) ? id : 'wedding'];
}

export { CURRENT_MODULES, EVENT_PROFILES, getEventProfile };
