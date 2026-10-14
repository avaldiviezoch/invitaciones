const INVITATION_COPY = Object.freeze({
  wedding: Object.freeze({ heading: 'Nos casamos', greeting: 'Nos encantará compartir este día contigo', dateLabel: 'La celebración será el' }),
  birthday: Object.freeze({ heading: '¡Celebremos!', greeting: 'Ven a celebrar un cumpleaños muy especial', dateLabel: 'Te esperamos el' }),
  quince: Object.freeze({ heading: 'Mis quince años', greeting: 'Acompáñame en una noche inolvidable', dateLabel: 'Celebraremos el' }),
  baby_shower: Object.freeze({ heading: 'Baby shower', greeting: 'Celebremos juntos esta dulce espera', dateLabel: 'Nos reuniremos el' }),
  religious: Object.freeze({ heading: 'Una celebración especial', greeting: 'Acompáñanos en esta ceremonia familiar', dateLabel: 'La ceremonia será el' }),
  graduation: Object.freeze({ heading: '¡Lo logramos!', greeting: 'Compartamos la alegría de esta graduación', dateLabel: 'Celebraremos el' }),
  corporate: Object.freeze({ heading: 'Estás invitado', greeting: 'Será un gusto contar con tu participación', dateLabel: 'El evento será el' }),
  custom: Object.freeze({ heading: 'Estás invitado', greeting: 'Nos encantará compartir este momento contigo', dateLabel: 'Te esperamos el' })
});
function getInvitationCopy(eventType) {
  return INVITATION_COPY[String(eventType || '').toLowerCase()] || INVITATION_COPY.custom;
}
export { INVITATION_COPY, getInvitationCopy };
