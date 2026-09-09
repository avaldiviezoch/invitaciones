'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const firstEntrance = document.getElementById('firstEntrance');
  const petals = document.getElementById('petals');
  const SAKE_BINKS_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/sake_binks.mp3';

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

  function closeEntry() {
    if (entryLayer) entryLayer.hidden = true;
    document.body.classList.remove('entry-open');
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
    if (!entryVideo || !entryVideo.paused) return;
    entryVideo.play().catch(() => {});
  }

  createPetals();

  if (entryVideo) {
    entryVideo.controls = false;
    entryVideo.muted = false;
    entryVideo.addEventListener('ended', onEntryEnded, { once:true });
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
