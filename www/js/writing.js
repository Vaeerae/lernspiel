/* Schreiben: Buchstaben und Zahlen mit dem Finger nachspuren */
const Writing = (() => {
  const { el } = UI;
  const COLORS = ['#4f7cff', '#ff5c5c', '#3ec28f', '#b06cf0', '#ff8a5b', '#2b2d42'];
  const ITEMS = [...DATA.alphabet, ...DATA.umlaute, ...'0123456789'.split('')];

  /** Nachspur-Bildschirm. item = 'A' | 'm' | '7'; onBack → zurück */
  function trace(item, onBack) {
    const root = UI.screen();
    root.innerHTML = '';
    let current = item;
    let color = COLORS[0];
    let lower = false;

    const guide = el('div', { class: 'guide' });
    const canvas = el('canvas');
    const linesSvg = el('div', { class: 'lines' });
    const tracer = el('div', { class: 'tracer' }, linesSvg, guide, canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
      const r = tracer.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 18;
      // Schreiblinien (Grundlinie, Mittellinie, Oberlinie) wie im Schulheft
      const h = r.height; const top = h * 0.2, mid = h * 0.5, base = h * 0.8;
      linesSvg.innerHTML = `<svg width="100%" height="100%"><line x1="0" x2="100%" y1="${top}" y2="${top}" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="0" x2="100%" y1="${mid}" y2="${mid}" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8 8"/>
        <line x1="0" x2="100%" y1="${base}" y2="${base}" stroke="#94a3b8" stroke-width="3"/></svg>`;
    }
    function clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    function setItem(it) {
      current = it;
      const isDigit = /\d/.test(it);
      guide.textContent = isDigit ? it : (lower ? it.toLowerCase() : it.toUpperCase());
      clear();
      pickBox.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === it));
      if (isDigit) Speech.zahl(parseInt(it)); else Speech.laut(it);
    }

    // Zeichnen mit Finger/Maus (Pointer Events)
    let drawing = false;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(...pos(e)); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); });
    const stopDraw = () => { drawing = false; };
    canvas.addEventListener('pointerup', stopDraw); canvas.addEventListener('pointercancel', stopDraw);

    // Seitenleiste: Auswahl + Werkzeuge
    const pickBox = el('div', { class: 'pick' }, ...ITEMS.map(v => el('button', { 'data-v': v, onclick: () => setItem(v) }, v)));
    const colorRow = el('div', { class: 'toolbar' }, ...COLORS.map(c => el('button', { class: 'btn color', style: `background:${c}`, onclick: () => { color = c; } })));
    const tools = el('div', { class: 'toolbar' },
      el('button', { class: 'btn secondary', onclick: clear }, '🧽 Löschen'),
      el('button', { class: 'btn secondary', onclick: () => { lower = !lower; setItem(current); } }, 'Aa gross/klein'),
      el('button', { class: 'btn', onclick: () => /\d/.test(current) ? Speech.zahl(parseInt(current)) : Speech.laut(current) }, '🔊'),
      el('button', { class: 'btn secondary', onclick: onBack }, '◀ Zurück'));
    const side = el('div', { class: 'write-side' }, pickBox, colorRow);

    root.append(el('div', { class: 'task' },
      el('div', { class: 'write-wrap' }, side, tracer), tools));
    resize();
    window.addEventListener('resize', resize, { once: true });
    setItem(current);
  }

  return { trace };
})();
