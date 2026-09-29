'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  if (!entryLayer || !entryVideo) return;

  const ASSET = 'assets/';
  const MEMORY_VIDEO = ASSET + 'WhatsApp Video 2026-09-28 at 10.03.40 PM.mp4';
  const memoryAudio = new Audio(ASSET + 'Alphaville_-_Forever_Young_Video_Lyrics_(mp3.pm).mp3');
  memoryAudio.preload = 'auto';
  memoryAudio.volume = 0.12;

  const scenes = [
    { duration:3200, kicker:'Papá, Mamá…', text:'Antes de comenzar…', center:true },
    { duration:3000, text:'queremos decirles algo.' },
    { duration:5200, text:'Gracias por acompañarnos,<br>por guiarnos<br>y por estar siempre presentes.' },
    { duration:4800, text:'Y aunque muchas veces<br>no hayan estado de acuerdo…' },
    { duration:4700, text:'<strong>juntos construyeron<br>algo realmente hermoso.</strong>' },
    { duration:5400, text:'<strong>Ustedes dos crearon una gran familia,</strong><br>rodeada de hijos y nietos,<br>a quienes queremos muchísimo.' },
    { duration:6200, text:'Y esperamos que, así como han acompañado<br>nuestra historia hasta hoy,<br>también nos acompañen en esta nueva etapa<br>que estamos por comenzar.' },
    { duration:5000, text:'<strong>Esta es la familia<br>que ustedes comenzaron.</strong>' },
    { duration:3200, kicker:'Y ahora…', text:'esa historia también nos acompaña' },
    { duration:5000, text:'en uno de los días más importantes<br>de nuestras vidas.' },
    { duration:6200, kicker:'Gracias', text:'por ser parte de nuestra historia.<br><strong>Lucero &amp; Antonio</strong>' }
  ];

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  let state = 'idle';
  let progressElapsed = 0;

  const shell = document.createElement('div');
  shell.id = 'familyIntro';
  shell.className = 'family-intro-shell';
  shell.setAttribute('aria-label', 'Introducción especial para nuestros padres');
  shell.innerHTML =
    '<div class="family-intro-start">' +
      '<strong>Para ustedes</strong>' +
      '<span>Toca para comenzar</span>' +
    '</div>' +
    '<div class="family-intro-stage" aria-live="polite">' +
      '<div id="familyIntroMedia" class="family-intro-media">' +
        '<video id="familyMemoryVideo" class="family-intro-video" playsinline webkit-playsinline preload="auto">' +
          '<source src="' + encodeURI(MEMORY_VIDEO) + '" type="video/mp4">' +
        '</video>' +
        '<div class="family-intro-video-shade" aria-hidden="true"></div>' +
      '</div>' +
      '<div id="familyIntroCopy" class="family-intro-copy"></div>' +
      '<div class="family-intro-progress" aria-hidden="true"><span id="familyIntroProgress"></span></div>' +
    '</div>';
  entryLayer.appendChild(shell);

  const copy = shell.querySelector('#familyIntroCopy');
  const progress = shell.querySelector('#familyIntroProgress');
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

  function renderScene(scene) {
    copy.className = 'family-intro-copy' + (scene.center ? ' is-center' : '');
    copy.innerHTML =
      (scene.kicker ? '<span class="family-intro-kicker">' + scene.kicker + '</span>' : '') +
      '<p class="family-intro-text">' + scene.text + '</p>';

    progressElapsed += scene.duration;
    progress.style.width = Math.min(100, (progressElapsed / totalDuration) * 100) + '%';
  }

  function fadeMemoryAudio() {
    const startVolume = memoryAudio.volume;
    const steps = 12;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      memoryAudio.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step < steps) return;
      window.clearInterval(timer);
      memoryAudio.pause();
      memoryAudio.volume = 0.12;
    }, 70);
  }

  async function handoffToOriginalVideo() {
    state = 'handoff';
    fadeMemoryAudio();
    if (memoryVideo && !memoryVideo.paused) memoryVideo.pause();
    shell.classList.add('is-leaving');
    await wait(850);

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
    if (memoryVideo) {
      memoryVideo.muted = true;
      memoryVideo.currentTime = 0;
      memoryVideo.play().catch(() => {});
    }

    await wait(650);
    for (const scene of scenes) {
      renderScene(scene);
      await wait(scene.duration);
    }

    if (memoryVideo && !memoryVideo.ended) {
      await new Promise(resolve => {
        const fallback = window.setTimeout(resolve, 12000);
        memoryVideo.addEventListener('ended', () => {
          window.clearTimeout(fallback);
          resolve();
        }, { once:true });
      });
    }

    await handoffToOriginalVideo();
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