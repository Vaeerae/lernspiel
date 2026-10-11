/* App-Gerüst: Startseite, Bereiche, Eltern-Bereich, Navigation */
(() => {
  const { el } = UI;
  const title = document.getElementById('title');
  const back = document.getElementById('btn-back');
  let backFn = null;

  function setView(name, onBack) {
    title.textContent = name;
    backFn = onBack;
    back.hidden = !onBack;
    Speech.stop();
    UI.screen().scrollTop = 0;
  }
  back.onclick = () => backFn && backFn();

  // Ton an/aus
  const soundBtn = document.getElementById('btn-sound');
  const renderSound = () => { soundBtn.textContent = Speech.enabled ? '🔊' : '🔇'; };
  soundBtn.onclick = () => { Speech.toggle(); renderSound(); };
  renderSound();

  // ---------- Startseite ----------
  function home() {
    setView('Lernspiel', null);
    const root = UI.screen();
    root.innerHTML = '';
    const done = Object.keys(Story.state.stars).length;
    root.append(
      el('div', { class: 'menu-head' }, el('h1', {}, 'Hallo! Was möchtest du machen?')),
      el('div', { class: 'menu' },
        tile('🦄', 'Abenteuer', `Rette die Einhornwelt · Kapitel ${Math.min(done + 1, Story.CHAPTERS.length)}`, 'read', () => { setView('Abenteuer', home); Story.map(home); }),
        tile('📖', 'Lesen üben', 'Buchstaben, Laute, Wörter', 'read', readingHub),
        tile('🔢', 'Zahlen üben', 'Zählen, Zerlegen, Rechnen', 'num', numbersHub),
        tile('✏️', 'Schreiben', 'Buchstaben & Zahlen nachspuren', 'write', () => { setView('Schreiben', home); Writing.trace('A', home); }),
        tile('⚙️', 'Einstellungen', UI.settings.caps ? 'Nur Grossbuchstaben' : 'Gross und klein', '', settingsScreen),
        tile('👨‍👩‍👧', 'Eltern', 'Laute aufnehmen, Fortschritt', '', parents)));
  }

  function tile(emoji, name, sub, cls, onclick, extra = []) {
    return el('button', { class: `tile ${cls}`, onclick }, el('div', { class: 'emoji' }, emoji), name, el('div', { class: 'sub' }, sub), ...extra);
  }

  function gameTile(g, cls, hub) {
    const st = UI.gameState(g.id);
    return tile(g.emoji, g.title, `Stufe ${st.level} von ${g.maxLevel}`, cls,
      () => { setView(g.title, hub); UI.runRound(g, hub); },
      [st.best ? el('div', { class: 'badge' }, '⭐'.repeat(st.best)) : null]);
  }

  // ---------- Lesen ----------
  function readingHub() {
    setView('Lesen üben', home);
    const root = UI.screen();
    root.innerHTML = '';
    root.append(
      el('div', { class: 'menu-head' }, el('h1', {}, '📖 Lesen'), el('p', {}, 'Zuerst die Buchstaben kennenlernen, dann spielen.')),
      el('div', { class: 'menu' },
        tile('🅰️', 'Buchstaben lernen', 'Jeder Laut einzeln erklärt', 'read', () => { setView('Buchstaben lernen', readingHub); Reading.learn(readingHub); }),
        ...Reading.games.filter(g => !(g.hidden && g.hidden())).map(g => gameTile(g, 'read', readingHub))));
  }

  // ---------- Zahlen ----------
  function numbersHub() {
    setView('Zahlen üben', home);
    const root = UI.screen();
    root.innerHTML = '';
    root.append(
      el('div', { class: 'menu-head' }, el('h1', {}, '🔢 Zahlen'), el('p', {}, 'Zuerst die Zahlen kennenlernen, dann spielen.')),
      el('div', { class: 'menu' },
        tile('1️⃣', 'Zahlen lernen', 'Jede Zahl einzeln erklärt', 'num', () => { setView('Zahlen lernen', numbersHub); Numbers.learn(numbersHub); }),
        ...Numbers.games.map(g => gameTile(g, 'num', numbersHub))));
  }

  // ---------- Einstellungen ----------
  function settingsScreen() {
    setView('Einstellungen', home);
    const root = UI.screen();
    root.innerHTML = '';
    const opt = (label, sub, active, onclick) => el('button', { class: 'tile' + (active ? ' active' : ''), style: active ? 'outline:5px solid var(--primary)' : '', onclick },
      el('div', { class: 'emoji' }, label), el('div', { class: 'sub' }, sub));
    const render = () => {
      root.innerHTML = '';
      root.append(el('div', { style: 'margin:auto;width:100%;max-width:1000px' },
        el('div', { class: 'menu-head' }, el('h1', {}, '⚙️ Einstellungen')),
        el('h2', { style: 'text-align:center;margin:10px 0' }, 'Schrift'),
        el('div', { class: 'menu' },
          opt('A B C', 'Nur Grossbuchstaben – wie zu Beginn der 1. Klasse', UI.settings.caps, () => { UI.setSetting('caps', true); render(); }),
          opt('A a B b', 'Gross- und Kleinbuchstaben gemischt', !UI.settings.caps, () => { UI.setSetting('caps', false); render(); })),
        el('h2', { style: 'text-align:center;margin:24px 0 10px' }, 'Vorlesen'),
        el('div', { class: 'menu' },
          opt('🔊', 'Geschichte und Aufgaben automatisch vorlesen', UI.settings.autoRead, () => { UI.setSetting('autoRead', true); render(); }),
          opt('👆', 'Nur vorlesen, wenn der Lautsprecher angetippt wird', !UI.settings.autoRead, () => { UI.setSetting('autoRead', false); render(); }))));
    };
    render();
  }

  // ---------- Eltern-Bereich ----------
  function parents() {
    setView('Eltern', home);
    const root = UI.screen();
    root.innerHTML = '';
    const info = el('p', { style: 'color:var(--muted);max-width:800px' },
      'Alle Laute sind bereits als Sprachaufnahmen (Piper TTS, Stimme «Thorsten») in der App enthalten. ',
      'Wer möchte, kann einzelne Laute hier mit der eigenen Stimme aufnehmen – so, wie sie beim Lesen gesprochen werden: «mmm», nicht «em». ',
      'Eigene Aufnahmen werden nur auf diesem Gerät gespeichert und haben Vorrang.');
    const keys = [...Reading.LEARN_ORDER];
    const list = el('div', { class: 'options narrow' });
    let recorder = null, recKey = null;

    async function render() {
      const have = new Set(await Speech.listRecordings());
      list.innerHTML = '';
      for (const k of keys) {
        const has = have.has(k);
        const card = el('div', { class: 'opt', style: 'flex-direction:column;gap:8px;font-size:40px;min-height:150px;' + (has ? 'border-color:var(--ok)' : '') },
          el('div', {}, k, el('span', { style: 'font-size:22px;color:var(--muted)' }, has ? ' ✔' : '')),
          el('div', { style: 'display:flex;gap:6px' },
            el('button', { class: 'btn secondary', style: 'padding:8px 12px;font-size:16px', onclick: () => Speech.laut(k) }, '🔊'),
            el('button', { class: 'btn', style: 'padding:8px 12px;font-size:16px;background:var(--bad)', 'data-rec': k, onclick: (e) => toggleRec(k, e.currentTarget) }, recKey === k ? '⏹' : '⏺'),
            has ? el('button', { class: 'btn secondary', style: 'padding:8px 12px;font-size:16px', onclick: async () => { await Speech.deleteRecording(k); render(); } }, '🗑') : null));
        list.append(card);
      }
    }
    async function toggleRec(k, btn) {
      if (recorder) { recorder.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recKey = k; btn.textContent = '⏹';
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          recorder = null; recKey = null;
          await Speech.saveRecording(k, blob);
          render();
          Speech.laut(k);
        };
        recorder.start();
        setTimeout(() => recorder && recorder.state === 'recording' && recorder.stop(), 3000); // max. 3 Sekunden
      } catch (err) {
        alert('Mikrofon nicht verfügbar: ' + err.message);
      }
    }

    const resetBtn = el('button', { class: 'btn secondary', style: 'background:#fff0f0', onclick: () => {
      if (confirm('Wirklich den ganzen Fortschritt (Sterne, Stufen, Geschichte) löschen?')) {
        localStorage.removeItem('lernspiel-progress'); localStorage.removeItem('lernspiel-story');
        localStorage.removeItem('learn-letter'); localStorage.removeItem('learn-number');
        location.reload();
      } } }, '🗑 Fortschritt zurücksetzen');

    const stats = el('p', { style: 'color:var(--muted)' },
      `Gesammelte Sterne: ${UI.progress.stars} · Abenteuer-Kapitel geschafft: ${Object.keys(Story.state.stars).length} von ${Story.CHAPTERS.length}`);

    root.append(el('div', { class: 'task', style: 'align-items:flex-start' },
      el('h2', { style: 'margin:0' }, 'Laute aufnehmen'), info, list,
      el('h2', { style: 'margin:16px 0 0' }, 'Fortschritt'), stats, resetBtn));
    render();
  }

  // Start
  UI.updateStarbar();
  home();
  Speech.preloadBasics();

  // Offline-Fähigkeit (nur im Browser; in der Android-App nicht nötig)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !(window.Native && Native.isNative)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  // Sprachsynthese auf Android braucht eine erste Nutzerinteraktion
  document.addEventListener('pointerdown', () => { if ('speechSynthesis' in window) speechSynthesis.getVoices(); }, { once: true });
})();
