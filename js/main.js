/* =========================================================
   Терра — поведение страницы и анимации
   ========================================================= */

/* ---- НАСТРОЙКА ФОРМЫ ----
   Чтобы заявки приходили на почту, получите бесплатный ключ на https://web3forms.com
   и вставьте его между кавычками. Пока ключа нет, форма работает в демо-режиме. */
const WEB3FORMS_KEY = '';

(function () {
  'use strict';

  // ?noanim в адресе отключает анимации (удобно для проверки вёрстки)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim\b/.test(location.search);
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- Мобильное меню ---------- */
  const burger = $('#burger');
  const menu = $('#mmenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open && window.gsap && !reduceMotion) {
      gsap.fromTo($$('.mmenu__nav a, .mmenu__tg', menu), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: 'power3.out' });
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', () => { setMenu(true); const c = $('#mmenu-close'); c && c.focus(); });
    const closeBtn = $('#mmenu-close');
    closeBtn && closeBtn.addEventListener('click', () => { setMenu(false); burger.focus(); });
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  }

  /* ---------- Закреплённая шапка и мобильная кнопка ---------- */
  const topbar = $('#topbar');
  const mobileCta = $('#mobile-cta');
  const heroCard = $('.hero__card');
  const contact = $('#contact');
  let pastHero = false, contactVisible = false;
  function updateBars() {
    topbar && topbar.classList.toggle('is-visible', pastHero);
    mobileCta && mobileCta.classList.toggle('is-visible', pastHero && !contactVisible);
  }
  if ('IntersectionObserver' in window) {
    if (heroCard) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; updateBars(); }, { threshold: 0 }).observe(heroCard);
    if (contact) new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; updateBars(); }, { threshold: 0.15 }).observe(contact);
  }

  /* ---------- Кнопки тарифов подставляют формат в заявку ---------- */
  const planField = $('#plan-field');
  $$('[data-plan]').forEach(btn => btn.addEventListener('click', () => {
    if (planField) planField.value = btn.dataset.plan;
    setTimeout(() => { const f = $('#lead-form input[name="name"]'); f && f.focus({ preventScroll: true }); }, 700);
  }));

  /* ---------- Плавное раскрытие вопросов ---------- */
  $$('.qa').forEach(details => {
    const summary = $('summary', details);
    const body = $('.qa__a', details);
    summary.addEventListener('click', e => {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      if (details.open) {
        const h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' })
          .onfinish = () => { details.open = false; };
      } else {
        details.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* ---------- Форма заявки ---------- */
  const form = $('#lead-form');
  const status = $('#form-status');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status';
      const name = form.elements.name, contactField = form.elements.contact;
      let ok = true;
      [name, contactField].forEach(f => {
        const bad = !f.value.trim();
        f.setAttribute('aria-invalid', String(bad));
        if (bad) ok = false;
      });
      if (!ok) {
        status.textContent = 'Пожалуйста, заполните имя и контакт для связи.';
        status.classList.add('is-error');
        (name.value.trim() ? contactField : name).focus();
        return;
      }
      if (form.elements.botcheck.checked) return; // защита от спам-ботов

      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = 'Отправляем…';

      try {
        if (!WEB3FORMS_KEY) {
          await new Promise(r => setTimeout(r, 700));
          status.textContent = 'Демо-режим: форма ещё не подключена к почте. Заявка не отправлена.';
          status.classList.add('is-error');
        } else {
          const data = new FormData(form);
          data.append('access_key', WEB3FORMS_KEY);
          data.append('subject', 'Новая заявка с сайта «Терра»');
          const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
          const json = await res.json();
          if (!json.success) throw new Error(json.message || 'Ошибка отправки');
          form.reset();
          status.textContent = 'Спасибо! Мы свяжемся с вами в течение рабочего дня.';
          status.classList.add('is-ok');
        }
      } catch (err) {
        status.textContent = 'Не получилось отправить. Напишите нам в Telegram: @terra_ceramics';
        status.classList.add('is-error');
      } finally {
        btn.disabled = false;
        btn.textContent = oldText;
      }
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  /* =========================================================
     Анимации (GSAP). Если библиотека не загрузилась или
     пользователь просит меньше движения — контент просто виден.
     ========================================================= */
  function initAnimations() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // Разбиваем заголовки на слова, чтобы они «выезжали» снизу
    $$('[data-split]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = words.map(w => `<span class="w" aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.06em"><span class="wi" style="display:inline-block">${w}</span></span>`).join(' ');
      gsap.from($$('.wi', el), {
        yPercent: 110, duration: 1, ease: 'power4.out', stagger: .08,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    // Первый экран
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero__nav', { y: -20, opacity: 0, duration: .7 })
      .from('.tags', { opacity: 0, duration: .8 }, '-=.4')
      .from('.hero__wordmark .logo__text', { yPercent: 60, opacity: 0, duration: 1.1, ease: 'power4.out' }, '-=.6')
      .from('.hero__wordmark .logo__blob', { scale: 0, duration: 1.2, ease: 'elastic.out(1, .55)' }, '-=.8')
      .from('.hero__plate', { scale: .82, rotation: -35, opacity: 0, duration: 1.4, ease: 'power3.out' }, '-=1.1')
      .from('.hero__offer > *', { y: 30, opacity: 0, duration: .8, stagger: .09 }, '-=1')
      .from('.stats--bar li', { y: 20, opacity: 0, duration: .6, stagger: .08 }, '-=.6');

    // Тарелка медленно «крутится на круге» при прокрутке
    gsap.to('.hero__plate', {
      rotation: 50, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Появление блоков при прокрутке (группами, с небольшой задержкой)
    gsap.set('[data-reveal]', { opacity: 0, y: 40 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1, overwrite: true })
    });

    // Счётчики цифр
    $$('[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count);
      const space = el.dataset.format === 'space';
      const fmt = v => { const n = Math.round(v); return space ? n.toLocaleString('ru-RU') : String(n); };
      const obj = { v: 0 };
      el.textContent = fmt(0);
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(obj, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(obj.v); } })
      });
    });

    // Фоновые фото медленно приближаются
    $$('.problem .card__bg, .process__bg').forEach(img => {
      gsap.fromTo(img, { scale: 1.15 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.card'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Точки шагов «оживают»
    gsap.from('.steps .dot', {
      scale: 0, duration: .8, ease: 'back.out(3)', stagger: .12,
      scrollTrigger: { trigger: '.steps', start: 'top 80%' }
    });

    // На больших экранах — лёгкий параллакс карточек и колонок
    mm.add('(min-width: 1024px)', () => {
      [['.bcard--1', -40], ['.bcard--2', 30], ['.bcard--3', -60], ['.bcard--4', 20], ['.bcard--5', -30]].forEach(([s, y]) => {
        gsap.to(s, { y, ease: 'none', scrollTrigger: { trigger: '.business__card', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('.layers__photo img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.layers__card', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.contact__photo img', { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact__card', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Большой знак в подвале поднимается
    gsap.from('.footer__mark', { yPercent: 30, opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

    // Пересчитать позиции, когда догрузятся картинки и шрифты
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAnimations);
  else initAnimations();
})();
