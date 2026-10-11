/* Zahlen: Lernmodus + Spiele (Zahlenraum 1–10, später bis 20) */
const Numbers = (() => {
  const { el, pick, shuffle, sample, rndInt, choiceTask } = UI;

  function objects(n, emoji, small = false) {
    const box = el('div', { class: 'objects' + (small || n > 10 ? ' small' : '') });
    for (let i = 0; i < n; i++) box.append(el('span', {}, emoji));
    return box;
  }
  /** Zehnerfeld (bzw. Zwanzigerfeld als zwei Felder) mit a roten und b blauen Punkten, q Fragezeichen */
  function tenframe(a, b = 0, q = 0) {
    const f = el('div', { class: 'tenframe' });
    for (let i = 0; i < 10; i++) {
      const c = el('div', { class: 'cell' });
      if (i < a) { c.classList.add('a'); c.textContent = '●'; }
      else if (i < a + b) { c.classList.add('b'); c.textContent = '●'; }
      else if (i < a + b + q) { c.classList.add('q'); c.textContent = '?'; }
      f.append(c);
    }
    return f;
  }
  function frames(n, q = 0) {
    const wrap = el('div', { class: 'twoframes' });
    wrap.append(tenframe(Math.min(n, 10), 0, Math.min(q, 10 - Math.min(n, 10))));
    if (n + q > 10) wrap.append(tenframe(Math.max(0, n - 10), 0, Math.max(0, n + q - 10) - Math.max(0, n - 10)));
    return wrap;
  }
  const numOpts = (correct, count, min, max) => {
    const pool = []; for (let i = min; i <= max; i++) if (i !== correct) pool.push(i);
    return shuffle([correct, ...sample(pool, count - 1)]).map(v => ({ value: v, label: v }));
  };

  // ---------- Lernmodus: Zahlen kennenlernen ----------
  function learn(onBack) {
    const root = UI.screen();
    let n = parseInt(localStorage.getItem('learn-number') || '1');
    function show() {
      n = Math.min(20, Math.max(1, n));
      localStorage.setItem('learn-number', n);
      const emoji = pick(DATA.countObjects);
      root.innerHTML = '';
      const numBox = el('div', { class: 'prompt', style: 'cursor:pointer', onclick: () => Speech.zahl(n) },
        el('span', { class: 'huge' }, n),
        el('span', { style: 'font-size:40px;color:var(--muted)' }, DATA.zahlwort[n]),
        el('button', { class: 'speak-btn', onclick: (e) => { e.stopPropagation(); Speech.zahl(n); } }, '🔊'));
      // Zählobjekte: jedes Antippen zählt laut mit
      const objBox = el('div', { class: 'objects' + (n > 10 ? ' small' : '') });
      for (let i = 1; i <= n; i++) {
        const s = el('span', { style: 'cursor:pointer;opacity:.45;transition:.2s' }, emoji);
        s.onclick = () => { s.style.opacity = 1; s.style.transform = 'scale(1.2)'; Speech.zahl(i); };
        objBox.append(s);
      }
      const countAll = el('button', { class: 'btn', onclick: async () => {
        const items = objBox.children;
        for (let i = 0; i < items.length; i++) {
          items[i].style.opacity = 1; items[i].style.transform = 'scale(1.2)';
          await Speech.zahl(i + 1); await new Promise(r => setTimeout(r, 150));
        }
      } }, '🔢 Zusammen zählen');
      const nav = el('div', { class: 'toolbar' },
        el('button', { class: 'btn big secondary', onclick: () => { n--; show(); } }, '◀'),
        countAll,
        el('button', { class: 'btn big', style: 'background:var(--write)', onclick: () => Writing.trace(String(n), () => learn(onBack)) }, '✏️ Nachspuren'),
        el('button', { class: 'btn big secondary', onclick: () => { n++; show(); } }, '▶'));
      const hint = el('p', { style: 'color:var(--muted);text-align:center;margin:0' },
        'Tippe die Dinge nacheinander an und zähle mit. Das Zehnerfeld zeigt die Zahl als Punkte.');
      root.append(el('div', { class: 'task' }, numBox, objBox, frames(n), nav, hint));
      setTimeout(() => Speech.speak(`Das ist die ${n}. ${DATA.zahlwort[n]}.`), 250);
    }
    show();
  }

  // ---------- Spiel 1: Zählen ----------
  const zaehlen = {
    id: 'zaehlen', title: 'Zählen', emoji: '🍎', maxLevel: 3,
    makeTask(level) {
      const max = level === 1 ? 5 : level === 2 ? 10 : 20;
      const n = rndInt(1, max);
      const emoji = pick(DATA.countObjects);
      return choiceTask({
        promptNodes: [objects(n, emoji)],
        speakText: 'Wie viele sind es? Zähle und tippe auf die richtige Zahl.',
        options: numOpts(n, level === 1 ? 3 : 4, 1, max), correct: n, narrow: true,
        onCorrectSpeak: () => Speech.speak(`${DATA.zahlwort[n]}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 2: Zahl hören ----------
  const zahlHoeren = {
    id: 'zahlhoeren', title: 'Zahl hören', emoji: '👂', maxLevel: 2,
    makeTask(level) {
      const max = level === 1 ? 10 : 20;
      const n = rndInt(1, max);
      return choiceTask({
        promptNodes: [el('span', { class: 'pic' }, '👂')],
        speakFn: () => Speech.speak(`Tippe auf die ${DATA.zahlwort[n]}.`),
        options: numOpts(n, 4, 1, max), correct: n, narrow: true,
        onCorrectSpeak: () => Speech.speak(`${DATA.zahlwort[n]}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 3: Menge erkennen (Zehnerfeld → Zahl, ohne zu zählen) ----------
  const menge = {
    id: 'menge', title: 'Zehnerfeld', emoji: '🔴', maxLevel: 2,
    makeTask(level) {
      const max = level === 1 ? 10 : 20;
      const n = rndInt(1, max);
      return choiceTask({
        promptNodes: [frames(n)],
        speakText: 'Wie viele Punkte sind im Feld?',
        options: numOpts(n, 4, 1, max), correct: n, narrow: true,
        onCorrectSpeak: () => Speech.speak(`${DATA.zahlwort[n]}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 4: Zahlenreihe ----------
  const reihe = {
    id: 'reihe', title: 'Zahlenreihe', emoji: '➡️', maxLevel: 3,
    makeTask(level) {
      const max = level === 1 ? 10 : 20;
      const len = 5;
      const start = rndInt(level === 3 ? 0 : 1, max - len + 1);
      const seq = Array.from({ length: len }, (_, i) => start + i);
      if (level === 3 && Math.random() < 0.5) seq.reverse();
      const qi = level === 1 ? len - 1 : rndInt(0, len - 1);
      const missing = seq[qi];
      const row = el('div', { class: 'numline' }, ...seq.map((v, i) => el('div', { class: 'n' + (i === qi ? ' q' : '') }, i === qi ? '?' : v)));
      return choiceTask({
        promptNodes: [row],
        speakText: 'Welche Zahl fehlt?',
        options: numOpts(missing, 4, Math.max(0, missing - 3), Math.min(20, missing + 3)), correct: missing, narrow: true,
        onCorrectSpeak: () => Speech.speak(seq.map(v => DATA.zahlwort[v]).join(', ') + `. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 5: Zerlegen (Kraft der 5 / der 10) ----------
  const zerlegen = {
    id: 'zerlegen', title: 'Zerlegen', emoji: '🧮', maxLevel: 3,
    makeTask(level) {
      const total = level === 1 ? 5 : level === 2 ? 10 : rndInt(6, 10);
      const a = rndInt(0, total);
      const b = total - a;
      const eq = el('div', { class: 'equation' }, a, el('span', { class: 'sign' }, '+'), el('span', { class: 'q' }, '?'), el('span', { class: 'sign' }, '='), total);
      return choiceTask({
        promptNodes: [el('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:14px' }, tenframe(a, 0, b), eq)],
        speakText: `${a} plus wie viel gibt ${total}?`,
        options: numOpts(b, 4, 0, total), correct: b, narrow: true,
        onCorrectSpeak: () => Speech.speak(`${a} plus ${b} gibt ${total}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 6: Plus und Minus ----------
  const rechnen = {
    id: 'rechnen', title: 'Plus & Minus', emoji: '➕', maxLevel: 3,
    makeTask(level) {
      const max = level === 1 ? 10 : 20;
      const plus = level === 1 ? true : Math.random() < 0.5;
      let a, b, r;
      if (plus) { a = rndInt(1, max - 1); b = rndInt(1, max - a); r = a + b; }
      else { a = rndInt(2, max); b = rndInt(1, a - 1); r = a - b; }
      const emoji = pick(DATA.countObjects);
      // Veranschaulichung: bei Plus zwei Farben im Feld, bei Minus durchgestrichene Objekte
      let visual;
      if (plus) visual = a + b <= 10 ? tenframe(a, b) : el('div', { class: 'twoframes' }, tenframe(Math.min(a, 10), Math.min(b, 10 - Math.min(a, 10))), tenframe(Math.max(0, a - 10), b - Math.min(b, 10 - Math.min(a, 10))));
      else {
        visual = el('div', { class: 'objects small' });
        for (let i = 0; i < a; i++) visual.append(el('span', { style: i >= r ? 'opacity:.3;text-decoration:line-through' : '' }, emoji));
      }
      const eq = el('div', { class: 'equation' }, a, el('span', { class: 'sign' }, plus ? '+' : '−'), b, el('span', { class: 'sign' }, '='), el('span', { class: 'q' }, '?'));
      return choiceTask({
        promptNodes: [el('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:14px' }, visual, eq)],
        speakText: `${a} ${plus ? 'plus' : 'minus'} ${b} gibt?`,
        options: numOpts(r, 4, Math.max(0, r - 3), Math.min(20, r + 3)), correct: r, narrow: true,
        onCorrectSpeak: () => Speech.speak(`${a} ${plus ? 'plus' : 'minus'} ${b} gibt ${r}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 7: Vergleichen ----------
  const vergleichen = {
    id: 'vergleichen', title: 'Mehr oder weniger', emoji: '⚖️', maxLevel: 2,
    makeTask(level) {
      const max = level === 1 ? 6 : 12;
      let a = rndInt(1, max), b = rndInt(1, max);
      while (a === b) b = rndInt(1, max);
      const more = Math.random() < 0.5;
      const e1 = pick(DATA.countObjects), e2 = pick(DATA.countObjects.filter(x => x !== e1));
      return choiceTask({
        promptNodes: [el('span', {}, more ? 'Wo sind mehr?' : 'Wo sind weniger?')],
        speakText: more ? 'Wo sind mehr? Tippe auf die Gruppe mit mehr.' : 'Wo sind weniger? Tippe auf die Gruppe mit weniger.',
        options: [{ value: 'a', node: objects(a, e1, true) }, { value: 'b', node: objects(b, e2, true) }],
        correct: (more ? a > b : a < b) ? 'a' : 'b',
        onCorrectSpeak: () => Speech.speak(`${Math.max(a, b)} ist mehr als ${Math.min(a, b)}. ${UI.praise()}`),
      });
    },
  };

  const games = [zaehlen, zahlHoeren, menge, reihe, vergleichen, zerlegen, rechnen];
  return { games, learn };
})();
