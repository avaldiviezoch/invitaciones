'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const firstEntrance = document.getElementById('firstEntrance');
  const petals = document.getElementById('petals');
  const rsvpButton = document.getElementById('openRsvpBtn');
  const rsvpPanel = document.getElementById('rsvp-panel');
  const rsvpHost = document.querySelector('[data-mgd-rsvp-token]');
  const giftButton = document.getElementById('giftToggle');
  const giftDetails = document.getElementById('giftDetails');
  const musicButton = document.getElementById('openMusicBtn');
  const musicPanel = document.getElementById('music-request-panel');
  const musicHost = document.querySelector('[data-mgd-music-token]');
  const musicBurst = document.getElementById('musicBurst');
  const SAKE_BINKS_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/sake_binks.mp3';
  const RSVP_TOKEN = '8c7e5b5c261e4b85ad15a220ca70e0cc66d1336feee740c08027d0c324646167';
  const RSVP_WIDGET_URL = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260820-5b2';
  const WEDDING_DATE = new Date('2027-01-16T00:00:00-05:00').getTime();
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MUSIC_NOTE_PATHS = [
    'M9 4v10.2a3.7 3.7 0 1 0 2 3.3V8.2l7-1.6v6.1a3.7 3.7 0 1 0 2 3.3V3.4L9 5.8V4Z',
    'M14 3v11.1a4 4 0 1 0 2 3.7V7h5V3h-7Z'
  ];

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

  function renderCountdown() {
    const remaining = Math.max(0, WEDDING_DATE - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = value => String(value).padStart(2, '0');

    const daysElement = document.querySelector('[data-countdown-days]');
    const hoursElement = document.querySelector('[data-countdown-hours]');
    const minutesElement = document.querySelector('[data-countdown-minutes]');
    const secondsElement = document.querySelector('[data-countdown-seconds]');

    if (daysElement) daysElement.textContent = String(days);
    if (hoursElement) hoursElement.textContent = pad(hours);
    if (minutesElement) minutesElement.textContent = pad(minutes);
    if (secondsElement) secondsElement.textContent = pad(seconds);
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

  function toggleRsvp() {
    if (!rsvpButton || !rsvpPanel) return;
    const willOpen = rsvpPanel.hidden;
    rsvpPanel.hidden = !willOpen;
    rsvpButton.setAttribute('aria-expanded', String(willOpen));
  }

  function toggleGiftDetails() {
    if (!giftButton || !giftDetails) return;
    const willOpen = giftDetails.hidden;
    giftDetails.hidden = !willOpen;
    giftButton.setAttribute('aria-expanded', String(willOpen));
  }

  function createMusicBurst() {
    if (!musicBurst || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const vectors = [
      [-76,-70,-24,1],[-42,-96,15,.86],[6,-100,-14,1.08],[54,-78,24,.92],[82,-34,-18,1.04],
      [76,18,22,.82],[38,56,-12,.96],[-18,52,18,.82],[-66,26,-28,.96],[-88,-22,16,.84]
    ];

    vectors.forEach(([x,y,rotation,scale], index) => {
      const note = document.createElementNS(SVG_NS, 'svg');
      const path = document.createElementNS(SVG_NS, 'path');
      note.setAttribute('viewBox', '0 0 24 24');
      note.setAttribute('aria-hidden', 'true');
      note.style.setProperty('--tx', `${x}px`);
      note.style.setProperty('--ty', `${y}px`);
      note.style.setProperty('--rot', `${rotation}deg`);
      note.style.setProperty('--scale', String(scale));
      note.style.animationDelay = `${index * 18}ms`;
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('d', MUSIC_NOTE_PATHS[index % MUSIC_NOTE_PATHS.length]);
      note.appendChild(path);
      note.addEventListener('animationend', () => note.remove(), { once:true });
      musicBurst.appendChild(note);
    });
  }

  function toggleMusicRequest() {
    if (!musicButton || !musicPanel) return;
    const willOpen = musicPanel.hidden;
    musicPanel.hidden = !willOpen;
    musicButton.setAttribute('aria-expanded', String(willOpen));
    createMusicBurst();
  }

  async function copyGiftValue(button) {
    const value = button.dataset.copy;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = 'COPIADO';
      window.setTimeout(() => {
        button.textContent = original;
      }, 1000);
    } catch (error) {
      console.error('[Invitación] No se pudo copiar el dato del regalo.', error);
    }
  }

  createPetals();
  renderCountdown();
  window.setInterval(renderCountdown, 1000);

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

  if (rsvpHost) rsvpHost.setAttribute('data-mgd-rsvp-token', RSVP_TOKEN);
  if (musicHost) musicHost.setAttribute('data-mgd-music-token', RSVP_TOKEN);
  rsvpButton?.addEventListener('click', toggleRsvp);
  giftButton?.addEventListener('click', toggleGiftDetails);
  musicButton?.addEventListener('click', toggleMusicRequest);
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', () => copyGiftValue(button));
  });

  if (rsvpHost || musicHost) {
    import(RSVP_WIDGET_URL).catch(error => {
      console.error('[Invitación] No se pudo cargar el widget nativo.', error);
    });
  }
})();
