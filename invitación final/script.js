'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const firstEntrance = document.getElementById('firstEntrance');
  const petals = document.getElementById('petals');

  const ENTRY_VIDEO_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/video_entrada.mp4';
  const SAKE_BINKS_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/sake_binks.mp3';

  let entryReady = false;
  let entryVideoObjectUrl = null;

  function createPetals() {
    if (!petals) return;

    const petalCount = 55;
    for (let i = 0; i < petalCount; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';

      const left = Math.random() * 100;
      const fallDuration = 11 + Math.random() * 10;
      const swayDuration = 3 + Math.random() * 3;
      const spinDuration = 6 + Math.random() * 5;
      const delay = Math.random() * -18;
      const scale = 0.7 + Math.random() * 0.9;

      petal.style.left = `${left}vw`;
      petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s, ${spinDuration}s`;
      petal.style.animationDelay = `${delay}s, ${delay}s, ${delay}s`;
      petal.style.transform = `scale(${scale})`;
      petal.style.opacity = (0.35 + Math.random() * 0.35).toFixed(2);

      petals.appendChild(petal);
    }
  }

  function markEntryReady() {
    if (!entryLayer || !entryVideo) return;
    entryReady = true;
    entryLayer.classList.remove('is-loading');
    entryLayer.classList.add('is-ready');
    entryLayer.setAttribute('aria-busy', 'false');
    entryVideo.setAttribute('aria-hidden', 'false');
  }

  async function loadEntryVideo() {
    if (!entryVideo) return;

    try {
      const response = await fetch(ENTRY_VIDEO_URL, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`No se pudo cargar el video: ${response.status}`);

      const videoBlob = await response.blob();
      entryVideoObjectUrl = URL.createObjectURL(videoBlob);
      entryVideo.src = entryVideoObjectUrl;
      entryVideo.load();

      await new Promise((resolve, reject) => {
        const handleLoadedData = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error('El navegador no pudo preparar el primer frame.'));
        };
        const cleanup = () => {
          entryVideo.removeEventListener('loadeddata', handleLoadedData);
          entryVideo.removeEventListener('error', handleError);
        };

        entryVideo.addEventListener('loadeddata', handleLoadedData, { once: true });
        entryVideo.addEventListener('error', handleError, { once: true });
      });

      entryVideo.currentTime = 0;
      markEntryReady();
    } catch (error) {
      entryVideo.src = ENTRY_VIDEO_URL;
      entryVideo.load();
      entryVideo.addEventListener('loadeddata', markEntryReady, { once: true });
    }
  }

  function closeEntry() {
    if (entryLayer) entryLayer.hidden = true;
    document.body.classList.remove('entry-open');

    if (entryVideoObjectUrl) {
      URL.revokeObjectURL(entryVideoObjectUrl);
      entryVideoObjectUrl = null;
    }
  }

  function startFirstEntrance() {
    firstEntrance?.classList.add('is-active');
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
    startFirstEntrance();
    startSakeDeBinks();
  }

  function startEntry() {
    if (!entryVideo || !entryReady || !entryVideo.paused) return;
    entryVideo.play().catch(() => {});
  }

  createPetals();

  if (entryVideo) {
    entryVideo.controls = false;
    entryVideo.muted = false;
    entryVideo.addEventListener('ended', onEntryEnded, { once: true });
    loadEntryVideo();
  } else {
    closeEntry();
    startFirstEntrance();
  }

  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    startEntry();
  });
})();
