/* MI GRAN DÍA · UI DEV. Sin Firebase/Firestore/Storage/Auth. */
(() => {
  'use strict';
  document.documentElement.dataset.environment = 'development';
  window.MI_GRAN_DIA_DEV = Object.freeze({environment:'development',persistencePolicy:'protected'});

  const button = document.getElementById('openPanel');
  const panel = document.getElementById('plannerPanel');
  if (button && panel) {
    button.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
  }
})();
