import { getEventProfile } from './event-profile.js';
import { buildAgeProfile, suggestionHints } from './age-profile.js';
import { normalizeThemeId } from './theme-id.js';
import { getThemeTokens } from './theme-tokens.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function themeSuggestions({ eventType, ageProfileId } = {}) {
  const type = normalizeText(eventType).toLowerCase();

  if (type === 'corporate') {
    return Object.freeze(['minimal-black', 'classic-elegant']);
  }
  if (type === 'wedding') {
    return Object.freeze(['classic-elegant', 'one-piece-elegant', 'minimal-black']);
  }
  if (ageProfileId === 'child' || ageProfileId === 'teen') {
    return Object.freeze(['classic-elegant', 'one-piece-elegant']);
  }
  return Object.freeze(['classic-elegant', 'minimal-black']);
}

function buildOnboardingPreview({
  eventType,
  organizerRole = '',
  age = null,
  themeId = ''
} = {}) {
  const eventProfile = getEventProfile(eventType);
  const ageProfile = buildAgeProfile({ eventType: eventProfile.type, age });
  const hints = suggestionHints(ageProfile.profileId);
  const suggestions = themeSuggestions({
    eventType: eventProfile.type,
    ageProfileId: ageProfile.profileId
  });

  const selectedThemeId = normalizeThemeId(
    themeId || suggestions[0] || eventProfile.theme?.defaultThemeId || 'classic-elegant'
  );

  return Object.freeze({
    eventType: eventProfile.type,
    organizerRole: normalizeText(organizerRole),
    ageProfile,
    theme: Object.freeze({
      selectedThemeId,
      suggestedThemeIds: suggestions,
      tokens: getThemeTokens(selectedThemeId),
      manualOverrideAllowed: true
    }),
    eventProfile,
    hints,
    previewOnly: true,
    persist: false
  });
}

export {
  themeSuggestions,
  buildOnboardingPreview
};
