const TEMPLATE_DEFINITIONS = {
  wedding: {
    id: 'wedding',
    mode: 'legacy-rich',
    groups: [
      'Preparación inicial',
      'Ceremonia civil y religiosa',
      'Local y recepción',
      'Vestimenta e indumentaria',
      'Comida y bebidas',
      'Música y entretenimiento',
      'Fotografía y video',
      'Invitaciones y papelería',
      'Belleza y preparación personal',
      'Últimos detalles'
    ],
    tasks: []
  },
  birthday: {
    id: 'birthday',
    mode: 'starter',
    groups: ['Local', 'Invitados', 'Comida y torta', 'Decoración', 'Música'],
    tasks: [
      ['Definir local o lugar del cumpleaños', 'Local'],
      ['Preparar lista de invitados', 'Invitados'],
      ['Enviar invitaciones', 'Invitados'],
      ['Elegir torta', 'Comida y torta'],
      ['Definir comida y bebidas', 'Comida y torta'],
      ['Definir decoración', 'Decoración'],
      ['Definir música', 'Música']
    ]
  },
  quince: {
    id: 'quince',
    mode: 'starter',
    groups: ['Vestimenta', 'Local', 'Invitados', 'Música y coreografía', 'Fotografía', 'Torta y decoración'],
    tasks: [
      ['Elegir vestido', 'Vestimenta'],
      ['Reservar salón o local', 'Local'],
      ['Preparar lista de invitados', 'Invitados'],
      ['Definir DJ o música', 'Música y coreografía'],
      ['Preparar coreografía', 'Música y coreografía'],
      ['Contratar fotografía', 'Fotografía'],
      ['Elegir torta', 'Torta y decoración'],
      ['Definir decoración', 'Torta y decoración']
    ]
  },
  baby_shower: {
    id: 'baby_shower',
    mode: 'starter',
    groups: ['Invitados', 'Decoración', 'Mesa de dulces', 'Regalos', 'Juegos', 'Fotografía'],
    tasks: [
      ['Preparar lista de invitados', 'Invitados'],
      ['Definir decoración', 'Decoración'],
      ['Organizar mesa de dulces', 'Mesa de dulces'],
      ['Preparar lista o dinámica de regalos', 'Regalos'],
      ['Definir juegos y actividades', 'Juegos'],
      ['Definir fotografía', 'Fotografía']
    ]
  },
  religious: {
    id: 'religious',
    mode: 'starter',
    groups: ['Ceremonia', 'Invitados', 'Recepción', 'Vestimenta', 'Recuerdos'],
    tasks: [
      ['Coordinar fecha y lugar de la ceremonia', 'Ceremonia'],
      ['Preparar lista de invitados', 'Invitados'],
      ['Definir recepción o reunión familiar', 'Recepción'],
      ['Definir vestimenta', 'Vestimenta'],
      ['Preparar recuerdos o detalles', 'Recuerdos']
    ]
  },
  graduation: {
    id: 'graduation',
    mode: 'starter',
    groups: ['Ceremonia', 'Invitados', 'Celebración', 'Vestimenta', 'Fotografía'],
    tasks: [
      ['Confirmar fecha y ceremonia', 'Ceremonia'],
      ['Preparar lista de invitados', 'Invitados'],
      ['Definir celebración', 'Celebración'],
      ['Preparar vestimenta', 'Vestimenta'],
      ['Definir fotografía', 'Fotografía']
    ]
  },
  corporate: {
    id: 'corporate',
    mode: 'starter',
    groups: ['Objetivo y agenda', 'Asistentes', 'Sede', 'Producción', 'Catering', 'Comunicación'],
    tasks: [
      ['Definir objetivo y agenda', 'Objetivo y agenda'],
      ['Preparar lista de asistentes', 'Asistentes'],
      ['Reservar sede', 'Sede'],
      ['Coordinar producción y equipamiento', 'Producción'],
      ['Definir catering', 'Catering'],
      ['Preparar comunicaciones e invitaciones', 'Comunicación']
    ]
  },
  custom: {
    id: 'custom',
    mode: 'starter',
    groups: ['Planificación', 'Invitados', 'Lugar', 'Proveedores'],
    tasks: [
      ['Definir objetivo del evento', 'Planificación'],
      ['Preparar lista de invitados', 'Invitados'],
      ['Definir lugar', 'Lugar'],
      ['Identificar proveedores necesarios', 'Proveedores']
    ]
  }
};

function freezeTemplate(definition) {
  const tasks = Object.freeze(definition.tasks.map(([title, category]) => Object.freeze({ title, category })));
  return Object.freeze({
    ...definition,
    groups: Object.freeze([...definition.groups]),
    tasks
  });
}

const CHECKLIST_TEMPLATES = Object.freeze(
  Object.fromEntries(Object.entries(TEMPLATE_DEFINITIONS).map(([id, definition]) => [id, freezeTemplate(definition)]))
);

function getChecklistTemplate(eventType) {
  const id = String(eventType || '').trim().toLowerCase();
  return CHECKLIST_TEMPLATES[id] || CHECKLIST_TEMPLATES.wedding;
}

export { CHECKLIST_TEMPLATES, getChecklistTemplate };
