/* live-counters.js
   Deterministic, always-increasing counters computed from the current
   wall-clock. No server, no localStorage — every visitor sees the same
   value at any given moment.
*/
(function () {
  'use strict';

  function fmt(n) {
    return Math.floor(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Count scheduled fires that have happened up to `nowMs`.
  // epochMs   = UTC ms of the very first fire
  // cycleDays = days between the start of consecutive cycles
  // offsetsH  = hour offsets within a cycle for each fire (0 = at cycle start)
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
  // Adjust epoch/base to change starting values or schedule shifts.
  // Eastern Time is set in UTC: EDT = UTC-4, EST = UTC-5.
  const COUNTERS = {
    clients: {
      base: 2500,
      // First fire: 2026-05-01 08:00 EDT = 12:00 UTC
      epochMs: Date.UTC(2026, 4, 1, 12, 0, 0),
      cycleDays: 2,
      // 8 AM ET (offset 0) and 3 PM ET (offset 7h) within each 2-day cycle
      offsetsH: [0, 7],
    },
    referrals: {
      base: 2300,
      // First fire: 2026-05-01 16:00 EDT = 20:00 UTC
      epochMs: Date.UTC(2026, 4, 1, 20, 0, 0),
      cycleDays: 3,
      offsetsH: [0],
    },
    words: {
      base: 39400000,
      // Tick every 3 seconds from this moment
      epochMs: Date.UTC(2026, 3, 30, 16, 30, 0),
      intervalSeconds: 3,
      perTick: 1,
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
      return c.base + ticks * c.perTick;
    }
    return c.base + scheduledTicks(c.epochMs, c.cycleDays, c.offsetsH, nowMs);
  }

  function setNumberOnly(el, value) {
    // The .number-big div may contain a trailing <span>+</span>.
    // We only replace the leading text node so the styled "+" is preserved.
    const first = el.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      first.nodeValue = value;
    } else {
      // No text node yet — insert one before any existing children.
      const t = document.createTextNode(value);
      el.insertBefore(t, el.firstChild || null);
    }
  }

  function update() {
    const now = Date.now();
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      const key = el.getAttribute('data-counter');
      const v = valueFor(key, now);
      if (v == null) return;
      setNumberOnly(el, fmt(v));
    });
  }

  function init() {
    if (!document.querySelector('[data-counter]')) return;
    update();
    // 3s tick covers the words counter; the slower ones recompute too,
    // which is cheap and keeps everything in sync if the tab is backgrounded.
    setInterval(update, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
