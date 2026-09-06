/* =====================================================================
   Shared "Photo Story" engine - scroll reveals, countdown, add-to-
   calendar, lightbox gallery, and graceful photo-placeholder fallback.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.WEDDING_CONFIG || {};
  const WEDDING = new Date(CFG.dateISO || '2026-12-06T11:00:00+05:30');

  /* ---------- Photo placeholder fallback ----------
     Local client photos always take priority. Missing files use curated
     wedding imagery rather than generic seeded or abstract images. */
  const fallbackPhotos = {
    hero: [
      'https://picsum.photos/seed/wedding-couple-hero/1600/1067',
    ],
    story: [
      'https://picsum.photos/seed/wedding-couple-story-1/900/1100',
      'https://picsum.photos/seed/wedding-couple-proposal/900/1100',
      'https://picsum.photos/seed/wedding-couple-save-date/900/1100',
    ],
    portrait: [
      'https://picsum.photos/seed/wedding-couple-groom/700/700',
      'https://picsum.photos/seed/wedding-couple-bride/700/700',
    ],
    gallery: [
      'https://picsum.photos/seed/wedding-couple-gallery-1/1200/750',
      'https://picsum.photos/seed/wedding-couple-gallery-2/1200/750',
      'https://picsum.photos/seed/wedding-couple-ceremony-1/1200/750',
      'https://picsum.photos/seed/wedding-couple-ceremony-2/1200/750',
      'https://picsum.photos/seed/wedding-couple-reception/1200/750',
      'https://picsum.photos/seed/wedding-couple-forever/1200/750',
    ],
  };

  const curatedFallbackPhotos = {
    hero: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85'],
    story: [
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85',
    ],
    portrait: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85',
    ],
    gallery: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85'],
  };

  const galleryImages = [...document.querySelectorAll('.photo img')];
  document.querySelectorAll('.photo img').forEach((img) => {
    const type = img.closest('.hero__photo') ? 'hero'
      : img.closest('.person__photo') ? 'portrait'
      : img.closest('.story-card') ? 'story'
      : 'gallery';
    const typeImages = fallbackPhotos[type];
    const curatedImages = curatedFallbackPhotos[type];
    const typeIndex = galleryImages.filter((candidate) => {
      const parent = candidate.closest('.hero__photo') ? 'hero'
        : candidate.closest('.person__photo') ? 'portrait'
        : candidate.closest('.story-card') ? 'story'
        : 'gallery';
      return parent === type;
    }).indexOf(img);
    const primaryFallback = typeImages[typeIndex % typeImages.length];
    const curatedFallback = curatedImages[typeIndex % curatedImages.length];

    img.addEventListener('error', () => {
      if (primaryFallback && !img.dataset.fallbackTried) {
        img.dataset.fallbackTried = '1';
        img.src = primaryFallback;
      } else if (curatedFallback && !img.dataset.curatedFallbackTried) {
        img.dataset.curatedFallbackTried = '1';
        img.src = curatedFallback;
      } else {
        img.remove();
      }
    });
  });

  /* ---------- Scroll progress ---------- */
  const progress = document.getElementById('progressBar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  /* ---------- Scroll reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  document.querySelectorAll('.hero [data-reveal]').forEach((el) => el.classList.add('in'));

  /* ---------- Countdown ---------- */
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

  /* ---------- Lightbox for the gallery carousel ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (lightbox && lightboxImg) {
    document.querySelectorAll('.gallery-carousel__slide .photo').forEach((frame) => {
      frame.addEventListener('click', () => {
        const img = frame.querySelector('img');
        if (!img) return; // nothing to enlarge until a real photo is added
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('open');
      });
    });
    const closeLightbox = () => lightbox.classList.remove('open');
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- Gallery carousel: large single-photo slider ---------- */
  const galleryRoot = document.querySelector('.gallery-carousel');
  if (galleryRoot) {
    const track = galleryRoot.querySelector('.gallery-carousel__track');
    const slides = [...galleryRoot.querySelectorAll('.gallery-carousel__slide')];
    const dotsWrap = galleryRoot.querySelector('.gallery-carousel__dots');
    const prevBtn = galleryRoot.querySelector('.gallery-carousel__nav--prev');
    const nextBtn = galleryRoot.querySelector('.gallery-carousel__nav--next');
    let idx = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'gallery-carousel__dot';
      dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
      dot.addEventListener('click', () => go(i));
      dotsWrap.appendChild(dot);
    });
    const dots = [...dotsWrap.querySelectorAll('.gallery-carousel__dot')];

    function go(i) {
      idx = ((i % slides.length) + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === idx)));
    }
    prevBtn.addEventListener('click', () => go(idx - 1));
    nextBtn.addEventListener('click', () => go(idx + 1));

    galleryRoot.setAttribute('tabindex', '0');
    galleryRoot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
    });

    let dragging = false, startX = 0;
    track.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; });
    window.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });

    go(0);
  }

  /* ---------- Card tilt for couple portraits' container ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.story-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
})();
