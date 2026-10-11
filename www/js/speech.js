/* Sprachausgabe: Laute (nicht Buchstabennamen), Zahlen, Sätze.
   Reihenfolge: 1. eigene Aufnahme (IndexedDB)  2. mitgelieferte Datei audio/laute/<key>.mp3  3. Sprachsynthese (TTS) */
const Speech = (() => {
  let enabled = localStorage.getItem('sound') !== 'off';
  let voice = null;
  let currentAudio = null;
  const missingFiles = new Set();

  // Wie ein Laut der Sprachsynthese "vorgeschrieben" wird, damit sie den Laut und nicht den Namen spricht.
  // Vokale werden lang gesprochen, Dauerlaute gedehnt. Verschlusslaute (B, D, G, K, P, T) lassen sich mit TTS
  // nur ungefähr sprechen – dafür gibt es die Aufnahmefunktion im Eltern-Bereich.
  const LAUT_TTS = {
    A: 'aa', E: 'ee', I: 'ii', O: 'oo', U: 'uu', Ä: 'ää', Ö: 'öö', Ü: 'üü',
    M: 'mmm', N: 'nnn', S: 'sss', F: 'fff', L: 'lll', R: 'rrr', W: 'wwwe', H: 'hh',
    B: 'b', D: 'd', G: 'g', K: 'k', P: 'p', T: 't',
    Z: 'ts', J: 'jjj', C: 'k', Q: 'kw', V: 'fff', X: 'ks', Y: 'üü',
    SCH: 'sch', CH: 'ch', EI: 'ei', AU: 'au', EU: 'eu',
  };

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const order = ['de-DE', 'de-CH', 'de-AT', 'de'];
    for (const l of order) {
      const v = voices.find(x => x.lang.replace('_', '-').startsWith(l) && /google|natural|premium|neural/i.test(x.name))
        || voices.find(x => x.lang.replace('_', '-').startsWith(l));
      if (v) { voice = v; return; }
    }
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // ---------- Aufnahmen (IndexedDB) ----------
  const DB = 'lernspiel-audio';
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('laute');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function getRecording(key) {
    try {
      const d = await db();
      return await new Promise((res) => {
        const q = d.transaction('laute').objectStore('laute').get(key);
        q.onsuccess = () => res(q.result || null);
        q.onerror = () => res(null);
      });
    } catch { return null; }
  }
  async function saveRecording(key, blob) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('laute', 'readwrite');
      t.objectStore('laute').put(blob, key);
      t.oncomplete = res; t.onerror = () => rej(t.error);
    });
  }
  async function deleteRecording(key) {
    const d = await db();
    return new Promise((res) => {
      const t = d.transaction('laute', 'readwrite');
      t.objectStore('laute').delete(key);
      t.oncomplete = res; t.onerror = res;
    });
  }
  async function listRecordings() {
    try {
      const d = await db();
      return await new Promise((res) => {
        const q = d.transaction('laute').objectStore('laute').getAllKeys();
        q.onsuccess = () => res(q.result || []);
        q.onerror = () => res([]);
      });
    } catch { return []; }
  }

  // ---------- Abspielen ----------
  function stop() {
    if (window.Native && Native.hasTTS) Native.stop();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  }

  function playBlobOrUrl(src) {
    return new Promise((res) => {
      const url = typeof src === 'string' ? src : URL.createObjectURL(src);
      const a = new Audio(url);
      currentAudio = a;
      a.onended = () => { if (typeof src !== 'string') URL.revokeObjectURL(url); res(true); };
      a.onerror = () => { if (typeof src !== 'string') URL.revokeObjectURL(url); res(false); };
      a.play().catch(() => res(false));
    });
  }

  function tts(text, opts = {}) {
    if (window.Native && Native.hasTTS) return Native.speak(text, opts.rate ?? 0.85, opts.pitch ?? 1.05);
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) return res(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (voice && voice.lang) || 'de-DE';
      if (voice) u.voice = voice;
      u.rate = opts.rate ?? 0.85;
      u.pitch = opts.pitch ?? 1.05;
      u.onend = () => res(true);
      u.onerror = () => res(false);
      speechSynthesis.speak(u);
    });
  }

  /** Beliebigen Satz sprechen (immer TTS). */
  async function speak(text, opts) {
    if (!enabled) return;
    stop();
    return tts(text, opts);
  }

  /** Einen Laut sprechen: 'M', 'A', 'SCH' … */
  async function laut(key) {
    if (!enabled) return;
    key = key.toUpperCase();
    stop();
    const rec = await getRecording(key);
    if (rec && await playBlobOrUrl(rec)) return;
    const fileKey = key.replace('Ä', 'AE').replace('Ö', 'OE').replace('Ü', 'UE');
    if (!missingFiles.has(fileKey)) {
      if (await playBlobOrUrl(`audio/laute/${fileKey}.mp3`)) return;
      missingFiles.add(fileKey);
    }
    return tts(LAUT_TTS[key] || key.toLowerCase(), { rate: 0.7 });
  }

  /** Laut + Beispielwort: "mmm – wie in Maus" */
  async function lautMitBeispiel(key, beispiel) {
    if (!enabled) return;
    await laut(key);
    if (beispiel) await tts(`wie in ${beispiel}`);
  }

  /** Ein Wort lautierend sprechen: M-A-U-S, dann Maus */
  async function buchstabieren(word) {
    if (!enabled) return;
    stop();
    const parts = zerlegen(word);
    for (const p of parts) {
      await laut(p);
      await new Promise(r => setTimeout(r, 120));
    }
    await new Promise(r => setTimeout(r, 250));
    await tts(word);
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
    return tts(DATA.zahlwort[n] ?? String(n));
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('sound', enabled ? 'on' : 'off');
    if (!enabled) stop();
    return enabled;
  }

  return { speak, laut, lautMitBeispiel, buchstabieren, zerlegen, zahl, stop, toggle,
    get enabled() { return enabled; },
    getRecording, saveRecording, deleteRecording, listRecordings, LAUT_TTS };
})();
