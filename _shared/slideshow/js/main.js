/* =====================================================================
   Shared "Slideshow" engine - active-slide tracking, countdown,
   add-to-calendar. Content and palette are supplied per template.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.WEDDING_CONFIG || {};
  const WEDDING = new Date(CFG.dateISO || '2026-12-06T11:00:00+05:30');

  const stage = document.getElementById('slideshow');
  const slides = [...document.querySelectorAll('.slide')];
  const navEl = document.getElementById('slideNav');
  const progress = document.getElementById('progressBar');

  /* ---------- Build the numbered nav rail ---------- */
  slides.forEach((s, i) => {
    const label = s.dataset.label || String(i + 1).padStart(2, '0');
    const item = document.createElement('button');
    item.className = 'slide-nav__item';
    item.innerHTML = `<b></b><span>${label}</span>`;
    item.addEventListener('click', () => s.scrollIntoView({ behavior: 'smooth' }));
    navEl.appendChild(item);
  });
  const navItems = [...navEl.querySelectorAll('.slide-nav__item')];

  /* ---------- Track the active slide (re-triggers the reveal animation each visit) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = slides.indexOf(e.target);
      if (e.isIntersecting && e.intersectionRatio > 0.5) {
        e.target.classList.add('in');
        navItems.forEach((n, i) => n.setAttribute('aria-current', String(i === idx)));
      } else {
        e.target.classList.remove('in');
      }
    });
  }, { root: stage, threshold: [0.5] });
  slides.forEach((s) => io.observe(s));
  if (slides[0]) slides[0].classList.add('in');

  /* ---------- Top progress bar ---------- */
  stage.addEventListener('scroll', () => {
    const h = stage.scrollHeight - stage.clientHeight;
    progress.style.width = (h > 0 ? (stage.scrollTop / h) * 100 : 0) + '%';
  }, { passive: true });

  /* ---------- Keyboard navigation ---------- */
  window.addEventListener('keydown', (e) => {
    const idx = navItems.findIndex((n) => n.getAttribute('aria-current') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      const next = slides[Math.min(slides.length - 1, idx + 1)];
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const prev = slides[Math.max(0, idx - 1)];
      if (prev) prev.scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ---------- Countdown ---------- */
  const el = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMins'),
    s: document.getElementById('cdSecs'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  const prev = { d: '', h: '', m: '', s: '' };
  function setNum(node, key, value) {
    if (!node) return;
    node.textContent = value;
    if (!reduce && prev[key] !== value) {
      node.classList.remove('ci__num--pulse');
      // eslint-disable-next-line no-unused-expressions
      void node.offsetWidth; // restart the animation
      node.classList.add('ci__num--pulse');
    }
    prev[key] = value;
  }
  function tick() {
    let diff = Math.max(0, WEDDING - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    setNum(el.d, 'd', pad(d)); setNum(el.h, 'h', pad(h));
    setNum(el.m, 'm', pad(m)); setNum(el.s, 's', pad(s));
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Add to calendar (.ics download) ---------- */
  const calBtn = document.getElementById('calBtn');
  if (calBtn) {
    calBtn.addEventListener('click', (e) => {
      e.preventDefault();
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
