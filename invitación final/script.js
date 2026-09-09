'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const backgroundMusic = document.getElementById('backgroundMusic');

  let entryStarted = false;
  let entryFinished = false;

  function stopBackgroundMusic() {
    if (!backgroundMusic) return;
    backgroundMusic.pause();
    try {
      backgroundMusic.currentTime = 0;
    } catch (error) {}
  }

  function closeEntry() {
    if (!entryLayer || entryLayer.hidden) return;
    entryLayer.hidden = true;
    document.body.classList.remove('entry-open');
  }

  async function startBackgroundMusic() {
    if (!backgroundMusic || !entryFinished) return;

    backgroundMusic.volume = 0.45;
    try {
      backgroundMusic.currentTime = 0;
    } catch (error) {}

    try {
      await backgroundMusic.play();
    } catch (error) {}
  }

  function finishEntryNormally() {
    entryFinished = true;
    closeEntry();
    startBackgroundMusic();
  }

  function prepareEntry() {
    stopBackgroundMusic();

    if (!entryVideo) {
      closeEntry();
      return;
    }

    entryVideo.autoplay = false;
    entryVideo.controls = false;
    entryVideo.muted = false;
    entryVideo.defaultMuted = false;
    entryVideo.removeAttribute('muted');
    entryVideo.setAttribute('playsinline', '');
    entryVideo.setAttribute('webkit-playsinline', '');
    entryVideo.pause();

    try {
      entryVideo.currentTime = 0.001;
    } catch (error) {}

    entryVideo.addEventListener('ended', finishEntryNormally, { once:true });
    entryVideo.addEventListener('error', closeEntry, { once:true });
    entryVideo.load();
  }

  function startEntry() {
    if (!entryVideo || entryStarted) return;

    stopBackgroundMusic();
    entryStarted = true;

    const playback = entryVideo.play();
    playback?.catch(() => {
      entryStarted = false;
    });
  }

  backgroundMusic?.addEventListener('play', () => {
    if (!entryFinished) stopBackgroundMusic();
  });

  prepareEntry();

  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    startEntry();
  });
})();
