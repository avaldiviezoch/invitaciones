'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const backgroundMusic = document.getElementById('backgroundMusic');

  function closeEntry() {
    if (entryLayer) entryLayer.hidden = true;
    document.body.classList.remove('entry-open');
  }

  function playBackgroundMusic() {
    if (!backgroundMusic) return;
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.45;
    backgroundMusic.play().catch(() => {});
  }

  function onEntryEnded() {
    closeEntry();
    playBackgroundMusic();
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
