/* Brücke zur Android-App (Capacitor): native Sprachausgabe statt Browser-TTS,
   da Android-WebViews speechSynthesis nicht unterstützen. Im Browser ohne Wirkung. */
const Native = (() => {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  let TTS = null;
  if (isNative) {
    try { TTS = cap.registerPlugin ? cap.registerPlugin('TextToSpeech') : (cap.Plugins && cap.Plugins.TextToSpeech); } catch { TTS = null; }
  }
  async function speak(text, rate = 0.85, pitch = 1.05) {
    if (!TTS) return false;
    try { await TTS.speak({ text, lang: 'de-DE', rate, pitch, volume: 1.0, category: 'ambient' }); return true; }
    catch { return false; }
  }
  async function stop() { if (TTS) { try { await TTS.stop(); } catch { /* ignorieren */ } } }
  return { isNative, hasTTS: !!TTS, speak, stop };
})();
