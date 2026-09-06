(function () {
  'use strict';

  const PROFILE_KEY = 'wedstory-profile';
  let profile = {};

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation && navigation.type === 'reload') localStorage.removeItem(PROFILE_KEY);

  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
  catch (error) { profile = {}; }

  if (!profile.groom && !profile.bride && !profile.date && !profile.story) return;

  const coupleLabel = [profile.groom, profile.bride].filter(Boolean).join(' & ');
  if (window.WEDDING_CONFIG) {
    if (profile.date) {
      const configuredTime = String(window.WEDDING_CONFIG.dateISO || '2026-12-06T11:00:00+05:30').slice(10);
      window.WEDDING_CONFIG.dateISO = `${profile.date}${configuredTime}`;
    }
    if (coupleLabel) {
      window.WEDDING_CONFIG.summary = `${window.WEDDING_CONFIG.summary || 'Wedding'} - ${coupleLabel}`;
      window.WEDDING_CONFIG.icsProdId = coupleLabel.replace(/[^a-z0-9]+/gi, '-');
    }
  }

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  };

  if (profile.groom) {
    setText('.cn--groom', profile.groom);
    const coupleNames = document.querySelectorAll('.person__name, .pw-name, .split__name');
    if (coupleNames[0]) coupleNames[0].textContent = profile.groom;
    document.querySelectorAll('.hero-names, .pw-names, .slide-names').forEach((element) => {
      element.innerHTML = `${profile.groom} <span>&amp;</span> ${profile.bride || ''}`;
    });
  }
  if (profile.bride) {
    setText('.cn--bride', profile.bride);
    const coupleNames = document.querySelectorAll('.person__name, .pw-name, .split__name');
    if (coupleNames[1]) coupleNames[1].textContent = profile.bride;
  }

  if (profile.date) {
    const date = new Date(`${profile.date}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      const formatted = `${String(date.getDate()).padStart(2, '0')} · ${String(date.getMonth() + 1).padStart(2, '0')} · ${date.getFullYear()}`;
      setText('.hero__date-num, .hero-date b, .pw-date b, .slide-date b', formatted);
      setText('.hero-date, .pw-date, .slide-date', formatted);
      document.querySelectorAll('.mark, .pw-footer__mark, .footer__mark').forEach((element) => {
        element.textContent = `${profile.groom || ''} & ${profile.bride || ''} · ${formatted}`;
      });
    }
  }

  if (profile.story) {
    const section = document.createElement('section');
    section.className = 'personalized-story';
    section.innerHTML = '<p class="personalized-story__kicker">Our story</p><p class="personalized-story__text"></p>';
    section.querySelector('.personalized-story__text').textContent = profile.story;
    const footer = document.querySelector('footer');
    if (footer) footer.parentNode.insertBefore(section, footer);

    const style = document.createElement('style');
    style.textContent = '.personalized-story{max-width:760px;margin:3rem auto;padding:2rem;text-align:center;border:1px solid rgba(216,178,90,.28);border-radius:24px;background:rgba(0,0,0,.12)}.personalized-story__kicker{margin:0 0 .7rem;color:#d8b25a;letter-spacing:.16em;text-transform:uppercase;font-size:.75rem}.personalized-story__text{margin:0;line-height:1.75;font-size:1.15rem}';
    document.head.appendChild(style);
  }
})();