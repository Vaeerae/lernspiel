/* Hilfsfunktionen: DOM, Zufall, Feedback, Fortschritt, Rundenablauf */
const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const screen = () => document.getElementById('screen');

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  const rnd = (n) => Math.floor(Math.random() * n);
  const rndInt = (a, b) => a + rnd(b - a + 1);
  const pick = (arr) => arr[rnd(arr.length)];
  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /** n verschiedene Elemente aus arr, optional ohne bestimmte */
  function sample(arr, n, exclude = []) {
    const pool = shuffle(arr.filter(x => !exclude.includes(x)));
    return pool.slice(0, n);
  }

  // ---------- Töne ----------
  let actx = null;
  function beep(freqs, dur = 0.12, type = 'sine') {
    if (!Speech.enabled) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(); const g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, actx.currentTime + i * dur);
        g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (i + 1) * dur);
        o.connect(g).connect(actx.destination);
        o.start(actx.currentTime + i * dur); o.stop(actx.currentTime + (i + 1) * dur + 0.05);
      });
    } catch { /* kein Audio */ }
  }
  const soundOk = () => beep([660, 880, 1100], 0.11);
  const soundBad = () => beep([220, 180], 0.18, 'triangle');
  const soundWin = () => beep([523, 659, 784, 1047, 1319], 0.13);

  // ---------- Feedback-Overlay ----------
  const PRAISE = ['Super!', 'Toll gemacht!', 'Richtig!', 'Prima!', 'Genau!', 'Bravo!', 'Spitze!'];
  function flash(ok) {
    const f = document.getElementById('feedback');
    f.hidden = false;
    f.textContent = ok ? pick(['⭐', '🎉', '👏', '😀', '🌟']) : '🤔';
    f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    setTimeout(() => { f.hidden = true; }, 700);
  }
  function praise() { return pick(PRAISE); }

  // ---------- Konfetti ----------
  function confetti() {
    const c = document.getElementById('confetti');
    const ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5,
      vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: 6 + Math.random() * 8,
      col: pick(['#ff5c5c', '#ffd166', '#06d6a0', '#4f7cff', '#b06cf0', '#ff8a5b']), rot: Math.random() * 6,
    }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.rot += .1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      }
      if (++t < 180) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  // ---------- Fortschritt ----------
  const KEY = 'lernspiel-progress';
  const progress = JSON.parse(localStorage.getItem(KEY) || '{"stars":0,"games":{}}');
  function save() { localStorage.setItem(KEY, JSON.stringify(progress)); updateStarbar(); }
  function updateStarbar() { const s = document.getElementById('star-count'); if (s) s.textContent = progress.stars; }
  function gameState(id) { return progress.games[id] || (progress.games[id] = { level: 1, best: 0, played: 0 }); }

  // ---------- Runde ----------
  const ROUND_LEN = 8;
  /**
   * Führt eine Runde aus. game = { id, title, maxLevel, makeTask(level) → {render(container, done), speakPrompt()} }
   * done(ok) wird vom Task aufgerufen, sobald die Aufgabe (richtig) gelöst wurde; ok=false, wenn vorher Fehler gemacht wurden.
   */
  function runRound(game, onFinish, opts = {}) {
    const st = gameState(game.id);
    let i = 0, correctFirstTry = 0;
    const root = screen();
    const len = opts.length || ROUND_LEN;

    function next() {
      root.innerHTML = '';
      if (i >= len) return finish();
      const level = opts.fixedLevel || st.level;
      const task = game.makeTask(level);
      const bar = el('div', { class: 'progress' }, el('div', { style: `width:${(i / len) * 100}%` }));
      const wrap = el('div', { class: 'task' }, bar);
      root.append(wrap);
      let mistakes = 0;
      task.render(wrap, {
        wrong() { mistakes++; soundBad(); flash(false); },
        right(delay = 900) {
          soundOk(); flash(true);
          if (mistakes === 0) correctFirstTry++;
          i++;
          setTimeout(next, delay);
        },
      });
      setTimeout(() => task.speakPrompt && task.speakPrompt(), 300);
    }

    function finish() {
      const ratio = correctFirstTry / len;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      progress.stars += stars;
      st.played++;
      st.best = Math.max(st.best, stars);
      let msg = '';
      if (!opts.fixedLevel) {
        if (stars === 3 && st.level < game.maxLevel) { st.level++; msg = 'Du kommst in die nächste Stufe!'; }
        else if (stars === 1 && st.level > 1) { st.level--; msg = 'Wir üben noch einmal etwas Leichteres.'; }
      }
      save();
      if (opts.onResult) { root.innerHTML = ''; return opts.onResult(stars, correctFirstTry); }
      soundWin(); confetti();
      const r = el('div', { class: 'result' },
        el('div', { class: 'big-stars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
        el('h2', {}, stars === 3 ? 'Fantastisch!' : stars === 2 ? 'Gut gemacht!' : 'Weiter so!'),
        el('p', {}, `${correctFirstTry} von ${len} sofort richtig. ${msg}`),
        el('div', { class: 'toolbar' },
          el('button', { class: 'btn big', onclick: () => runRound(game, onFinish, opts) }, '🔁 Noch einmal'),
          el('button', { class: 'btn big secondary', onclick: onFinish }, '🏠 Zurück')),
      );
      root.innerHTML = ''; root.append(r);
      Speech.speak(`${stars === 3 ? 'Fantastisch!' : stars === 2 ? 'Gut gemacht!' : 'Weiter so!'} ${msg}`);
    }
    next();
  }

  /** Standard-Aufgabe: Aufforderung + Auswahl aus Optionen (eine richtig). */
  function choiceTask({ promptNodes, speakText, speakFn, options, correct, optClass = '', narrow = false, onCorrectSpeak }) {
    return {
      speakPrompt: speakFn || (() => speakText && Speech.speak(speakText)),
      render(wrap, ctl) {
        const prompt = el('div', { class: 'prompt' }, ...promptNodes,
          el('button', { class: 'speak-btn', 'aria-label': 'Vorlesen', onclick: () => (speakFn || (() => Speech.speak(speakText)))() }, '🔊'));
        const opts = el('div', { class: 'options' + (narrow ? ' narrow' : '') });
        for (const o of options) {
          const b = el('button', { class: 'opt ' + optClass }, o.node ?? o.label);
          b.onclick = () => {
            if (o.value === correct) {
              b.classList.add('correct');
              opts.querySelectorAll('.opt').forEach(x => x.classList.add('disabled'));
              if (onCorrectSpeak) setTimeout(onCorrectSpeak, 150);
              ctl.right();
            } else {
              b.classList.add('wrong', 'disabled');
              ctl.wrong();
            }
          };
          opts.append(b);
        }
        wrap.append(prompt, opts);
      },
    };
  }

  return { $, el, screen, rnd, rndInt, pick, shuffle, sample, soundOk, soundBad, soundWin, flash, praise, confetti,
    progress, save, gameState, updateStarbar, runRound, choiceTask, ROUND_LEN };
})();
