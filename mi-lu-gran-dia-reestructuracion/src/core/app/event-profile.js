import { EVENT_TYPE_BY_ID } from './event-types.js';
import { getEventTerminology } from './event-terminology.js';
import { getChecklistTemplate } from './checklist-templates.js';

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

function freezeProfile(profile) {
  Object.values(profile).forEach((value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) Object.freeze(value);
  });
  return Object.freeze(profile);
}

function profile(type, overrides = {}) {
  return freezeProfile({
    type,
    terminology: overrides.terminology || getEventTerminology(type),
    modules: overrides.modules || CURRENT_MODULES,
    checklist: overrides.checklist || getChecklistTemplate(type),
    distributionCatalog: overrides.distributionCatalog || { profileId: type, eventType: type },
    theme: overrides.theme || { defaultThemeId: null },
    onboarding: overrides.onboarding || { profileId: type },
    invitationCapabilities: overrides.invitationCapabilities || { enabled: true },
    audienceProfile: overrides.audienceProfile || { mode: 'general' }
  });
}

const EVENT_PROFILES = Object.freeze({
  wedding: profile('wedding', {
    audienceProfile: { mode: 'couple' }
  }),
  birthday: profile('birthday', {
    audienceProfile: { mode: 'age-aware' }
  }),
  quince: profile('quince', {
    audienceProfile: { mode: 'teen' }
  }),
  baby_shower: profile('baby_shower', {
    audienceProfile: { mode: 'family' }
  }),
  religious: profile('religious', {
    audienceProfile: { mode: 'family' }
  }),
  graduation: profile('graduation', {
    audienceProfile: { mode: 'graduate' }
  }),
  corporate: profile('corporate', {
    audienceProfile: { mode: 'organization' }
  }),
  custom: profile('custom')
});

function getEventProfile(eventType) {
  const id = String(eventType || '').trim().toLowerCase();
  return EVENT_PROFILES[Object.hasOwn(EVENT_TYPE_BY_ID, id) ? id : 'wedding'];
}

export { CURRENT_MODULES, EVENT_PROFILES, getEventProfile };
