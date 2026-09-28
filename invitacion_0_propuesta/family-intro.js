'use strict';

(() => {
  const entryLayer = document.getElementById('entryLayer');
  const entryVideo = document.getElementById('entryVideo');
  if (!entryLayer || !entryVideo) return;

  const ASSET = 'assets/';
  const memoryAudio = new Audio(ASSET + 'Alphaville_-_Forever_Young_Video_Lyrics_(mp3.pm).mp3');
  memoryAudio.preload = 'auto';
  memoryAudio.volume = 0.62;

  const scenes = [
    { duration:3200, kicker:'Papá, Mamá…', text:'Antes de comenzar…', photos:[], mode:'single', center:true },
    { duration:3000, text:'queremos decirles algo.', photos:['papas.jpg'], mode:'single', center:false },
    { duration:5200, text:'Gracias por acompañarnos,<br>por guiarnos<br>y por estar siempre presentes.', photos:['papas.jpg','papas2.jpg'], mode:'duo' },
    { duration:4800, text:'Y aunque muchas veces<br>no hayan estado de acuerdo…', photos:['papas2.jpg'], mode:'single' },
    { duration:4700, text:'<strong>juntos construyeron<br>algo realmente hermoso.</strong>', photos:['papas.jpg','papas2.jpg'], mode:'duo' },
    { duration:5200, text:'Una familia que creció,<br>que se hizo más grande con los años…', photos:['papaymanolo.jpg','mamaykaren.jpg','manolo1.jpg','karencitas.jpg'], mode:'collage' },
    { duration:5600, text:'y que, entre hijos y nietos,<br>hoy sigue estando unida<br>y queriéndose muchísimo.', photos:['hermanos.jpg','gemelos1.jpg','manolitos.jpg','manolitos2.jpg'], mode:'collage' },
    { duration:5200, text:'<strong>Esta es la familia<br>que ustedes comenzaron.</strong>', photos:['FAMILIA.jpg','FAMILIA%202.JPG','papacontoos.jpg'], mode:'collage' },
    { duration:3200, kicker:'Y ahora…', text:'esa historia también nos acompaña', photos:['papacontoos.jpg'], mode:'single' },
    { duration:5000, text:'en uno de los días más importantes<br>de nuestras vidas.', photos:['FAMILIA%202.JPG'], mode:'single' },
    { duration:6200, kicker:'Gracias', text:'por ser parte de nuestra historia.<br><strong>Lucero &amp; Antonio</strong>', photos:['antonioylucero.jpeg'], mode:'final' }
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
      '<div id="familyIntroMedia" class="family-intro-media"></div>' +
      '<div id="familyIntroCopy" class="family-intro-copy"></div>' +
      '<div class="family-intro-progress" aria-hidden="true"><span id="familyIntroProgress"></span></div>' +
    '</div>';
  entryLayer.appendChild(shell);

  const media = shell.querySelector('#familyIntroMedia');
  const copy = shell.querySelector('#familyIntroCopy');
  const progress = shell.querySelector('#familyIntroProgress');

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
    media.className = 'family-intro-media mode-' + (scene.mode || 'single');
    media.replaceChildren();

    (scene.photos || []).forEach((file, index) => {
      const img = document.createElement('img');
      img.className = 'family-intro-photo';
      img.src = ASSET + file;
      img.alt = '';
      img.decoding = 'async';
      img.style.setProperty('--photo-duration', Math.max(3.4, scene.duration / 1000 + .6) + 's');
      img.style.animationDelay = (index * .16) + 's';
      media.appendChild(img);
    });

    copy.className = 'family-intro-copy' + (scene.center ? ' is-center' : '');
    copy.innerHTML =
      (scene.kicker ? '<span class="family-intro-kicker">' + scene.kicker + '</span>' : '') +
      '<p class="family-intro-text">' + scene.text + '</p>';

    progressElapsed += scene.duration;
    progress.style.width = Math.min(100, (progressElapsed / totalDuration) * 100) + '%';
  }

  function fadeMemoryAudio() {
    const startVolume = memoryAudio.volume;
    const steps = 15;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      memoryAudio.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step < steps) return;
      window.clearInterval(timer);
      memoryAudio.pause();
      try { memoryAudio.currentTime = 17; } catch (_) {}
      memoryAudio.volume = 0.62;
    }, 70);
  }

  async function handoffToOriginalVideo() {
    state = 'handoff';
    fadeMemoryAudio();
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
      if (button) {
        button.addEventListener('click', async event => {
          event.stopPropagation();
          try {
            await entryVideo.play();
            shell.hidden = true;
            state = 'done';
          } catch (_) {}
        }, { once:true });
      }
    }
  }

  async function playFamilyIntro() {
    if (state !== 'idle') return;
    state = 'playing';
    shell.classList.add('is-started');
    beginForeverYoung();

    await wait(650);
    for (const scene of scenes) {
      renderScene(scene);
      await wait(scene.duration);
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