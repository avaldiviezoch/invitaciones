'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const SAKE_BINKS_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/sake_binks.mp3';

  function closeEntry() {
    if (entryLayer) entryLayer.hidden = true;
    document.body.classList.remove('entry-open');
  }

  function startSakeDeBinks() {
    const backgroundMusic = new Audio(SAKE_BINKS_URL);
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.45;
    backgroundMusic.play().catch(() => {});
    window.invitationBackgroundMusic = backgroundMusic;
  }

  function onEntryEnded() {
    closeEntry();
    startSakeDeBinks();
  }

  function onEntryError() {
    closeEntry();
  }

  function startEntry() {
    if (!entryVideo || !entryVideo.paused) return;
    entryVideo.play().catch(() => {});
  }

  if (entryVideo) {
    entryVideo.controls = false;
    entryVideo.muted = false;
    entryVideo.addEventListener('ended', onEntryEnded, { once: true });
    entryVideo.addEventListener('error', onEntryError, { once: true });
  } else {
    closeEntry();
  }

  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    startEntry();
  });
})();
