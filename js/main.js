/* =========================================================
   Fajr turns four — invitation interactions
   GSAP + ScrollTrigger for scroll animation, Lenis for smooth
   scrolling, canvas-confetti for the celebrations. Everything
   degrades gracefully if a CDN script fails to load.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     PARTY DETAILS — edit here
     --------------------------------------------------------- */
  const CONFIG = {
    title: "Fajr's 4th Birthday Celebration",
    start: '2026-10-19T16:00:00+05:30', // Monday 19 Oct 2026, 4:00 PM (IST)
    end: '2026-10-19T20:00:00+05:30',
    venueName: '',     // e.g. 'Hotel Name, Banquet Hall'
    venueAddress: '',  // e.g. 'MG Road, Kozhikode'
    mapsUrl: '',       // Google Maps share link for the venue
    whatsapp: '',      // RSVP number, digits only with country code e.g. '919876543210'
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const PALETTE = ['#741528', '#931f35', '#c9a14a', '#ecd59c', '#fffaf2', '#dcbb6c'];

  /* ---------------------------------------------------------
     Party details, calendar, RSVP
     --------------------------------------------------------- */
  function setupDetails() {
    const start = new Date(CONFIG.start);
    const end = new Date(CONFIG.end);
    const where = [CONFIG.venueName, CONFIG.venueAddress].filter(Boolean).join(', ');
    const about = "Join us as our little dawn, Fajr, turns four! Cake, giggles and a little bit of magic.";
    const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    if (CONFIG.venueName) {
      $('#venueRow').hidden = false;
      $('#venueName').textContent = CONFIG.venueName;
      $('#venueAddress').textContent = CONFIG.venueAddress;
    }
    if (CONFIG.mapsUrl) {
      const map = $('#mapBtn');
      map.href = CONFIG.mapsUrl;
      map.hidden = false;
    }
    if (CONFIG.whatsapp) {
      const rsvp = $('#rsvpBtn');
      const msg = "Hi! We'd love to join Fajr's 4th birthday on Monday, 19 Oct at 4 PM 🎉";
      rsvp.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
      rsvp.hidden = false;
    }

    const g = new URLSearchParams({
      action: 'TEMPLATE',
      text: CONFIG.title,
      dates: `${stamp(start)}/${stamp(end)}`,
      details: `${about}\n${location.href.split('#')[0]}`,
    });
    if (where) g.set('location', where);
    $('#gcalBtn').href = `https://calendar.google.com/calendar/render?${g}`;

    const esc = s => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fajr//4th Birthday//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:fajr-4th-birthday-20261019@invite',
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(CONFIG.title)}`,
      `DESCRIPTION:${esc(about)}`,
      where ? `LOCATION:${esc(where)}` : '',
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(CONFIG.title)}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    $('#icsBtn').href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }

  /* ---------------------------------------------------------
     Countdown
     --------------------------------------------------------- */
  function setupCountdown() {
    const start = new Date(CONFIG.start).getTime();
    const end = new Date(CONFIG.end).getTime();
    const box = $('#countdown');
    const label = $('#cdLabel');
    const grid = $('#cdGrid');
    const cells = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    let timer;

    const set = (el, v) => {
      const text = String(v).padStart(2, '0');
      if (el.textContent === text) return;
      el.textContent = text;
      el.classList.remove('bump');
      void el.offsetWidth; // restart the animation
      el.classList.add('bump');
    };

    const tick = () => {
      const now = Date.now();
      const diff = start - now;
      if (diff <= 0) {
        clearInterval(timer);
        grid.hidden = true;
        box.classList.add('is-live');
        label.textContent = now < end
          ? "It's party time — the celebration is on! 🎉"
          : 'Thank you for celebrating with us 💛';
        return;
      }
      set(cells.d, Math.floor(diff / 864e5));
      set(cells.h, Math.floor(diff / 36e5) % 24);
      set(cells.m, Math.floor(diff / 6e4) % 60);
      set(cells.s, Math.floor(diff / 1e3) % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     Music
     --------------------------------------------------------- */
  const audio = $('#bgm');
  const musicBtn = $('#musicBtn');
  let wantMusic = false;

  const musicUi = playing => {
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.setAttribute('aria-pressed', String(playing));
    musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  };
  function playMusic() {
    wantMusic = true;
    audio.volume = 0.6;
    const p = audio.play();
    if (p && p.catch) p.catch(() => musicUi(false));
  }
  audio.addEventListener('play', () => musicUi(true));
  audio.addEventListener('pause', () => musicUi(false));
  musicBtn.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else { wantMusic = false; audio.pause(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (wantMusic) audio.play().catch(() => {});
  });

  /* ---------------------------------------------------------
     Confetti
     --------------------------------------------------------- */
  function confettiBurst(kind = 'big') {
    if (!window.confetti || reduced) return;
    const base = { colors: PALETTE, disableForReducedMotion: true, zIndex: 120 };
    if (kind === 'big') {
      confetti({ ...base, particleCount: 90, angle: 60, spread: 70, startVelocity: 62, origin: { x: 0, y: 0.75 } });
      confetti({ ...base, particleCount: 90, angle: 120, spread: 70, startVelocity: 62, origin: { x: 1, y: 0.75 } });
      setTimeout(() => confetti({ ...base, particleCount: 120, spread: 110, startVelocity: 40, scalar: 1.1, origin: { x: 0.5, y: 0.35 } }), 260);
    } else {
      confetti({ ...base, ...kind });
    }
  }

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop();
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 2.2 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          walk(n);
        }
      });
    };
    walk(el);
  }

  /* ---------------------------------------------------------
     Gate — open the curtains
     --------------------------------------------------------- */
  const gate = $('#gate');
  let opened = false;

  function finishGate() {
    gate.remove();
    root.classList.remove('is-locked');
    if (lenis) lenis.start();
    if (hasGsap) ScrollTrigger.refresh();
  }

  function openGate() {
    if (opened) return;
    opened = true;
    playMusic();

    if (!hasGsap || reduced) {
      gate.classList.add('is-open');
      setTimeout(finishGate, 700);
      confettiBurst();
      return;
    }

    gsap.timeline({ onComplete: finishGate })
      .to('.seal', { scale: 1.3, rotation: 30, autoAlpha: 0, duration: 0.55, ease: 'back.in(2)' }, 0)
      .to(['.gate__eyebrow', '.gate__hint', '.gate__sound'], { autoAlpha: 0, y: -18, duration: 0.45, stagger: 0.05 }, 0)
      .to('.gate__valance', { yPercent: -110, duration: 1, ease: 'power3.inOut' }, 0.35)
      .to('.curtain--left', { scaleX: 0, skewY: 3, duration: 1.7, ease: 'power3.inOut' }, 0.4)
      .to('.curtain--right', { scaleX: 0, skewY: -3, duration: 1.7, ease: 'power3.inOut' }, 0.4)
      .to(gate, { backgroundColor: 'rgba(36,5,12,0)', duration: 1.2, ease: 'power2.inOut' }, 0.5)
      .add(heroIntro, 0.75)
      .add(() => confettiBurst(), 1.15);
  }
  $('#openBtn').addEventListener('click', openGate);

  /* ---------------------------------------------------------
     Hero entrance (runs while the curtains open)
     --------------------------------------------------------- */
  function heroIntro() {
    if (!hasGsap || reduced) return;
    const archShape = 'round 999px 999px 28px 28px';
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.garland-wrap', { yPercent: -110, duration: 1.4, stagger: 0.12 }, 0)
      .from('.hero .ribbon', { scale: 0.4, autoAlpha: 0, duration: 1, ease: 'back.out(2)' }, 0.1)
      .from('.hero__name .ch', { yPercent: 90, rotation: 14, autoAlpha: 0, duration: 1.3, stagger: 0.08 }, 0.15)
      .from('.hero__turns', { autoAlpha: 0, x: -30, duration: 1.1 }, 0.55)
      .fromTo('.arch',
        { clipPath: `inset(100% 0% 0% 0% ${archShape})` },
        { clipPath: `inset(0% 0% 0% 0% ${archShape})`, duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.15)
      .from('.arch img', { scale: 1.45, duration: 2.2 }, 0.15)
      .from('.hero__four', { scale: 0, rotation: -40, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.8)' }, 0.95)
      .from('.hero__arabic', { autoAlpha: 0, y: 24, duration: 1.4 }, 0.8)
      .from('.hero__meta li', { y: 20, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 1.05)
      .from('.balloon', { y: () => window.innerHeight * 0.9, duration: 2.6, stagger: 0.12, ease: 'power3.out' }, 0)
      .from('.scroll-cue', { autoAlpha: 0, duration: 0.8 }, 1.4);
  }

  /* ---------------------------------------------------------
     Scroll choreography
     --------------------------------------------------------- */
  function initScroll() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (reduced) return;
    root.classList.add('motion');
    ScrollTrigger.config({ ignoreMobileResize: true });

    // top progress bar
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // hero parallax — the sun rises as you scroll
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__sun', { yPercent: -30, scale: 1.25, ease: 'none' }, 0)
      .to('.hero__rays', { yPercent: -20, ease: 'none' }, 0)
      .to('.hero__photo', { yPercent: -10, ease: 'none' }, 0)
      .to('.hero__copy', { yPercent: -16, ease: 'none' }, 0)
      .to('.balloons', { yPercent: -45, ease: 'none' }, 0)
      .to('.garlands', { y: -80, ease: 'none' }, 0);

    // meaning — words light up one by one
    const meaning = $('#meaningText');
    splitWords(meaning);
    gsap.fromTo($$('.w', meaning), { opacity: 0.13 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: meaning, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
    gsap.fromTo('.meaning__arabic span', { yPercent: 18, rotation: -6 }, {
      yPercent: -18, rotation: 4, ease: 'none',
      scrollTrigger: { trigger: '.meaning', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from('.meaning__sign', { autoAlpha: 0, y: 20, duration: 1, scrollTrigger: { trigger: '.meaning__sign', start: 'top 92%', once: true } });

    // marquee speeds up with scroll velocity
    const loops = $$('.marquee__track').map((t, i) => (i % 2
      ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, duration: 36, ease: 'none', repeat: -1 })
      : gsap.to(t, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 })));
    const speed = { v: 1 };
    const applySpeed = () => loops.forEach(l => l.timeScale(speed.v));
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 7);
        gsap.to(speed, {
          v: boost, duration: 0.2, overwrite: true, onUpdate: applySpeed,
          onComplete: () => gsap.to(speed, { v: 1, duration: 1.4, ease: 'power2.out', onUpdate: applySpeed }),
        });
      },
    });

    // generic fade-up
    $$('[data-fade]').forEach(el => {
      gsap.from(el, {
        y: 46, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // gold flourishes draw themselves
    $$('.flourish').forEach(svg => {
      gsap.fromTo(svg, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut',
        scrollTrigger: { trigger: svg, start: 'top 92%', once: true },
      });
    });

    // image curtain reveals + gentle parallax
    $$('.reveal').forEach(el => {
      const img = $('img', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } })
        .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' })
        .fromTo(img, { scale: 1.45 }, { scale: 1.12, duration: 2, ease: 'expo.out' }, 0.1);
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // polaroids drop onto the table
    gsap.from('.polaroid', {
      y: -150, rotation: i => (i % 2 ? 22 : -22), autoAlpha: 0,
      duration: 1.3, ease: 'back.out(1.4)', stagger: 0.14,
      scrollTrigger: { trigger: '.polaroids', start: 'top 82%', once: true },
    });

    // family full-bleed
    gsap.fromTo('.fullbleed img', { scale: 1.3 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.fullbleed', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from('.fullbleed__caption > *', {
      y: 60, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.15,
      scrollTrigger: { trigger: '.fullbleed', start: 'top 55%', once: true },
    });

    // monthly milestones: start on the "ONE" photo, zoom out to all twelve months
    gsap.fromTo('.zoomframe img', { scale: 2.3 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.zoomframe', start: 'top 92%', end: 'center 48%', scrub: true },
    });

    // turning one — pinned horizontal gallery
    const hs = $('.hs');
    const track = $('.hs__track');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const hTween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: hs, start: 'top top', end: () => `+=${dist()}`,
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
      },
    });
    const hsFollow = { trigger: hs, start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true };
    gsap.to('.hs__bignum', { xPercent: -55, ease: 'none', scrollTrigger: hsFollow });
    gsap.to('.hs__bar span', { scaleX: 1, ease: 'none', scrollTrigger: { ...hsFollow } });
    $$('.hs__card').forEach(card => {
      const img = $('img', card);
      gsap.set(img, { scale: 1.16 });
      gsap.fromTo(img, { xPercent: 6 }, {
        xPercent: -6, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
      });
      gsap.from(card, {
        rotation: 5, y: 60, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'left 45%', scrub: true },
      });
    });

    // big outlined age numbers drift
    $$('.age__bignum').forEach(n => {
      gsap.fromTo(n, { yPercent: 18 }, {
        yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: n.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // turning two — circular reveal
    const circleSt = { trigger: '.circle-reveal', start: 'top 92%', end: 'center 52%', scrub: true };
    gsap.fromTo('.circle-reveal', { clipPath: 'circle(12% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: circleSt });
    gsap.fromTo('.circle-reveal img', { scale: 1.4 }, { scale: 1, ease: 'none', scrollTrigger: { ...circleSt } });

    // the two smaller photos drift at different speeds
    const pairSt = { trigger: '.pair', start: 'top bottom', end: 'bottom top', scrub: true };
    gsap.fromTo('.pair__item--port', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: pairSt });
    gsap.fromTo('.pair__item--land', { y: -20 }, { y: 40, ease: 'none', scrollTrigger: { ...pairSt } });

    // turning three — stacked cards settle back as the next arrives
    const cards = $$('.stack__card');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true } })
        .to(card, { scale: 0.92, ease: 'none' }, 0)
        .to($('.stack__shade', card), { opacity: 0.5, ease: 'none' }, 0);
    });

    // the big 4 — dive straight through it into the invitation
    gsap.timeline({
      scrollTrigger: { trigger: '.dive', start: 'top top', end: '+=230%', pin: true, scrub: 0.7, anticipatePin: 1 },
    })
      .fromTo('.dive__four', { scale: 0.3, rotation: -25, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.6)' })
      .from('.dive__above', { y: 40, autoAlpha: 0, duration: 0.5 }, 0.2)
      .from('.dive__below', { y: 40, autoAlpha: 0, duration: 0.5 }, 0.55)
      .from('.dive__spark', { scale: 0, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, 0.5)
      .to({}, { duration: 0.6 })
      .addLabel('zoom')
      .to(['.dive__above', '.dive__below'], { autoAlpha: 0, y: -30, duration: 0.4 }, 'zoom')
      .to('.dive__spark', { scale: 4, autoAlpha: 0, duration: 0.7 }, 'zoom')
      .to('.dive__four', { scale: 48, duration: 2.2, ease: 'power3.in' }, 'zoom')
      .to('.dive__pin', { backgroundColor: '#560e1f', duration: 0.35 }, 'zoom+=1.85');

    // invitation card tilt (pointer devices)
    gsap.from('.invite-card', {
      rotationY: -28, rotationX: 10, y: 80, autoAlpha: 0, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: '.invite-card', start: 'top 88%', once: true },
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const tilt = $('.invite-card__tilt');
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' });
      tilt.addEventListener('pointermove', e => {
        const r = tilt.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - 0.5) * -16);
        ry(((e.clientX - r.left) / r.width - 0.5) * 16);
      });
      tilt.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }

    // family cards
    gsap.from('.host', {
      y: 80, rotation: i => (i - 1) * 4, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.hosts__grid', start: 'top 85%', once: true },
    });

    // footer
    gsap.from('.footer__big > *', {
      yPercent: 60, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.footer', start: 'top 75%', once: true },
    });
    ScrollTrigger.create({
      trigger: '.footer', start: 'top 60%', once: true,
      onEnter: () => confettiBurst({ particleCount: 70, spread: 100, startVelocity: 38, origin: { x: 0.5, y: 0.7 } }),
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------------------------------------------------
     "Party details" pill: tucks away while scrolling down,
     returns on scroll up, gone once the invitation is reached
     --------------------------------------------------------- */
  function setupJump() {
    const jump = $('.jump');
    let pastInvite = false;
    let scrollingDown = false;
    let lastY = window.scrollY;
    const update = () => jump.classList.toggle('is-hidden', pastInvite || scrollingDown);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        pastInvite = entry.isIntersecting || entry.boundingClientRect.top < 0;
        update();
      }, { rootMargin: '0px 0px -30% 0px' }).observe($('#invite'));
    }
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 10) return;
      scrollingDown = y > lastY && y > 400;
      lastY = y;
      update();
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Make a wish — blow out the candles
     --------------------------------------------------------- */
  function setupWish() {
    const candles = $$('.candle');
    const msg = $('#wishMsg');
    const hint = $('#wishHint');
    const relight = $('#relightBtn');
    let out = 0;

    candles.forEach(c => c.addEventListener('click', () => {
      if (c.classList.contains('is-out')) return;
      c.classList.add('is-out');
      c.setAttribute('aria-pressed', 'true');
      out += 1;

      const puff = document.createElement('span');
      puff.className = 'smoke';
      c.appendChild(puff);
      setTimeout(() => puff.remove(), 1500);

      const r = c.getBoundingClientRect();
      confettiBurst({
        particleCount: 16, spread: 55, startVelocity: 18, scalar: 0.7, ticks: 120,
        origin: { x: (r.left + r.width / 2) / window.innerWidth, y: r.top / window.innerHeight },
      });

      if (out === candles.length) {
        setTimeout(() => {
          hint.textContent = 'All four candles — done!';
          msg.textContent = 'Your wish is on its way to Fajr ✨';
          relight.hidden = false;
          confettiBurst();
        }, 450);
      } else {
        hint.textContent = `${candles.length - out} more to go…`;
      }
    }));

    relight.addEventListener('click', () => {
      candles.forEach(c => { c.classList.remove('is-out'); c.removeAttribute('aria-pressed'); });
      out = 0;
      msg.textContent = '';
      relight.hidden = true;
      hint.textContent = 'Tap each candle to blow it out.';
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  setupDetails();
  setupCountdown();
  setupJump();
  setupWish();
  initScroll();
})();
