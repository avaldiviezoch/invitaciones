const ONBOARDING_ENGINE_ID = 'adaptive-onboarding-v1';

function option(value, label) {
  return Object.freeze({ value, label });
}

function onboardingProfile(eventType, roleOptions) {
  return Object.freeze({
    profileId: eventType,
    engine: ONBOARDING_ENGINE_ID,
    firstQuestion: 'eventType',
    organizerRoleQuestion: Object.freeze({
      id: 'role',
      label: '¿Cuál es tu papel en este evento?',
      options: Object.freeze(roleOptions)
    })
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
    option('quinceanera', 'Soy la quinceañera/o'),
    option('parent', 'Mamá / papá'),
    option('family', 'Familiar'),
    option('organizer', 'Organizador/a')
  ]),
  baby_shower: onboardingProfile('baby_shower', [
    option('parents', 'Futura mamá / futuros padres'),
    option('family', 'Familiar'),
    option('friend', 'Amigo/a'),
    option('organizer', 'Organizador/a')
  ]),
  religious: onboardingProfile('religious', [
    option('parent', 'Mamá / papá'),
    option('family', 'Familiar'),
    option('godparent', 'Padrino / madrina'),
    option('organizer', 'Organizador/a')
  ]),
  graduation: onboardingProfile('graduation', [
    option('graduate', 'Soy el/la graduado/a'),
    option('family', 'Familiar'),
    option('institution', 'Institución / promoción'),
    option('organizer', 'Organizador/a')
  ]),
  corporate: onboardingProfile('corporate', [
    option('company', 'Represento a la empresa'),
    option('employee', 'Colaborador/a'),
    option('internal-organizer', 'Organizador interno'),
    option('external-organizer', 'Organizador / proveedor externo')
  ]),
  custom: onboardingProfile('custom', [
    option('self', 'Para mí'),
    option('other', 'Para otra persona'),
    option('organization', 'Para una organización'),
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
