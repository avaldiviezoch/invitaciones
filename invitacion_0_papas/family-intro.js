'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  if (!entryLayer || !entryVideo) return;

  const ASSET = 'assets/';
  const MEMORY_VIDEO = ASSET + 'WhatsApp Video 2026-09-28 at 10.03.40 PM.mp4';
  const memoryAudio = new Audio(ASSET + 'Alphaville_-_Forever_Young_Video_Lyrics_(mp3.pm).mp3');

  memoryAudio.preload = 'auto';
  memoryAudio.volume = 0.036;

  let state = 'idle';

  const shell = document.createElement('div');
  shell.id = 'familyIntro';
  shell.className = 'family-intro-shell';
  shell.setAttribute('aria-label', 'Video especial para nuestros padres');
  shell.innerHTML =
    '<div class="family-intro-start">' +
      '<strong>Para ustedes</strong>' +
      '<span>Toca para comenzar</span>' +
    '</div>' +
    '<div class="family-intro-stage">' +
      '<div class="family-intro-media">' +
        '<video id="familyMemoryVideo" class="family-intro-video" playsinline webkit-playsinline preload="auto">' +
          '<source src="' + encodeURI(MEMORY_VIDEO) + '" type="video/mp4">' +
        '</video>' +
      '</div>' +
    '</div>';

  entryLayer.appendChild(shell);

  const memoryVideo = shell.querySelector('#familyMemoryVideo');

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function beginForeverYoung() {
    try {
      memoryAudio.currentTime = 17;
    } catch (_) {
      memoryAudio.addEventListener('loadedmetadata', () => {
        memoryAudio.currentTime = 17;
      }, { once:true });
    }
    memoryAudio.play().catch(() => {});
  }

  function stopMemoryAudio() {
    memoryAudio.pause();
    try { memoryAudio.currentTime = 17; } catch (_) {}
  }

  async function handoffToOriginalVideo() {
    state = 'handoff';
    stopMemoryAudio();
    shell.classList.add('is-leaving');
    await wait(700);

    try {
      await entryVideo.play();
      shell.hidden = true;
      state = 'done';
    } catch (_) {
      shell.classList.remove('is-leaving');
      shell.innerHTML = '<button class="family-intro-continue" type="button">Toca para continuar</button>';
      state = 'awaiting-video';

      const button = shell.querySelector('button');
      button?.addEventListener('click', async event => {
        event.stopPropagation();
        try {
          await entryVideo.play();
          shell.hidden = true;
          state = 'done';
        } catch (_) {}
      }, { once:true });
    }
  }

  async function playFamilyIntro() {
    if (state !== 'idle') return;

    state = 'playing';
    shell.classList.add('is-started');

    beginForeverYoung();

    if (!memoryVideo) {
      await handoffToOriginalVideo();
      return;
    }

    memoryVideo.muted = true;
    memoryVideo.currentTime = 0;

    memoryVideo.addEventListener('ended', handoffToOriginalVideo, { once:true });

    try {
      await memoryVideo.play();
    } catch (_) {}
  }

  function interceptEntry(event) {
    if (state === 'done' || state === 'handoff' || state === 'awaiting-video') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    playFamilyIntro();
  }

  entryLayer.addEventListener('click', interceptEntry, true);
  entryLayer.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    interceptEntry(event);
  }, true);
})();