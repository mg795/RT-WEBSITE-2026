/* live-counters.js
   Deterministic, always-increasing counters computed from the wall clock.
   Each digit slides up from below and out the top when its value changes.
*/
(function () {
  'use strict';

  function fmt(n) {
    return Math.floor(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function scheduledTicks(epochMs, cycleDays, offsetsH, nowMs) {
    const elapsed = nowMs - epochMs;
    if (elapsed < 0) return 0;
    const cycleMs = cycleDays * 86400000;
    const cycles = Math.floor(elapsed / cycleMs);
    const pos = elapsed % cycleMs;
    let inCurrent = 0;
    for (const h of offsetsH) {
      if (pos >= h * 3600000) inCurrent++;
    }
    return cycles * offsetsH.length + inCurrent;
  }

  // ─── CONFIG ────────────────────────────────────────────────────
  const COUNTERS = {
    clients: {
      base: 2594,
      epochMs: Date.UTC(2026, 4, 1, 12, 0, 0),  // 2026-05-01 08:00 EDT
      cycleDays: 2,
      offsetsH: [0, 7],
    },
    referrals: {
      base: 2307,
      epochMs: Date.UTC(2026, 4, 1, 20, 0, 0),  // 2026-05-01 16:00 EDT
      cycleDays: 3,
      offsetsH: [0],
    },
    words: {
      base: 39400000,
      epochMs: Date.UTC(2026, 3, 30, 16, 30, 0), // 2026-04-30 12:30 EDT
      intervalSeconds: 3,
      // Each tick adds the next value in this cycle, then loops. Feels
      // organic because consecutive jumps vary in size, but it's still
      // deterministic — every visitor sees the same total at the same moment.
      increments: [3, 14, 6, 11, 2, 17],
    },
  };
  // ────────────────────────────────────────────────────────────────

  function valueFor(key, nowMs) {
    const c = COUNTERS[key];
    if (!c) return null;
    if (key === 'words') {
      const elapsed = nowMs - c.epochMs;
      if (elapsed < 0) return c.base;
      const ticks = Math.floor(elapsed / (c.intervalSeconds * 1000));
      const inc = c.increments;
      const cycleSum = inc.reduce(function (a, b) { return a + b; }, 0);
      const fullCycles = Math.floor(ticks / inc.length);
      let partial = 0;
      for (let i = 0; i < ticks % inc.length; i++) partial += inc[i];
      return c.base + fullCycles * cycleSum + partial;
    }
    return c.base + scheduledTicks(c.epochMs, c.cycleDays, c.offsetsH, nowMs);
  }

  function makeSlot(ch) {
    const slot = document.createElement('span');
    slot.className = 'cd';
    const stack = document.createElement('span');
    stack.className = 'cd-stack';
    const digit = document.createElement('span');
    digit.textContent = ch;
    stack.appendChild(digit);
    slot.appendChild(stack);
    return slot;
  }

  function renderInitial(el, value) {
    el.innerHTML = '';
    for (const ch of value) {
      el.appendChild(makeSlot(ch));
    }
  }

  function update(el, value) {
    const slots = el.querySelectorAll('.cd');
    const chars = [...value];

    if (slots.length !== chars.length) {
      // Length changed (e.g., 9,999,999 → 10,000,000) — re-render without animation.
      renderInitial(el, value);
      return;
    }

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const stack = slot.querySelector('.cd-stack');
      const cur = stack.firstElementChild;
      if (!cur || cur.textContent === chars[i]) continue;

      // Append the new digit below the current one.
      const next = document.createElement('span');
      next.textContent = chars[i];
      stack.appendChild(next);

      // Force reflow so the browser registers the starting transform of 0.
      void stack.offsetHeight;

      // Animate the stack up by one digit height.
      stack.style.transform = 'translateY(-100%)';

      // After the slide, reset: drop the old digit, snap stack back to 0.
      const cleanup = function () {
        stack.removeEventListener('transitionend', cleanup);
        if (cur.parentNode) cur.parentNode.removeChild(cur);
        stack.style.transition = 'none';
        stack.style.transform = '';
        // Force reflow before re-enabling transitions.
        void stack.offsetHeight;
        stack.style.transition = '';
      };
      stack.addEventListener('transitionend', cleanup);
    }
  }

  function tick() {
    const now = Date.now();
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      const key = el.getAttribute('data-counter');
      const v = valueFor(key, now);
      if (v == null) return;
      update(el, fmt(v));
    });
  }

  function init() {
    const targets = document.querySelectorAll('[data-counter]');
    if (!targets.length) return;

    // Replace the static text with slot markup using the value the user
    // is already seeing — first paint stays identical, no flash.
    targets.forEach(function (el) {
      const initial = (el.textContent || '').trim();
      renderInitial(el, initial);
    });

    // First sync (instant, in case the live value differs from the static one).
    tick();

    setInterval(tick, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
