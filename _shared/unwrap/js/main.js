/* =====================================================================
   Shared "Untie the Bow" engine - clicking/tapping (or pressing Enter/
   Space on) the bow untie the ribbon, bursts a little confetti, then
   fades the cover away to reveal the invitation underneath.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('wrapStage');
  const bow = document.getElementById('bowBtn');
  if (!stage || !bow) return;

  // keep the visitor on the cover screen until they untie it
  document.body.style.overflow = 'hidden';

  /* ---------- Floating flower petals (drift over cover + revealed page) ---------- */
  if (!reduce) {
    const wrap = document.createElement('div');
    wrap.className = 'petals';
    wrap.setAttribute('aria-hidden', 'true');
    const svg = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c4 2 6 6 6 10a6 6 0 1 1-12 0c0-4 2-8 6-10z"/></svg>';
    const N = window.innerWidth < 640 ? 10 : 18;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.innerHTML = svg;
      const size = 8 + Math.random() * 14;
      p.style.left = Math.random() * 100 + 'vw';
      p.style.fontSize = size + 'px';
      p.style.opacity = 0.35 + Math.random() * 0.4;
      p.style.animationDuration = 10 + Math.random() * 16 + 's';
      p.style.animationDelay = -Math.random() * 20 + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
  }

  function burst() {
    if (reduce) return;
    const wrap = document.createElement('div');
    wrap.className = 'untie-burst';
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 160;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist - 70 + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      p.style.background = i % 2 ? 'var(--gold-soft)' : 'var(--gold)';
      p.style.animationDelay = (Math.random() * 0.15) + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1300);
  }

  function untie() {
    if (bow.disabled) return;
    bow.disabled = true;
    bow.setAttribute('aria-label', 'Invitation opened');
    stage.classList.add('untying');
    burst();
    setTimeout(() => {
      stage.classList.add('opened');
      document.body.style.overflow = '';
      document.dispatchEvent(new Event('invitationOpened'));
    }, reduce ? 0 : 750);
  }

  bow.addEventListener('click', untie);
})();
