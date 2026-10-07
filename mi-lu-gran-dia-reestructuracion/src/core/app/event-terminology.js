const DEFAULT_TERMINOLOGY = Object.freeze({
  event: 'evento',
  eventPlural: 'eventos',
  host: 'organizador',
  guest: 'invitado',
  guestPlural: 'invitados',
  primaryTable: 'Mesa principal',
  ceremonyPlace: 'Lugar de la ceremonia',
  defaultName: 'Mi evento',
  startPrompt: 'Empieza a darle forma a tu evento',
  checklistPendingDetail: 'Revisa el Checklist y elige el siguiente pendiente del evento.'
});

const EVENT_TERMINOLOGY = Object.freeze({
  wedding: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'boda',
    eventPlural: 'bodas',
    host: 'pareja',
    primaryTable: 'Mesa de novios',
    ceremonyPlace: 'Iglesia / lugar de ceremonia',
    defaultName: 'Mi boda',
    startPrompt: 'Empieza a darle forma a tu boda',
    checklistPendingDetail: 'Revisa el Checklist y elige el siguiente pendiente de la boda.'
  }),
  birthday: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'cumpleaños',
    eventPlural: 'cumpleaños',
    host: 'homenajeado',
    primaryTable: 'Mesa del homenajeado',
    defaultName: 'Mi cumpleaños',
    startPrompt: 'Empieza a darle forma a tu cumpleaños',
    checklistPendingDetail: 'Revisa el Checklist y elige el siguiente pendiente del cumpleaños.'
  }),
  quince: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: '15 años',
    eventPlural: 'fiestas de 15 años',
    host: 'quinceañera/o',
    primaryTable: 'Mesa principal',
    defaultName: 'Mis 15 años',
    startPrompt: 'Empieza a darle forma a tus 15 años'
  }),
  baby_shower: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'baby shower',
    eventPlural: 'baby showers',
    host: 'futuros padres',
    primaryTable: 'Mesa principal',
    defaultName: 'Mi baby shower',
    startPrompt: 'Empieza a darle forma a tu baby shower'
  }),
  religious: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'celebración religiosa',
    eventPlural: 'celebraciones religiosas',
    host: 'familia',
    primaryTable: 'Mesa principal',
    ceremonyPlace: 'Iglesia / parroquia',
    defaultName: 'Mi celebración'
  }),
  graduation: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'graduación',
    eventPlural: 'graduaciones',
    host: 'graduado/a',
    primaryTable: 'Mesa principal',
    defaultName: 'Mi graduación'
  }),
  corporate: Object.freeze({
    ...DEFAULT_TERMINOLOGY,
    event: 'evento corporativo',
    eventPlural: 'eventos corporativos',
    host: 'organización',
    guest: 'asistente',
    guestPlural: 'asistentes',
    primaryTable: 'Mesa principal',
    ceremonyPlace: 'Sede',
    defaultName: 'Mi evento corporativo'
  }),
  custom: Object.freeze({ ...DEFAULT_TERMINOLOGY })
});

function getEventTerminology(eventType) {
  const id = String(eventType || '').trim().toLowerCase();
  return EVENT_TERMINOLOGY[id] || EVENT_TERMINOLOGY.wedding;
}

export { DEFAULT_TERMINOLOGY, EVENT_TERMINOLOGY, getEventTerminology };
