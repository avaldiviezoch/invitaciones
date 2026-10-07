const AGE_PROFILE_IDS = Object.freeze([
  'child',
  'teen',
  'young-adult',
  'adult',
  'older-adult'
]);

const AGE_AWARE_EVENT_TYPES = Object.freeze(new Set([
  'birthday',
  'quince',
  'custom'
]));

function normalizeAge(value) {
  const age = Number(value);
  if (!Number.isFinite(age)) return null;
  const whole = Math.floor(age);
  return whole >= 0 && whole <= 120 ? whole : null;
}

function ageProfileFromAge(value) {
  const age = normalizeAge(value);
  if (age === null) return null;
  if (age <= 12) return 'child';
  if (age <= 17) return 'teen';
  if (age <= 29) return 'young-adult';
  if (age <= 59) return 'adult';
  return 'older-adult';
}

function eventUsesAgeProfile(eventType) {
  return AGE_AWARE_EVENT_TYPES.has(String(eventType || '').trim().toLowerCase());
}

function buildAgeProfile({ eventType, age } = {}) {
  const normalizedEventType = String(eventType || '').trim().toLowerCase();
  const normalizedAge = normalizeAge(age);

  if (!eventUsesAgeProfile(normalizedEventType)) {
    return Object.freeze({
      eventType: normalizedEventType,
      applicable: false,
      age: null,
      profileId: null,
      affectsPermissions: false,
      affectsIdentity: false,
      affectsDataShape: false
    });
  }

  const profileId = normalizedEventType === 'quince'
    ? 'teen'
    : ageProfileFromAge(normalizedAge);

  return Object.freeze({
    eventType: normalizedEventType,
    applicable: true,
    age: normalizedAge,
    profileId,
    affectsPermissions: false,
    affectsIdentity: false,
    affectsDataShape: false
  });
}

function suggestionHints(profileId) {
  const id = AGE_PROFILE_IDS.includes(profileId) ? profileId : null;
  if (!id) return Object.freeze({});

  return Object.freeze({
    audiencePreset: id,
    themeMode: 'suggest-only',
    checklistMode: 'suggest-only',
    invitationMode: 'suggest-only',
    activityMode: 'suggest-only',
    manualThemeOverride: true
  });
}

export {
  AGE_PROFILE_IDS,
  AGE_AWARE_EVENT_TYPES,
  normalizeAge,
  ageProfileFromAge,
  eventUsesAgeProfile,
  buildAgeProfile,
  suggestionHints
};
