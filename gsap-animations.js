gsap.registerPlugin(ScrollTrigger);

const CONFIG = {
  FORM_ENDPOINT: 'https://formspree.io/f/xpwzgvqr',
  REEL_VIDEO_ID: 'ScMzIvxBSi4',
  PRELOAD_MIN_MS: 800,
  PRELOAD_MAX_MS: 1500,
};

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let archiveData = null;
let archiveBuilt = false;
let preloadFinished = false;
let preloadStartTime = Date.now();

/* ── Theme toggle ── */
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('lumen-theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);

  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const isLight = current === 'light' || (!current && systemLight);
    const next = isLight ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lumen-theme', next);
    toggle.textContent = next === 'light' ? 'Dark' : 'Light';
  });

  const initTheme = document.documentElement.getAttribute('data-theme');
  const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (toggle) {
    toggle.textContent = (initTheme === 'light' || (!initTheme && systemLight)) ? 'Dark' : 'Light';
  }
}

/* ── Nav scroll backdrop ── */
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('nav-scrolled', window.scrollY > 80);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Archive data & lazy build ── */
async function loadArchiveData() {
  try {
    const res = await fetch('data/archive.json');
    archiveData = await res.json();
  } catch {
    archiveData = { locations: [], films: [] };
    for (let i = 1; i <= 26; i++) {
      archiveData.films.push({
        id: i,
        name: `Archive Frame ${i}`,
        image: `images/C${i}.jpg`,
      });
    }
    archiveData.locations = ['Heritage Estate'];
  }
}

function handleImageError(img) {
  img.classList.add('is-placeholder');
  img.removeAttribute('src');
  img.alt = 'Image unavailable';
}

function loadFrameImage(img) {
  const src = img.dataset.src;
  if (!src || img.src) return;
  img.src = src;
  img.addEventListener('error', () => handleImageError(img), { once: true });
}

function buildFilmArchive() {
  if (archiveBuilt || !archiveData) return;
  archiveBuilt = true;

  const track = document.getElementById('filmsTrack');
  if (!track) return;

  const fragment = document.createDocumentFragment();
  const { films, locations } = archiveData;

  films.forEach((film, index) => {
    const frame = document.createElement('article');
    frame.className = 'film-frame';
    frame.dataset.cursor = 'view';
    const location = locations[index % locations.length] || 'Private Estate';
    frame.innerHTML = `
      <div class="film-frame-media">
        <img data-src="${film.image}" alt="${film.name}" class="lazy-load-img" loading="lazy" decoding="async">
      </div>
      <div class="film-frame-meta">
        <p class="film-frame-location">${location}</p>
        <h3 class="film-frame-name">${film.name}</h3>
        <a href="#invitation" class="film-frame-link" rel="noopener noreferrer">View Story →</a>
      </div>`;
    fragment.appendChild(frame);
  });

  track.appendChild(fragment);

  const lazyImages = track.querySelectorAll('img[data-src]');
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadFrameImage(entry.target);
        imgObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  lazyImages.forEach((img) => imgObserver.observe(img));

  initFilmsScroll();
  initFilmFrameReveal();
  ScrollTrigger.refresh();
}

function initArchiveObserver() {
  const filmsSection = document.getElementById('films');
  if (!filmsSection) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        buildFilmArchive();
        sectionObserver.disconnect();
      }
    });
  }, { rootMargin: '300px' });

  sectionObserver.observe(filmsSection);
}

/* ── Custom SplitText ── */
function splitChars(el) {
  const text = el.textContent;
  el.innerHTML = '';
  text.split('').forEach((char) => {
    const span = document.createElement('span');
    span.className = 'split-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    el.appendChild(span);
  });
  return el.querySelectorAll('.split-char');
}

function splitLines(container) {
  container.querySelectorAll('[data-split]').forEach((line) => splitChars(line));
}

/* ── Preloader (above-fold only) ── */
const preloader = document.getElementById('preloader');
const preloaderFill = document.getElementById('preloaderFill');
const criticalImages = [...document.querySelectorAll('#opening img, img[loading="eager"]')];
let loaded = 0;
let finishQueued = false;

function tryFinishPreload() {
  if (preloadFinished || finishQueued) return;
  const elapsed = Date.now() - preloadStartTime;
  const allLoaded = loaded >= criticalImages.length;
  if (!allLoaded && elapsed < CONFIG.PRELOAD_MAX_MS) return;
  if (elapsed < CONFIG.PRELOAD_MIN_MS) {
    setTimeout(tryFinishPreload, CONFIG.PRELOAD_MIN_MS - elapsed);
    return;
  }
  finishQueued = true;
  finishPreload();
}

function imageLoaded() {
  loaded++;
  const pct = criticalImages.length ? (loaded / criticalImages.length) * 100 : 100;
  gsap.to(preloaderFill, { width: `${pct}%`, duration: 0.3, ease: 'power1.out' });
  tryFinishPreload();
}

criticalImages.forEach((img) => {
  if (img.complete) imageLoaded();
  else {
    img.addEventListener('load', imageLoaded);
    img.addEventListener('error', imageLoaded);
  }
});

setTimeout(tryFinishPreload, CONFIG.PRELOAD_MAX_MS);
if (criticalImages.length === 0) tryFinishPreload();

function finishPreload() {
  if (preloadFinished) return;
  preloadFinished = true;

  splitLines(document);

  gsap.timeline()
    .to(preloaderFill, { width: '100%', duration: 0.4 })
    .to(preloader, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        requestAnimationFrame(() => initSite());
      },
    });
}

/* ── Custom cursor (desktop only, with teardown) ── */
function initCursor() {
  const cursorMM = gsap.matchMedia();

  cursorMM.add('(min-width: 901px) and (hover: hover) and (pointer: fine)', () => {
    const cursor = document.getElementById('cursor');
    const label = document.getElementById('cursorLabel');
    if (!cursor || !label) return;

    let mx = 0, my = 0, cx = 0, cy = 0;
    let ticking = true;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      ticking = true;
    };

    document.addEventListener('mousemove', onMove);

    const labels = { view: 'View', play: 'Play', contact: 'Write', send: 'Send', home: '' };

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        const l = labels[el.dataset.cursor];
        if (l) { label.textContent = l; label.classList.add('visible'); }
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        label.classList.remove('visible');
      });
    });

    document.querySelectorAll('.film-frame, .reel-cta, .form-submit, a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    const cursorTick = () => {
      if (!ticking) return;
      const dx = Math.abs(mx - cx);
      const dy = Math.abs(my - cy);
      if (dx < 0.5 && dy < 0.5) { ticking = false; return; }
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      gsap.set(cursor, { x: cx, y: cy, force3D: true });
      gsap.set(label, { x: cx, y: cy + 28, force3D: true });
      if (dx > 0.5 || dy > 0.5) ticking = true;
    };

    gsap.ticker.add(cursorTick);

    const onVisibility = () => {
      if (document.hidden) gsap.ticker.remove(cursorTick);
      else gsap.ticker.add(cursorTick);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      gsap.ticker.remove(cursorTick);
    };
  });
}

/* ── Form validation & submission ── */
function initForm() {
  const form = document.getElementById('invitationForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  const fields = {
    name: { el: document.getElementById('name'), validate: (v) => v.trim().length >= 2 },
    email: { el: document.getElementById('email'), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    venue: { el: document.getElementById('venue'), validate: (v) => v.trim().length >= 2 },
    message: { el: document.getElementById('message'), validate: (v) => v.trim().length >= 10 },
  };

  function showError(key, msg) {
    const row = fields[key].el.closest('.form-row');
    const errEl = row.querySelector('.form-error');
    row.classList.add('has-error');
    if (errEl) errEl.textContent = msg;
  }

  function clearErrors() {
    Object.values(fields).forEach(({ el }) => {
      const row = el.closest('.form-row');
      row.classList.remove('has-error');
      const errEl = row.querySelector('.form-error');
      if (errEl) errEl.textContent = '';
    });
  }

  Object.entries(fields).forEach(([key, { el, validate }]) => {
    el.addEventListener('blur', () => {
      const row = el.closest('.form-row');
      const errEl = row.querySelector('.form-error');
      if (!el.value.trim()) {
        row.classList.remove('has-error');
        if (errEl) errEl.textContent = '';
        return;
      }
      if (!validate(el.value)) {
        const hints = {
          name: 'Please enter your name',
          email: 'Please enter a valid email',
          venue: 'Please enter a venue or city',
          message: 'Tell us a little more (at least 10 characters)',
        };
        showError(key, hints[key]);
      } else {
        row.classList.remove('has-error');
        if (errEl) errEl.textContent = '';
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    let valid = true;
    const messages = {
      name: 'Please enter your name',
      email: 'Please enter a valid email',
      venue: 'Please enter a venue or city',
      message: 'Tell us a little more (at least 10 characters)',
    };

    Object.entries(fields).forEach(([key, { el, validate }]) => {
      if (!validate(el.value)) {
        showError(key, messages[key]);
        valid = false;
      }
    });

    if (!valid) return;

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const payload = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      venue: fields.venue.el.value.trim(),
      message: fields.message.el.value.trim(),
    };

    try {
      const res = await fetch(CONFIG.FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Submission failed');

      gsap.to(form, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        onComplete: () => {
          form.style.display = 'none';
          success.classList.add('is-visible');
          gsap.fromTo(success, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 });
        },
      });
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Request';
      showError('email', 'Unable to send — please email private@lumenstudios.in');
    }
  });
}

/* ── Video modal ── */
function initVideoModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('reelIframe');
  const closeBtn = document.getElementById('videoModalClose');
  const openBtn = document.getElementById('reelCta');
  if (!modal || !iframe) return;

  const embedBase = `https://www.youtube-nocookie.com/embed/${CONFIG.REEL_VIDEO_ID}?autoplay=1&rel=0`;

  function openModal() {
    iframe.src = embedBase;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { iframe.src = ''; }, 500);
  }

  openBtn?.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

let filmsScrollReady = false;

function initFilmsScroll() {
  if (filmsScrollReady || prefersReduced) return;
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  if (isMobile) return;

  const track = document.getElementById('filmsTrack');
  if (!track || !track.children.length) return;

  const getScroll = () => track.scrollWidth - window.innerWidth + 160;

  gsap.to(track, {
    x: () => -getScroll(),
    ease: 'none',
    force3D: true,
    scrollTrigger: {
      trigger: '#films',
      start: 'top top',
      end: () => `+=${Math.max(getScroll(), 100)}`,
      pin: '#filmsPin',
      scrub: 0.2,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set('#filmsProgress', { width: `${self.progress * 100}%` });
      },
    },
  });

  filmsScrollReady = true;
}

function initFilmFrameReveal() {
  if (prefersReduced) return;
  gsap.from('.film-frame', {
    opacity: 0,
    y: 30,
    stagger: 0.08,
    duration: 0.8,
    ease: 'power2.out',
    force3D: true,
    scrollTrigger: { trigger: '#films', start: 'top 80%' },
  });
}

/* ── Main init ── */
function initSite() {
  initCursor();
  initNavScroll();
  initForm();
  initVideoModal();

  const isShortViewport = window.matchMedia('(max-height: 600px)').matches;

  if (prefersReduced) return;

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.opening-media', { scale: 1.15, duration: 2.8, ease: 'power2.inOut', force3D: true })
    .from('#openingText', { opacity: 0, y: 40, duration: 1.4 }, '-=1.8')
    .from('.opening-credit', { opacity: 0, duration: 0.8 }, '-=0.6')
    .from('#scrollLine', { scaleY: 0, duration: 1, ease: 'power2.inOut' }, '-=0.4');

  gsap.to('#scrollLine', {
    scaleY: 0.3,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
    delay: 3,
  });

  gsap.to('.opening-media', {
    scale: 1,
    y: '15%',
    ease: 'none',
    force3D: true,
    scrollTrigger: {
      trigger: '#opening',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.35,
    },
  });

  gsap.to('.opening-copy', {
    opacity: 0,
    y: -60,
    ease: 'none',
    force3D: true,
    scrollTrigger: {
      trigger: '#opening',
      start: 'top top',
      end: '60% top',
      scrub: true,
    },
  });

  if (!isShortViewport) {
    const oldChars = [...document.querySelectorAll('#manifestoOld .split-char')];
    const newChars = [...document.querySelectorAll('#manifestoNew .split-char')];

    const manifestoTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#manifesto',
        start: 'top top',
        end: '+=150%',
        pin: '#manifestoPin',
        scrub: 0.3,
      },
    });

    manifestoTl
      .from(oldChars, { opacity: 0, y: 80, stagger: 0.015, duration: 0.5, force3D: true })
      .to(oldChars, { opacity: 0, y: -40, stagger: 0.008, duration: 0.4, force3D: true }, '+=0.3')
      .to('#manifestoNew', { opacity: 1, duration: 0.01 }, '-=0.2')
      .from(newChars, { opacity: 0, y: 60, stagger: 0.015, duration: 0.5, force3D: true }, '-=0.1')
      .to('#manifestoSub', { opacity: 1, duration: 0.3 }, '+=0.2');
  }

  gsap.from('#portraitImg img', {
    clipPath: 'inset(100% 0 0 0)',
    scale: 1.15,
    ease: 'power3.inOut',
    force3D: true,
    scrollTrigger: {
      trigger: '#portrait',
      start: 'top 70%',
      end: 'top 20%',
      scrub: 0.35,
    },
  });

  gsap.from('.portrait-copy > *', {
    opacity: 0,
    y: 50,
    stagger: 0.12,
    duration: 1,
    ease: 'power3.out',
    force3D: true,
    scrollTrigger: { trigger: '#portrait', start: 'top 60%' },
  });

  document.querySelectorAll('.parallax-layer').forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 1;
    gsap.to(el, {
      y: () => (1 - speed) * 120,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: el.closest('.scene') || el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.4,
      },
    });
  });

  const quoteChars = [...document.querySelectorAll('#quoteText .split-char')];
  gsap.from(quoteChars, {
    opacity: 0,
    y: 20,
    stagger: 0.012,
    duration: 0.6,
    ease: 'power2.out',
    force3D: true,
    scrollTrigger: { trigger: '#quote', start: 'top 65%' },
  });

  gsap.from('.quote-mark, .quote-attr', {
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    scrollTrigger: { trigger: '#quote', start: 'top 60%' },
  });

  gsap.from('.stakes-img.primary img', {
    scale: 1.15,
    ease: 'none',
    force3D: true,
    scrollTrigger: {
      trigger: '#stakes',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.4,
    },
  });

  gsap.from('.stakes-copy > *', {
    opacity: 0,
    x: -40,
    stagger: 0.15,
    duration: 1,
    ease: 'power3.out',
    force3D: true,
    scrollTrigger: { trigger: '#stakes', start: 'top 65%' },
  });

  gsap.utils.toArray('.guide-step').forEach((step) => {
    gsap.from(step, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      force3D: true,
      scrollTrigger: { trigger: step, start: 'top 85%' },
    });
  });

  gsap.from('.guide-intro > *', {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 1,
    scrollTrigger: { trigger: '#guide', start: 'top 70%' },
  });

  gsap.from('.reel-title .split-char', {
    opacity: 0,
    y: 60,
    stagger: 0.018,
    duration: 0.7,
    ease: 'power3.out',
    force3D: true,
    scrollTrigger: { trigger: '#reel', start: 'top 60%' },
  });

  gsap.from('.reel-label, .reel-cta', {
    opacity: 0,
    y: 20,
    stagger: 0.15,
    duration: 0.8,
    scrollTrigger: { trigger: '#reel', start: 'top 55%' },
  });

  gsap.to('#reelBg', {
    scale: 1,
    ease: 'none',
    force3D: true,
    scrollTrigger: {
      trigger: '#reel',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.35,
    },
  });

  gsap.to('#chromatic', {
    opacity: 0.6,
    ease: 'none',
    scrollTrigger: {
      trigger: '#reel',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
    },
  });

  gsap.from('.invitation-inner > *', {
    opacity: 0,
    y: 35,
    stagger: 0.1,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#invitation', start: 'top 70%' },
  });

  gsap.from('footer > *', {
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    scrollTrigger: { trigger: 'footer', start: 'top 90%' },
  });
}

/* ── Bootstrap ── */
function initResponsiveFilms() {
  const filmsSection = document.getElementById('films');
  if (!filmsSection) return;

  const mm = gsap.matchMedia();
  mm.add('(max-width: 900px)', () => {
    filmsSection.classList.add('is-mobile');
    return () => filmsSection.classList.remove('is-mobile');
  });
}

initTheme();
initResponsiveFilms();
loadArchiveData().then(() => initArchiveObserver());

window.addEventListener('resize', () => ScrollTrigger.refresh());