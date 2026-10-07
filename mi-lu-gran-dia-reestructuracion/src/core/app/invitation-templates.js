const INVITATION_TEMPLATES = Object.freeze({
  'classic-elegant': Object.freeze({
    id: 'classic-elegant',
    label: 'Clásica elegante',
    presentationOnly: true
  }),
  'one-piece-elegant': Object.freeze({
    id: 'one-piece-elegant',
    label: 'One Piece elegante',
    presentationOnly: true
  }),
  'minimal-black': Object.freeze({
    id: 'minimal-black',
    label: 'Minimal black',
    presentationOnly: true
  })
});

function getInvitationTemplate(templateId) {
  const id = String(templateId || '').trim();
  return INVITATION_TEMPLATES[id] || INVITATION_TEMPLATES['classic-elegant'];
}

export { INVITATION_TEMPLATES, getInvitationTemplate };
