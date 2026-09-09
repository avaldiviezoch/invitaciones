'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const backgroundMusic = document.getElementById('backgroundMusic');
  let entryStarted = false;

  function finishEntry() {
    if (!entryLayer || entryLayer.hidden) return;
    entryLayer.hidden = true;
    document.body.classList.remove('entry-open');

    if (!backgroundMusic) return;
    backgroundMusic.volume = 0.45;
    const playback = backgroundMusic.play();
    playback?.catch(() => {});
  }

  function prepareEntry() {
    if (!entryVideo) {
      finishEntry();
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

    entryVideo.addEventListener('ended', finishEntry, { once:true });
    entryVideo.addEventListener('error', finishEntry, { once:true });
    entryVideo.load();
  }

  function startEntry() {
    if (!entryVideo || entryStarted) return;
    entryStarted = true;

    const playback = entryVideo.play();
    playback?.catch(() => {
      entryStarted = false;
    });
  }

  prepareEntry();

  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    startEntry();
  });
})();
