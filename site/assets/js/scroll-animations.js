/* scroll-animations.js
   GSAP + ScrollTrigger reveals for the homepage preview.
   Loaded only on /anim-preview.html so the production homepage stays
   untouched while we evaluate the effect.
*/
(function () {
  'use strict';

  // Respect users who've asked the system not to animate things.
  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP/ScrollTrigger not loaded; scroll animations disabled.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Default reveal: fade + 30px upward slide as the element scrolls
  // into roughly the bottom 15% of the viewport.
  function reveal(selector, opts) {
    opts = opts || {};
    gsap.utils.toArray(selector).forEach(function (el) {
      gsap.from(el, Object.assign({
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, opts, {
        scrollTrigger: Object.assign({
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }, opts.scrollTrigger || {})
      }));
    });
  }

  // ─── HERO ─────────────────────────────────────────────────────
  // Fires immediately on load, no scroll trigger.
  gsap.from('.hero-copy > *', {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    stagger: 0.15,
    delay: 0.2
  });

  // ─── SECTION TEXT BLOCKS ──────────────────────────────────────
  reveal('.section-label');
  reveal('.section-title', { delay: 0.05 });
  reveal('.section-body, .section-body.light', { delay: 0.1 });
  reveal('.hero-sub');
  reveal('.market-testimonial, .prod-testimonial, .partner-testimonial');

  // ─── STATS / LIVE COUNTERS ────────────────────────────────────
  gsap.from('.number-card', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.stats-col',
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });

  // ─── PRODUCT CARDS (Hot Take Engine, WebReno, etc.) ───────────
  // Scoped to the navy products section so it doesn't also grab the
  // ecosystem cards (whose grid has a red background that shows
  // through if we fade the cards).
  gsap.from('.section--navy .prod-grid .prod-card', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: '.section--navy .prod-grid',
      start: 'top 78%',
      toggleActions: 'play none none none'
    }
  });

  // ─── MARKETS WE SERVE TILES ───────────────────────────────────
  gsap.from('.markets-grid .market-tile', {
    y: 40,
    opacity: 0,
    scale: 0.96,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.08,
    scrollTrigger: {
      trigger: '.markets-grid',
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });

  // ─── ECOSYSTEM CARDS (Deli, ChatSales, etc.) ──────────────────
  // The ecosystem grid has a red background with 1px gaps between
  // cream cards — fading the cards exposes red. Animate the inner
  // content instead so the cards themselves stay solid.
  gsap.from('.ecosystem-section .prod-card > *', {
    y: 30,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.05,
    scrollTrigger: {
      trigger: '.ecosystem-section .prod-grid',
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });

  // ─── BLOG PREVIEW CARDS ───────────────────────────────────────
  gsap.from('.blog-preview-card', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.blog-grid, .blog-preview-grid',
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });

  // ─── SUBTLE PARALLAX ON FULL-BLEED SECTION IMAGES ─────────────
  // Pre-scale the image to 110% so the parallax shift never exposes
  // empty space at the bottom of the wrap (which was showing through
  // as a white bar). Desktop only — mobile parallax feels janky.
  if (window.matchMedia('(min-width: 769px)').matches) {
    gsap.utils.toArray('.img-section-wrap .img-full-bleed').forEach(function (img) {
      var wrap = img.closest('.img-section-wrap');
      if (!wrap) return;
      gsap.set(img, { scale: 1.1, transformOrigin: 'center center' });
      gsap.fromTo(img,
        { yPercent: 4 },
        {
          yPercent: -4,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5
          }
        }
      );
    });
  }

  // ─── CTA BUTTONS ──────────────────────────────────────────────
  // Only animate standalone buttons that aren't already inside a
  // container we're already revealing (cards, hero-copy, etc.).
  reveal('.btn-red:not(.hero-copy .btn-red):not(.prod-card .btn-red):not(.market-tile .btn-red):not(.blog-preview-card .btn-red)', { delay: 0.2 });

})();
