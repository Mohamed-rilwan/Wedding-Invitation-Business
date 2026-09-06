/* =====================================================================
   Christian Traditional template - preloader, reveals, countdown, nav,
   rose petals, card tilt, add-to-calendar, ambient tone.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.WEDDING_CONFIG || {};
  const WEDDING = new Date(CFG.dateISO || '2026-12-06T15:00:00+05:30');

  /* ---------- Preloader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('done');
      document.body.classList.add('ready');
      kickReveals();
    }, 1400);
  });

  /* ---------- Scroll reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  function kickReveals() {
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    document.querySelectorAll('#hero [data-reveal]').forEach((el) => el.classList.add('in'));
  }

  /* ---------- Scroll progress + active nav dot ---------- */
  const progress = document.getElementById('scrollProgress');
  const dots = [...document.querySelectorAll('.dotnav a')];
  const sections = dots.map((d) => document.querySelector(d.getAttribute('href')));

  function onScroll() {
    const st = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';

    const mid = st + window.innerHeight * 0.4;
    let idx = 0;
    sections.forEach((s, i) => { if (s && s.offsetTop <= mid) idx = i; });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth anchor scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });

  /* ---------- Countdown to the ceremony ---------- */
  const el = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMins'),
    s: document.getElementById('cdSecs'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    let diff = Math.max(0, WEDDING - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    if (el.d) { el.d.textContent = pad(d); el.h.textContent = pad(h);
                el.m.textContent = pad(m); el.s.textContent = pad(s); }
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Add to calendar (.ics download) ---------- */
  const calBtn = document.getElementById('calBtn');
  if (calBtn) {
    calBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(WEDDING.getTime() + (CFG.durationMinutes || 90) * 60 * 1000);
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + (CFG.icsProdId || 'Wedding') + '//Ceremony//EN',
        'BEGIN:VEVENT', 'UID:' + (CFG.icsUid || 'holy-matrimony') + '@' + WEDDING.getFullYear(),
        'DTSTAMP:' + dt(new Date()),
        'DTSTART:' + dt(WEDDING), 'DTEND:' + dt(end),
        'SUMMARY:' + (CFG.summary || 'Wedding Ceremony'),
        'DESCRIPTION:' + (CFG.description || 'With God\'s blessing\\, join us for the wedding ceremony.'),
        'LOCATION:' + (CFG.location || ''),
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      const a = document.createElement('a');
      a.href = url; a.download = (CFG.icsFilename || 'Wedding-Ceremony') + '.ics';
      a.click(); URL.revokeObjectURL(url);
    });
  }

  /* ---------- Card 3D tilt + glow ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform =
          `perspective(900px) rotateY(${(px - 0.5) * 8}deg) rotateX(${(0.5 - py) * 8}deg) translateY(-4px)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Floating rose petals ---------- */
  if (!reduce) {
    const wrap = document.getElementById('petals');
    const svg = `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c4 2 6 6 6 10a6 6 0 1 1-12 0c0-4 2-8 6-10z"/></svg>`;
    const N = window.innerWidth < 640 ? 10 : 20;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.innerHTML = svg;
      const size = 8 + Math.random() * 14;
      p.style.left = Math.random() * 100 + 'vw';
      p.style.fontSize = size + 'px';
      p.style.opacity = 0.25 + Math.random() * 0.35;
      p.style.animationDuration = 10 + Math.random() * 16 + 's';
      p.style.animationDelay = -Math.random() * 20 + 's';
      wrap.appendChild(p);
    }
  }

  /* ---------- Hero parallax ---------- */
  if (!reduce) {
    const heroInner = document.querySelector('.hero__inner');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight && heroInner) {
        heroInner.style.transform = `translateY(${y * 0.25}px)`;
        heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.8)));
      }
    }, { passive: true });
  }

  /* ---------- Ambience (soft instrumental, loopable) ---------- */
  const muteBtn = document.getElementById('muteToggle');
  const ambience = document.getElementById('ambience');
  const VOLUME = 0.4;
  const FADE = 1600;
  let fadeTimer = null;

  if (ambience) ambience.addEventListener('error', () => console.warn('ambience: cannot load track'));

  function fadeTo(target, done) {
    clearInterval(fadeTimer);
    const from = ambience.volume, steps = 32;
    let n = 0;
    fadeTimer = setInterval(() => {
      n += 1;
      ambience.volume = Math.min(1, Math.max(0, from + (target - from) * (n / steps)));
      if (n >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, FADE / steps);
  }

  function startAmbience() {
    ambience.muted = false;
    ambience.volume = 0;
    return Promise.resolve(ambience.play()).then(() => {
      muteBtn.setAttribute('aria-pressed', 'true');
      muteBtn.classList.remove('mute-toggle--waiting');
      fadeTo(VOLUME);
    });
  }

  function stopAmbience() {
    muteBtn.setAttribute('aria-pressed', 'false');
    fadeTo(0, () => {
      if (muteBtn.getAttribute('aria-pressed') === 'false') ambience.pause();
    });
  }

  if (ambience && muteBtn) {
    const wanted = localStorage.getItem('wedding-audio') !== 'off';
    const GESTURES = ['pointerdown', 'touchend', 'keydown', 'wheel', 'scroll'];

    if (wanted) {
      startAmbience().catch(() => {
        muteBtn.classList.add('mute-toggle--waiting');
        const kick = (e) => {
          if (e.target && e.target.closest && e.target.closest('#muteToggle')) return;
          startAmbience()
            .then(() => GESTURES.forEach((ev) => window.removeEventListener(ev, kick)))
            .catch(() => {});
        };
        GESTURES.forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
      });
    }

    muteBtn.addEventListener('click', () => {
      if (ambience.paused) {
        localStorage.setItem('wedding-audio', 'on');
        startAmbience().catch(() => {});
      } else {
        localStorage.setItem('wedding-audio', 'off');
        stopAmbience();
      }
    });
  }

  /* ---------- Venue map: illustrated card swaps in the live map ---------- */
  const mapCard = document.getElementById('mapCard');
  const mapWrap = document.getElementById('venueMap');
  if (mapCard && mapWrap) {
    mapCard.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.title = mapCard.getAttribute('aria-label') || CFG.mapLabel || 'Live map to the venue';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.src = mapWrap.dataset.src;
      mapWrap.insertBefore(frame, mapWrap.firstChild);
      mapCard.remove();
    }, { once: true });
  }
})();
