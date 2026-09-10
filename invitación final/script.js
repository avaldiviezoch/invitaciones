'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const firstEntrance = document.getElementById('firstEntrance');
  const petals = document.getElementById('petals');
  const rsvpButton = document.getElementById('openRsvpBtn');
  const rsvpPanel = document.getElementById('rsvp-panel');
  const rsvpHost = document.querySelector('[data-mgd-rsvp-token]');
  const SAKE_BINKS_URL = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/sake_binks.mp3';
  const RSVP_TOKEN = '8c7e5b5c261e4b85ad15a220ca70e0cc66d1336feee740c08027d0c324646167';
  const RSVP_WIDGET_URL = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260820-5b2';
  const WEDDING_DATE = new Date('2027-01-16T00:00:00-05:00').getTime();

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
  rsvpButton?.addEventListener('click', toggleRsvp);

  if (rsvpHost) {
    import(RSVP_WIDGET_URL).catch(error => {
      console.error('[Invitación] No se pudo cargar el RSVP nativo.', error);
    });
  }
})();
