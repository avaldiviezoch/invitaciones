const ONBOARDING_ENGINE_ID = 'adaptive-onboarding-v1';

function option(value, label) {
  return Object.freeze({ value, label });
}

function onboardingProfile(eventType, roleOptions) {
  const ageAware = ['birthday', 'quince', 'custom'].includes(eventType);
  return Object.freeze({
    profileId: eventType,
    engine: ONBOARDING_ENGINE_ID,
    firstQuestion: 'eventType',
    organizerRoleQuestion: Object.freeze({
      id: 'role',
      label: '¿Cuál es tu papel en este evento?',
      options: Object.freeze(roleOptions)
    }),
    ageQuestion: ageAware
      ? Object.freeze({
          id: 'age',
          label: eventType === 'quince' ? '¿Qué edad cumplirá?' : '¿Qué edad tiene el/la homenajeado/a?',
          mode: 'optional-exact-age',
          min: 0,
          max: 120
        })
      : null
  });
}

const ONBOARDING_PROFILES = Object.freeze({
  wedding: onboardingProfile('wedding', [
    option('novia', 'Novia'),
    option('novio', 'Novio'),
    option('pareja', 'Somos la pareja'),
    option('organiza', 'Ayudo a organizar')
  ]),
  birthday: onboardingProfile('birthday', [
    option('self', 'Es para mí'),
    option('child', 'Para mi hijo/a'),
    option('family', 'Para un familiar'),
    option('other', 'Para otra persona'),
    option('organizer', 'Ayudo a organizar')
  ]),
  quince: onboardingProfile('quince', [
    option('quinceanera', 'Es para mí'),
    option('parent', 'Para mi hija'),
    option('parents', 'Somos sus padres'),
    option('family', 'Para un familiar'),
    option('organizer', 'Ayudo a organizar')
  ]),
  baby_shower: onboardingProfile('baby_shower', [
    option('self', 'Es para mí'),
    option('parents', 'Somos los futuros padres'),
    option('partner', 'Para mi pareja'),
    option('other', 'Para otra persona'),
    option('organizer', 'Ayudo a organizar')
  ]),
  religious: onboardingProfile('religious', [
    option('child', 'Para mi hijo/a'),
    option('parents', 'Somos los padres'),
    option('family', 'Para un familiar'),
    option('organizer', 'Ayudo a organizar')
  ]),
  graduation: onboardingProfile('graduation', [
    option('self', 'Es para mí'),
    option('child', 'Para mi hijo/a'),
    option('family', 'Para un familiar'),
    option('other', 'Para otra persona'),
    option('organizer', 'Ayudo a organizar')
  ]),
  corporate: onboardingProfile('corporate', [
    option('company', 'Lo organizo para mi empresa'),
    option('internal-organizer', 'Soy parte del equipo organizador'),
    option('organizer', 'Ayudo a organizar')
  ]),
  custom: onboardingProfile('custom', [
    option('self', 'Es para mí'),
    option('child', 'Para mi hijo/a'),
    option('family', 'Para un familiar'),
    option('other', 'Para otra persona'),
    option('organizer', 'Ayudo a organizar')
  ])
});

function getOnboardingProfile(eventType) {
  const id = String(eventType || '').trim().toLowerCase();
  return ONBOARDING_PROFILES[id] || ONBOARDING_PROFILES.wedding;
}

export {
  ONBOARDING_ENGINE_ID,
  ONBOARDING_PROFILES,
  getOnboardingProfile
};
