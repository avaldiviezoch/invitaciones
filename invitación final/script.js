'use strict';

(() => {
  const WEDDING_DATE = new Date('2027-01-16T16:00:00-05:00');
  const N7_TOKEN = '8c7e5b5c261e4b85ad15a220ca70e0cc66d1336feee740c08027d0c324646167';
  const NATIVE_WIDGET = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260820-5b2';

  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  const backgroundMusic = document.getElementById('backgroundMusic');
  let entryStarted = false;

  document.body.classList.add('entry-open');

  function finishEntry() {
    if (!entryLayer || entryLayer.hidden) return;
    entryLayer.hidden = true;
    document.body.classList.remove('entry-open');
  }

  function prepareEntry() {
    if (!entryVideo) {
      finishEntry();
      return;
    }

    entryVideo.autoplay = false;
    entryVideo.muted = true;
    entryVideo.defaultMuted = true;
    entryVideo.controls = false;
    entryVideo.setAttribute('muted', '');
    entryVideo.setAttribute('playsinline', '');
    entryVideo.setAttribute('webkit-playsinline', '');
    entryVideo.pause();

    try {
      entryVideo.currentTime = 0.001;
    } catch (error) {
      // El navegador posicionará el primer frame cuando haya metadata.
    }

    entryVideo.addEventListener('loadedmetadata', () => {
      if (entryStarted) return;
      entryVideo.pause();
      try {
        entryVideo.currentTime = Math.max(entryVideo.currentTime, 0.001);
      } catch (error) {
        // No se requiere acción adicional.
      }
    }, { once: true });

    entryVideo.addEventListener('ended', finishEntry, { once: true });
    entryVideo.addEventListener('error', finishEntry, { once: true });
    entryVideo.load();
  }

  function startBackgroundMusic() {
    if (!backgroundMusic) return;
    backgroundMusic.volume = 0.45;
    const playback = backgroundMusic.play();
    playback?.catch(() => {});
  }

  function startEntry() {
    if (!entryVideo || entryStarted) return;
    entryStarted = true;
    entryLayer?.classList.add('is-playing');
    startBackgroundMusic();

    const playback = entryVideo.play();
    playback?.catch(() => {
      entryStarted = false;
      entryLayer?.classList.remove('is-playing');
    });
  }

  prepareEntry();
  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    startEntry();
  });

  function updateCountdown() {
    const countdown = document.getElementById('countdown');
    if (!countdown) return;

    const remaining = Math.max(0, WEDDING_DATE.getTime() - Date.now());
    const values = [
      ['Días', Math.floor(remaining / 86400000)],
      ['Horas', Math.floor((remaining % 86400000) / 3600000)],
      ['Min', Math.floor((remaining % 3600000) / 60000)],
      ['Seg', Math.floor((remaining % 60000) / 1000)]
    ];

    countdown.innerHTML = values
      .map(([label, value]) => `<div><strong>${String(value).padStart(2, '0')}</strong><span>${label}</span></div>`)
      .join('');
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  function togglePanel(button, panel) {
    if (!button || !panel) return;
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  const rsvpButton = document.getElementById('openRsvpBtn');
  const rsvpPanel = document.getElementById('rsvp-panel');
  rsvpButton?.addEventListener('click', () => togglePanel(rsvpButton, rsvpPanel));

  const musicButton = document.getElementById('openMusicBtn');
  const musicPanel = document.getElementById('music-request-panel');
  musicButton?.addEventListener('click', () => togglePanel(musicButton, musicPanel));

  const giftButton = document.getElementById('giftToggle');
  const giftDetails = document.getElementById('giftDetails');
  giftButton?.addEventListener('click', () => togglePanel(giftButton, giftDetails));

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'COPIADO';
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 1100);
      } catch (error) {
        button.textContent = originalLabel;
      }
    });
  });

  document.querySelectorAll('[data-mgd-rsvp-token],[data-mgd-music-token]').forEach(host => {
    if (host.hasAttribute('data-mgd-rsvp-token')) {
      host.setAttribute('data-mgd-rsvp-token', N7_TOKEN);
    }
    if (host.hasAttribute('data-mgd-music-token')) {
      host.setAttribute('data-mgd-music-token', N7_TOKEN);
    }
  });

  function preloadCrewGif() {
    const crewImage = document.querySelector('.crew-section img');
    if (!crewImage) return;

    const preload = () => {
      const image = new Image();
      image.src = crewImage.currentSrc || crewImage.src;
    };

    if (!('IntersectionObserver' in window)) {
      preload();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      preload();
    }, { rootMargin: '1800px 0px', threshold: 0 });

    observer.observe(crewImage);
  }

  preloadCrewGif();

  import(NATIVE_WIDGET).catch(error => {
    console.error('[Invitación final] No se pudo cargar el módulo de confirmación y música.', error);
  });
})();
