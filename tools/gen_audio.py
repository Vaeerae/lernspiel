#!/usr/bin/env python3
"""Erzeugt alle Audiodateien der App mit Piper TTS (Stimme de_DE-thorsten-high).

Ausgabe nach www/audio/:
  laute/<KEY>.mp3       Einzellaute (per Phonem-Eingabe, damit Laute statt Buchstabennamen gesprochen werden)
  zahlen/<n>.mp3        Zahlwörter 0–20
  woerter/<wort>.mp3    alle Lernwörter
  saetze/<id>.mp3       feste Sätze und Satzbausteine
  geschichte/<id>.mp3   Kapitel-Texte des Abenteuers
  clips.js              Verzeichnis aller Clips (Text → Datei) für die App

Aufruf:  tools/venv/bin/python tools/gen_audio.py [--only laute|zahlen|woerter|saetze|geschichte]
"""
import io, json, os, re, subprocess, sys, wave, hashlib
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
OUT = os.path.join(WWW, 'audio')
VOICE = os.path.join(ROOT, 'tools', 'voices', 'de_DE-thorsten-high.onnx')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
FORCE = '--force' in sys.argv

voice = PiperVoice.load(VOICE)
SR = voice.config.sample_rate
CFG_TEXT = SynthesisConfig(length_scale=1.15, noise_scale=0.5, noise_w_scale=0.6)   # etwas langsamer, ruhig – für Kinder
CFG_LAUT = SynthesisConfig(length_scale=2.2, noise_scale=0.4, noise_w_scale=0.5)

# ---------- Laute als Phoneme (espeak-IPA, wie Piper sie intern nutzt) ----------
LAUTE = {
    # Dauerlaute und Vokale mit doppeltem Längenzeichen (klingen länger), Verschlusslaute mit kurzem Schwa
    'A': ['a', 'ː', 'ː'], 'E': ['e', 'ː', 'ː'], 'I': ['i', 'ː', 'ː'], 'O': ['o', 'ː', 'ː'], 'U': ['u', 'ː', 'ː'],
    'AE': ['ɛ', 'ː', 'ː'], 'OE': ['ø', 'ː', 'ː'], 'UE': ['y', 'ː', 'ː'],
    'M': ['m', 'ː', 'ː'], 'N': ['n', 'ː', 'ː'], 'S': ['s', 'ː', 'ː'], 'F': ['f', 'ː', 'ː'], 'L': ['l', 'ː', 'ː'], 'R': ['ʁ', 'ː', 'ː'],
    'W': ['v', 'ː', 'ː'], 'H': ['h', 'ə'], 'J': ['j', 'ː', 'ə'],
    'B': ['b', 'ə'], 'D': ['d', 'ə'], 'G': ['ɡ', 'ə'], 'K': ['k', 'ə'], 'P': ['p', 'ə'], 'T': ['t', 'ə'],
    'Z': ['t', 's', 'ː', 'ː'], 'C': ['k', 'ə'], 'Q': ['k', 'v', 'ə'], 'V': ['f', 'ː', 'ː'], 'X': ['k', 's', 'ː'], 'Y': ['y', 'ː', 'ː'],
    'SCH': ['ʃ', 'ː', 'ː'], 'CH': ['x', 'ː', 'ː'], 'EI': ['a', 'ɪ', 'ː'], 'AU': ['a', 'ʊ', 'ː'], 'EU': ['ɔ', 'ʏ', 'ː'],
}

ZAHLEN = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
          'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig']

# Feste Sätze und Bausteine (werden in der App per Text nachgeschlagen)
SAETZE = [
    # Lob
    'Super!', 'Toll gemacht!', 'Richtig!', 'Prima!', 'Genau!', 'Bravo!', 'Spitze!',
    'Fantastisch!', 'Gut gemacht!', 'Weiter so!', 'Du kommst in die nächste Stufe!', 'Wir üben noch einmal etwas Leichteres.',
    # Bausteine
    'wie in', 'Welches Bild beginnt mit', 'Finde den kleinen Buchstaben zu', 'Welches Wort heisst', 'Das ist die',
    'Tippe auf die', 'plus', 'minus', 'gibt', 'plus wie viel gibt', 'ist mehr als', 'und',
    # Aufforderungen
    'Wie viele sind es? Zähle und tippe auf die richtige Zahl.', 'Wie viele Punkte sind im Feld?', 'Welche Zahl fehlt?',
    'Wo sind mehr? Tippe auf die Gruppe mit mehr.', 'Wo sind weniger? Tippe auf die Gruppe mit weniger.',
    'Rette die Einhornwelt! Tippe auf das erste Kapitel.',
    'Hör gut zu.', 'Tippe auf den Buchstaben, den du hörst.',
    'Oh, das war noch nicht genug. Luna sagt: "Kein Problem, versuch es noch einmal. Ich glaube an dich!"',
    'Hallo! Was möchtest du machen?', 'Buchstaben lernen', 'Zahlen lernen', 'Abenteuer', 'Lesen üben', 'Zahlen üben', 'Schreiben',
    'Du kannst mich jederzeit antippen, dann lese ich noch einmal vor.',
]

def read(path):
    return open(os.path.join(WWW, 'js', path), encoding='utf-8').read()

def words():
    ws = set()
    for src in ('data.js', 'reading.js'):
        ws.update(re.findall(r"\bw:\s*'([^']+)'", read(src)))
    ws.update(re.findall(r"exampleFor\['\w'\]\s*=\s*'([^']+)'", read('data.js')))
    return sorted(ws)

def story():
    src = read('story.js')
    items = []
    for i, m in enumerate(re.finditer(r"intro:\s*'((?:[^'\\]|\\.)*)'.*?success:\s*'((?:[^'\\]|\\.)*)'", src, re.S)):
        intro, succ = (s.replace("\\'", "'") for s in m.groups())
        items.append((f'{i + 1:02d}-intro', intro)); items.append((f'{i + 1:02d}-erfolg', succ))
    return items

# ---------- Synthese ----------
def to_mp3(audio_f32, path):
    peak = max(float(np.abs(audio_f32).max()), 1e-6)
    audio_f32 = audio_f32 * min(0.85 / peak, 6.0)          # Lautstärke angleichen
    pcm = (np.clip(audio_f32, -1, 1) * 32767).astype(np.int16)
    # kurze Stille vorne/hinten, dann MP3 (mono, 48 kbit/s)
    pad = np.zeros(int(SR * 0.06), dtype=np.int16)
    pcm = np.concatenate([pad, pcm, pad])
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '48k', '-ac', '1', path],
                   input=buf.getvalue(), check=True)
    return len(pcm) / SR

def synth_text(text, cfg=CFG_TEXT):
    chunks = [c.audio_float_array for c in voice.synthesize(text, cfg)]
    return np.concatenate(chunks)

def synth_phonemes(phonemes, cfg=CFG_LAUT):
    ids = voice.phonemes_to_ids(phonemes)
    return voice.phoneme_ids_to_audio(ids, cfg)

def slug(text):
    s = re.sub(r'[^a-z0-9äöü]+', '-', text.lower()).strip('-')[:40]
    return s + '-' + hashlib.md5(text.encode()).hexdigest()[:6]

def want(kind):
    return ONLY is None or ONLY == kind

clips = {'laute': {}, 'zahlen': {}, 'woerter': {}, 'saetze': {}, 'geschichte': {}}
def emit(kind, key, rel, make):
    path = os.path.join(OUT, rel)
    if FORCE or not os.path.exists(path):
        dur = to_mp3(make(), path)
        print(f'{rel:50s} {dur:5.2f}s')
    clips[kind][key] = rel

if want('laute'):
    for k, ph in LAUTE.items():
        emit('laute', k, f'laute/{k}.mp3', lambda ph=ph: synth_phonemes(ph))
if want('zahlen'):
    for n, z in enumerate(ZAHLEN):
        emit('zahlen', str(n), f'zahlen/{n}.mp3', lambda z=z: synth_text(z))
if want('woerter'):
    for w in words():
        emit('woerter', w.lower(), f'woerter/{w}.mp3', lambda w=w: synth_text(w + '.'))
if want('saetze'):
    for s in SAETZE:
        emit('saetze', s, f'saetze/{slug(s)}.mp3', lambda s=s: synth_text(s))
if want('geschichte'):
    for key, text in story():
        emit('geschichte', text, f'geschichte/{key}.mp3', lambda t=text: synth_text(t))

# Verzeichnis für die App: Text/Schlüssel → Datei (nur die erzeugten Kategorien aktualisieren)
clips_path = os.path.join(OUT, 'clips.js')
old = {}
if os.path.exists(clips_path):
    old = json.loads(re.search(r'=\s*(\{.*\});?\s*$', open(clips_path, encoding='utf-8').read(), re.S).group(1))
for kind in clips:
    if not want(kind) and kind in old: clips[kind] = old[kind]
with open(clips_path, 'w', encoding='utf-8') as f:
    f.write('/* Automatisch erzeugt von tools/gen_audio.py – nicht von Hand bearbeiten */\nconst CLIPS = ')
    json.dump(clips, f, ensure_ascii=False, indent=0)
    f.write(';\n')
print('fertig:', {k: len(v) for k, v in clips.items()})
