/* Sprachausgabe.
   Alle Laute, Zahlen, Wörter, Sätze und die Geschichte liegen als vorab erzeugte MP3-Dateien (Piper TTS, Stimme
   «Thorsten») unter audio/ und sind in audio/clips.js verzeichnet. Reihenfolge beim Abspielen:
     1. eigene Aufnahme aus dem Eltern-Bereich (IndexedDB)
     2. mitgelieferter Clip (audio/…)
     3. Sprachsynthese des Geräts (nur als Notlösung für unbekannte Sätze) */
const Speech = (() => {
  let enabled = localStorage.getItem('sound') !== 'off';
  let voice = null;
  let gen = 0;                 // Abspiel-Generation: ältere Abläufe brechen ab, sobald etwas Neues gesprochen wird
  let current = null;          // gerade laufendes Audio-Element
  const clips = typeof CLIPS !== 'undefined' ? CLIPS : { laute: {}, zahlen: {}, woerter: {}, saetze: {}, geschichte: {} };

  // Reserve-Lautschrift für die Sprachsynthese, falls ein Laut-Clip fehlt
  const LAUT_TTS = {
    A: 'aa', E: 'ee', I: 'ii', O: 'oo', U: 'uu', Ä: 'ää', Ö: 'öö', Ü: 'üü',
    M: 'mmm', N: 'nnn', S: 'sss', F: 'fff', L: 'lll', R: 'rrr', W: 'wwwe', H: 'hh',
    B: 'b', D: 'd', G: 'g', K: 'k', P: 'p', T: 't', Z: 'ts', J: 'jjj', C: 'k', Q: 'kw', V: 'fff', X: 'ks', Y: 'üü',
    SCH: 'sch', CH: 'ch', EI: 'ei', AU: 'au', EU: 'eu',
  };
  const fileKey = (k) => k.toUpperCase().replace('Ä', 'AE').replace('Ö', 'OE').replace('Ü', 'UE');

  // ---------- Clip-Verzeichnis: normalisierter Text → Datei ----------
  const norm = (t) => t.toLowerCase().replace(/[„“"'«»!?.,:;()\-–]/g, ' ').replace(/\s+/g, ' ').trim();
  const textMap = new Map();
  for (const kind of ['saetze', 'geschichte', 'woerter']) for (const [k, v] of Object.entries(clips[kind])) textMap.set(norm(k), 'audio/' + v);
  const zahlwort = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
    'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'];
  zahlwort.forEach((z, n) => { if (clips.zahlen[n]) { textMap.set(z, 'audio/' + clips.zahlen[n]); textMap.set(String(n), 'audio/' + clips.zahlen[n]); } });
  let maxPhrase = 1;
  for (const k of textMap.keys()) maxPhrase = Math.max(maxPhrase, k.split(' ').length);

  /** Einen Satz in Clip-Pfade auflösen (ganzer Satz oder Bausteine); null, wenn nicht vollständig möglich */
  function resolve(sentence) {
    const n = norm(sentence);
    if (!n) return [];
    if (textMap.has(n)) return [textMap.get(n)];
    const words = n.split(' ');
    const out = [];
    let i = 0;
    while (i < words.length) {
      let found = null;
      for (let len = Math.min(maxPhrase, words.length - i); len >= 1; len--) {
        const key = words.slice(i, i + len).join(' ');
        if (textMap.has(key)) { found = textMap.get(key); i += len; break; }
      }
      if (!found) return null;
      out.push(found);
    }
    return out;
  }

  // ---------- Audio-Elemente (werden wiederverwendet und vorgeladen) ----------
  const cache = new Map();
  function audio(src) {
    let a = cache.get(src);
    if (!a) { a = new Audio(src); a.preload = 'auto'; cache.set(src, a); }
    return a;
  }
  function preload(paths) { for (const p of paths) audio(p).load(); }
  function preloadBasics() {
    preload(Object.values(clips.laute).map(v => 'audio/' + v));
    preload(Object.values(clips.zahlen).map(v => 'audio/' + v));
    preload(Object.values(clips.saetze).map(v => 'audio/' + v));
  }
  function preloadText(text) { (resolve(text) || sentences(text).flatMap(s => resolve(s) || [])).forEach(p => audio(p).load()); }

  function playOne(src, myGen) {
    return new Promise((res) => {
      if (myGen !== gen) return res(false);
      const a = typeof src === 'string' ? audio(src) : new Audio(URL.createObjectURL(src));
      current = a;
      const done = (ok) => { a.onended = a.onerror = null; if (current === a) current = null; res(ok); };
      a.onended = () => done(true);
      a.onerror = () => done(false);
      try { a.currentTime = 0; } catch { /* noch nicht geladen */ }
      a.play().catch(() => done(false));
    });
  }
  async function playSeq(paths, myGen, gap = 60) {
    for (const p of paths) {
      if (myGen !== gen) return false;
      await playOne(p, myGen);
      if (gap) await new Promise(r => setTimeout(r, gap));
    }
    return true;
  }
  const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(s => s.trim());

  // ---------- Sprachsynthese (Reserve) ----------
  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    for (const l of ['de-DE', 'de-CH', 'de-AT', 'de']) {
      const v = voices.find(x => x.lang.replace('_', '-').startsWith(l));
      if (v) { voice = v; return; }
    }
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function tts(text, opts = {}) {
    if (window.Native && Native.hasTTS) return Native.speak(text, opts.rate ?? 0.85, opts.pitch ?? 1.05);
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) return res(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (voice && voice.lang) || 'de-DE';
      if (voice) u.voice = voice;
      u.rate = opts.rate ?? 0.85; u.pitch = opts.pitch ?? 1.05;
      u.onend = () => res(true); u.onerror = () => res(false);
      speechSynthesis.speak(u);
    });
  }

  // ---------- Aufnahmen (IndexedDB, beim Start in den Speicher geladen) ----------
  const recordings = new Map();   // KEY → Blob
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('lernspiel-audio', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('laute');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function loadRecordings() {
    try {
      const d = await db();
      await new Promise((res) => {
        const store = d.transaction('laute').objectStore('laute');
        const q = store.openCursor();
        q.onsuccess = () => { const c = q.result; if (c) { recordings.set(c.key, c.value); c.continue(); } else res(); };
        q.onerror = () => res();
      });
    } catch { /* keine Datenbank */ }
  }
  async function saveRecording(key, blob) {
    const d = await db();
    await new Promise((res, rej) => { const t = d.transaction('laute', 'readwrite'); t.objectStore('laute').put(blob, key); t.oncomplete = res; t.onerror = () => rej(t.error); });
    recordings.set(key, blob);
  }
  async function deleteRecording(key) {
    const d = await db();
    await new Promise((res) => { const t = d.transaction('laute', 'readwrite'); t.objectStore('laute').delete(key); t.oncomplete = res; t.onerror = res; });
    recordings.delete(key);
  }
  const listRecordings = async () => [...recordings.keys()];
  const ready = loadRecordings();

  // ---------- Öffentliche Funktionen ----------
  function stop() {
    gen++;
    if (current) { try { current.pause(); } catch { /* ignorieren */ } current = null; }
    if (window.Native && Native.hasTTS) Native.stop();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  /** Beliebigen Text sprechen: Sätze aus Clips zusammensetzen, Rest per Sprachsynthese */
  async function speak(text) {
    if (!enabled || !text) return;
    stop();
    const myGen = gen;
    const whole = resolve(text);
    if (whole) return playSeq(whole, myGen);
    for (const s of sentences(text)) {
      if (myGen !== gen) return;
      const paths = resolve(s);
      if (paths) await playSeq(paths, myGen);
      else await tts(s);
      await new Promise(r => setTimeout(r, 120));
    }
  }

  /** Einen Laut sprechen: 'M', 'A', 'SCH' … */
  async function laut(key) {
    if (!enabled) return;
    key = key.toUpperCase();
    stop();
    const myGen = gen;
    const rec = recordings.get(key);
    if (rec) return playOne(rec, myGen);
    const clip = clips.laute[fileKey(key)];
    if (clip && await playOne('audio/' + clip, myGen)) return;
    if (myGen === gen) return tts(LAUT_TTS[key] || key.toLowerCase(), { rate: 0.7 });
  }

  /** Laut + Beispielwort: «mmm – wie in Maus» */
  async function lautMitBeispiel(key, beispiel) {
    if (!enabled) return;
    await laut(key);
    const myGen = gen;
    if (beispiel && myGen === gen) { await new Promise(r => setTimeout(r, 250)); if (myGen === gen) await speak(`wie in ${beispiel}`); }
  }

  /** Wort lautierend sprechen: M – A – U – S, dann «Maus» */
  async function buchstabieren(word) {
    if (!enabled) return;
    stop();
    const myGen = gen;
    for (const p of zerlegen(word)) {
      if (myGen !== gen) return;
      const rec = recordings.get(p);
      const clip = clips.laute[fileKey(p)];
      if (rec) await playOne(rec, myGen);
      else if (clip) await playOne('audio/' + clip, myGen);
      else await tts(LAUT_TTS[p] || p.toLowerCase(), { rate: 0.7 });
      await new Promise(r => setTimeout(r, 90));
    }
    if (myGen !== gen) return;
    await new Promise(r => setTimeout(r, 200));
    const paths = resolve(word);
    if (paths) await playSeq(paths, myGen); else await tts(word);
  }

  /** Wort in Laut-Einheiten zerlegen (Sch, Ch, Ei, Au, Eu zusammenhalten) */
  function zerlegen(word) {
    const w = word.toUpperCase();
    const out = [];
    let i = 0;
    while (i < w.length) {
      if (w.startsWith('SCH', i)) { out.push('SCH'); i += 3; continue; }
      const two = w.substr(i, 2);
      if (['CH', 'EI', 'AU', 'EU'].includes(two)) { out.push(two); i += 2; continue; }
      out.push(w[i]); i++;
    }
    return out;
  }

  async function zahl(n) {
    if (!enabled) return;
    stop();
    const myGen = gen;
    const clip = clips.zahlen[n];
    if (clip && await playOne('audio/' + clip, myGen)) return;
    if (myGen === gen) return tts(zahlwort[n] ?? String(n));
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('sound', enabled ? 'on' : 'off');
    if (!enabled) stop();
    return enabled;
  }

  return { speak, laut, lautMitBeispiel, buchstabieren, zerlegen, zahl, stop, toggle, preloadBasics, preloadText, ready,
    get enabled() { return enabled; },
    saveRecording, deleteRecording, listRecordings, LAUT_TTS, resolve };
})();
