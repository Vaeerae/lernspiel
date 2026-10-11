/* Lesen & Buchstaben: Lernmodus + Spiele */
const Reading = (() => {
  const { el, pick, shuffle, sample, choiceTask } = UI;
  const W = DATA.words;

  // Reihenfolge wie in vielen Erstlese-Lehrgängen: zuerst Vokale und Dauerlaute
  const LEARN_ORDER = ['M', 'A', 'L', 'O', 'S', 'I', 'N', 'E', 'T', 'R', 'U', 'B', 'D', 'F', 'H', 'W', 'G', 'K', 'P', 'Z', 'J',
    'Ä', 'Ö', 'Ü', 'C', 'V', 'Q', 'X', 'Y', 'SCH', 'CH', 'EI', 'AU', 'EU'];
  const GROUP_WORDS = {
    SCH: [{ w: 'Schaf', e: '🐑' }, { w: 'Schule', e: '🏫' }, { w: 'Schiff', e: '🚢' }],
    CH: [{ w: 'Buch', e: '📖' }, { w: 'Dach', e: '🏠' }, { w: 'Kuchen', e: '🎂' }],
    EI: [{ w: 'Ei', e: '🥚' }, { w: 'Eis', e: '🍦' }, { w: 'Eimer', e: '🪣' }],
    AU: [{ w: 'Auto', e: '🚗' }, { w: 'Auge', e: '👁️' }, { w: 'Baum', e: '🌳' }],
    EU: [{ w: 'Eule', e: '🦉' }, { w: 'Feuer', e: '🔥' }, { w: 'Euro', e: '💶' }],
    C: [{ w: 'Clown', e: '🤡' }, { w: 'Computer', e: '💻' }], Q: [{ w: 'Quelle', e: '💧' }, { w: 'Quark', e: '🥣' }],
    X: [{ w: 'Xylofon', e: '🎼' }, { w: 'Hexe', e: '🧙' }], Y: [{ w: 'Yak', e: '🐃' }, { w: 'Yoga', e: '🧘' }],
    V: [{ w: 'Vogel', e: '🐦', }, { w: 'Velo', e: '🚲' }, { w: 'Vase', e: '🏺' }],
    Ä: [{ w: 'Bär', e: '🐻' }, { w: 'Käse', e: '🧀' }, { w: 'Säge', e: '🪚' }],
    Ö: [{ w: 'Löwe', e: '🦁' }, { w: 'Möwe', e: '🐦' }, { w: 'Öl', e: '🫙' }],
    Ü: [{ w: 'Mütze', e: '🧢' }, { w: 'Tür', e: '🚪' }, { w: 'Würfel', e: '🎲' }],
  };
  function wordsFor(letter) {
    if (GROUP_WORDS[letter]) return GROUP_WORDS[letter];
    return W.filter(x => x.first === letter && !DATA.anlautExclude.has(x.w)).slice(0, 4);
  }

  // ---------- Lernmodus: Buchstaben kennenlernen ----------
  function learn(onBack) {
    const root = UI.screen();
    let idx = parseInt(localStorage.getItem('learn-letter') || '0');
    function show() {
      idx = (idx + LEARN_ORDER.length) % LEARN_ORDER.length;
      localStorage.setItem('learn-letter', idx);
      const L = LEARN_ORDER[idx];
      const lower = L.toLowerCase();
      const ws = wordsFor(L);
      root.innerHTML = '';
      const letterBox = el('div', { class: 'prompt', style: 'cursor:pointer', onclick: () => Speech.laut(L) },
        el('span', { class: 'big' }, `${L} ${lower}`),
        el('button', { class: 'speak-btn', onclick: (e) => { e.stopPropagation(); Speech.lautMitBeispiel(L, ws[0]?.w); } }, '🔊'));
      const wordRow = el('div', { class: 'options' }, ...ws.map(x =>
        el('button', { class: 'opt pic', onclick: () => Speech.buchstabieren(x.w) },
          el('div', {}, el('div', {}, x.e), el('div', { style: 'font-size:28px;letter-spacing:2px' },
            el('span', { style: 'color:var(--read)' }, x.w.slice(0, L.length)), x.w.slice(L.length))))));
      const nav = el('div', { class: 'toolbar' },
        el('button', { class: 'btn big secondary', onclick: () => { idx--; show(); } }, '◀'),
        el('button', { class: 'btn big', style: 'background:var(--write)', onclick: () => Writing.trace(L, () => learn(onBack)) }, '✏️ Nachspuren'),
        el('button', { class: 'btn big secondary', onclick: () => { idx++; show(); } }, '▶'));
      const hint = el('p', { style: 'color:var(--muted);text-align:center;margin:0' },
        `Buchstabe ${idx + 1} von ${LEARN_ORDER.length} – tippe auf den Buchstaben, um den Laut zu hören. Tippe auf ein Bild, um das Wort lautiert zu hören.`);
      root.append(el('div', { class: 'task' }, letterBox, wordRow, nav, hint));
      setTimeout(() => Speech.lautMitBeispiel(L, ws[0]?.w), 250);
    }
    show();
  }

  // ---------- Spiel 1: Anlaut – Buchstabe sehen, Bild finden ----------
  const anlaut = {
    id: 'anlaut', title: 'Anlaute', emoji: '🔤', maxLevel: 3,
    makeTask(level) {
      const pool = W.filter(x => DATA.anlautLetters.includes(x.first) && !DATA.anlautExclude.has(x.w));
      const target = pick(pool);
      const n = level === 1 ? 3 : 4;
      const others = sample(pool.filter(x => x.first !== target.first), n - 1);
      const opts = shuffle([target, ...others]).map(x => ({ value: x.w, node: x.e }));
      return choiceTask({
        promptNodes: [el('span', { class: 'big' }, target.first + (level >= 2 ? ' ' + target.first.toLowerCase() : ''))],
        speakFn: async () => { await Speech.speak('Welches Bild beginnt mit'); await Speech.laut(target.first); },
        options: opts, correct: target.w, optClass: 'pic',
        onCorrectSpeak: () => Speech.speak(`${target.w}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 2: Laut hören, Buchstabe antippen ----------
  const lautHoeren = {
    id: 'laut', title: 'Laute hören', emoji: '👂', maxLevel: 3,
    makeTask(level) {
      const letters = level === 1 ? ['M', 'A', 'L', 'O', 'S', 'I', 'N', 'E', 'T', 'U'] : level === 2 ? DATA.anlautLetters : [...DATA.alphabet, ...DATA.umlaute];
      const target = pick(letters);
      const others = sample(letters.filter(l => l !== target), level === 1 ? 2 : 3);
      const asLower = level === 3;
      const opts = shuffle([target, ...others]).map(l => ({ value: l, label: asLower ? l.toLowerCase() : l }));
      const ex = DATA.exampleFor[target];
      return choiceTask({
        promptNodes: [el('span', { class: 'pic' }, '👂')],
        speakFn: () => Speech.lautMitBeispiel(target, ex),
        options: opts, correct: target, narrow: true,
        onCorrectSpeak: () => Speech.laut(target),
      });
    },
  };

  // ---------- Spiel 3: Wort lesen, Bild finden ----------
  const wortLesen = {
    id: 'lesen', title: 'Wörter lesen', emoji: '📖', maxLevel: 3,
    makeTask(level) {
      const pool = W.filter(x => x.s <= level);
      const target = pick(pool);
      const others = sample(pool.filter(x => x.w !== target.w && x.e !== target.e), level === 1 ? 2 : 3);
      const opts = shuffle([target, ...others]).map(x => ({ value: x.w, node: x.e }));
      return choiceTask({
        promptNodes: [el('span', { class: 'big', style: 'font-size:84px' }, target.w)],
        speakFn: () => Speech.buchstabieren(target.w),
        options: opts, correct: target.w, optClass: 'pic',
        onCorrectSpeak: () => Speech.speak(`${target.w}. ${UI.praise()}`),
      });
    },
  };

  // ---------- Spiel 4: Bild sehen, Wort finden ----------
  const wortFinden = {
    id: 'wortfinden', title: 'Wort zum Bild', emoji: '🖼️', maxLevel: 3,
    makeTask(level) {
      const pool = W.filter(x => x.s <= level);
      const target = pick(pool);
      // Ablenker mit gleichem Anlaut sind schwieriger (Stufe 3)
      let distract = level === 3 ? pool.filter(x => x.w !== target.w && x.first === target.first) : [];
      if (distract.length < 2) distract = pool.filter(x => x.w !== target.w);
      const others = sample(distract, 2);
      const opts = shuffle([target, ...others]).map(x => ({ value: x.w, label: x.w }));
      return choiceTask({
        promptNodes: [el('span', { class: 'pic' }, target.e)],
        speakText: `Welches Wort heisst ${target.w}?`,
        options: opts, correct: target.w, optClass: 'word',
        onCorrectSpeak: () => Speech.buchstabieren(target.w),
      });
    },
  };

  // ---------- Spiel 5: Gross- und Kleinbuchstaben ----------
  const grossKlein = {
    id: 'grossklein', title: 'Gross & klein', emoji: '🅰️', maxLevel: 2,
    makeTask(level) {
      const letters = level === 1 ? ['M', 'A', 'L', 'O', 'S', 'I', 'N', 'E', 'T', 'U', 'B', 'D', 'F', 'H'] : DATA.alphabet;
      const target = pick(letters);
      const others = sample(letters.filter(l => l !== target), 3);
      const opts = shuffle([target, ...others]).map(l => ({ value: l, label: l.toLowerCase() }));
      return choiceTask({
        promptNodes: [el('span', { class: 'big' }, target)],
        speakFn: async () => { await Speech.speak('Finde den kleinen Buchstaben zu'); await Speech.laut(target); },
        options: opts, correct: target, narrow: true,
        onCorrectSpeak: () => Speech.laut(target),
      });
    },
  };

  // ---------- Spiel 6: Wörter bauen (Buchstaben in Reihenfolge antippen) ----------
  const wortBauen = {
    id: 'bauen', title: 'Wörter bauen', emoji: '🧩', maxLevel: 3,
    makeTask(level) {
      const pool = W.filter(x => x.s === level && x.w.length <= 7);
      const target = pick(pool);
      const parts = Speech.zerlegen(target.w).map((p, i) => i === 0 ? p[0] + p.slice(1).toLowerCase() : p.toLowerCase());
      // Bei Stufe 1 keine Ablenker, danach 1–2 zusätzliche Buchstaben
      const extra = level === 1 ? [] : sample(DATA.alphabet.map(l => l.toLowerCase()).filter(l => !parts.includes(l)), level - 1);
      const tiles = shuffle([...parts, ...extra]);
      return {
        speakPrompt: () => Speech.buchstabieren(target.w),
        render(wrap, ctl) {
          let pos = 0;
          const slots = parts.map(() => el('div', { class: 'slot' }));
          const prompt = el('div', { class: 'prompt' }, el('span', { class: 'pic' }, target.e),
            el('button', { class: 'speak-btn', onclick: () => Speech.buchstabieren(target.w) }, '🔊'));
          const slotRow = el('div', { class: 'slots' }, ...slots);
          const letterRow = el('div', { class: 'letters' });
          tiles.forEach(t => {
            const b = el('button', { class: 'letter' }, t);
            b.onclick = () => {
              if (t === parts[pos]) {
                Speech.laut(t);
                slots[pos].textContent = t; slots[pos].classList.add('filled');
                b.classList.add('used'); pos++;
                if (pos === parts.length) {
                  slots.forEach(s => s.classList.add('ok'));
                  setTimeout(() => Speech.speak(`${target.w}! ${UI.praise()}`), 300);
                  ctl.right(1600);
                }
              } else {
                b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450);
                ctl.wrong();
              }
            };
            letterRow.append(b);
          });
          wrap.append(prompt, slotRow, letterRow);
        },
      };
    },
  };

  const games = [anlaut, lautHoeren, grossKlein, wortLesen, wortFinden, wortBauen];
  return { games, learn, LEARN_ORDER, wordsFor };
})();
