/* =====================================================================
   Shared "Cinematic Parallax" engine — layered scroll parallax, reveal,
   line-draw emblem, count-up countdown, magnetic buttons/cards, confetti.
   Content and palette are supplied per template.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.WEDDING_CONFIG || {};
  const WEDDING = new Date(CFG.dateISO || '2026-12-06T11:00:00+05:30');

  /* ---------- Scroll progress ---------- */
  const progress = document.getElementById('progressBar');
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }

  /* ---------- Parallax layers ---------- */
  const layers = [...document.querySelectorAll('[data-speed]')];
  let ticking = false;
  function applyParallax() {
    const y = window.scrollY;
    layers.forEach((el) => {
      const speed = parseFloat(el.dataset.speed || '0');
      el.style.transform = `translateY(${y * speed}px)`;
    });
    ticking = false;
  }
  function onScrollParallax() {
    onScroll();
    if (!reduce && !ticking) { ticking = true; requestAnimationFrame(applyParallax); }
  }
  window.addEventListener('scroll', onScrollParallax, { passive: true });
  onScroll();

  /* ---------- Scroll reveals (+ emblem line-draw, once each) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  document.querySelectorAll('.pw-hero [data-reveal]').forEach((el) => el.classList.add('in'));

  document.querySelectorAll('.pw-emblem').forEach((el) => {
    setTimeout(() => el.classList.add('draw'), 400);
  });

  /* ---------- Card 3D tilt + glow ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.pw-card').forEach((card) => {
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

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll('.pw-btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Countdown, with a one-time count-up flourish ---------- */
  const el = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMins'),
    s: document.getElementById('cdSecs'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  function currentParts() {
    let diff = Math.max(0, WEDDING - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    return { d, h, m, s };
  }
  function renderParts(p) {
    if (el.d) { el.d.textContent = pad(p.d); el.h.textContent = pad(p.h);
                el.m.textContent = pad(p.m); el.s.textContent = pad(p.s); }
  }
  function countUpOnce() {
    const target = currentParts();
    if (reduce || !el.d) { renderParts(target); return; }
    const steps = 24;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      const t = n / steps;
      renderParts({
        d: Math.round(target.d * t), h: Math.round(target.h * t),
        m: Math.round(target.m * t), s: Math.round(target.s * t),
      });
      if (n >= steps) { clearInterval(timer); renderParts(target); }
    }, 30);
  }
  let counted = false;
  const cdSection = document.getElementById('countdown');
  if (cdSection) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !counted) { counted = true; countUpOnce(); }
      });
    }, { threshold: 0.4 }).observe(cdSection);
  }
  setInterval(() => { if (counted) renderParts(currentParts()); }, 1000);

  /* ---------- Confetti burst ---------- */
  function burstConfetti(originEl) {
    if (reduce) return;
    const wrap = document.createElement('div');
    wrap.className = 'pw-confetti';
    const r = originEl.getBoundingClientRect();
    wrap.style.setProperty('--ox', r.left + r.width / 2 + 'px');
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;
      p.style.left = r.left + r.width / 2 + 'px';
      p.style.top = r.top + 'px';
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist - 60 + 'px');
      p.style.setProperty('--rot', Math.random() * 540 - 270 + 'deg');
      p.style.background = i % 2 ? 'var(--gold-soft)' : 'var(--gold)';
      p.style.animationDelay = Math.random() * 0.15 + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1400);
  }

  /* ---------- Add to calendar (.ics download) ---------- */
  const calBtn = document.getElementById('calBtn');
  if (calBtn) {
    calBtn.addEventListener('click', (e) => {
      e.preventDefault();
      burstConfetti(calBtn);
      const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(WEDDING.getTime() + (CFG.durationMinutes || 60) * 60 * 1000);
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + (CFG.icsProdId || 'Wedding') + '//Ceremony//EN',
        'BEGIN:VEVENT', 'UID:' + (CFG.icsUid || 'wedding-ceremony') + '@' + WEDDING.getFullYear(),
        'DTSTAMP:' + dt(new Date()),
        'DTSTART:' + dt(WEDDING), 'DTEND:' + dt(end),
        'SUMMARY:' + (CFG.summary || 'Wedding'),
        'DESCRIPTION:' + (CFG.description || 'Join us to celebrate.'),
        'LOCATION:' + (CFG.location || ''),
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      const a = document.createElement('a');
      a.href = url; a.download = (CFG.icsFilename || 'Wedding') + '.ics';
      a.click(); URL.revokeObjectURL(url);
    });
  }
})();
