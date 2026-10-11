# Lernspiel – Rette die Einhornwelt 🦄

Lern-App für Erstklässler (Schweiz, Deutsch): **Lesen, Schreiben und Zahlen** – spielerisch, mit Sprachausgabe und einer Geschichte in 20 Kapiteln.

## Inhalt

- **Abenteuer**: 20 Kapitel. Jedes Kapitel erzählt ein Stück der Geschichte (vorgelesen) und stellt eine Aufgabenrunde. Mit mindestens 2 Sternen geht es weiter.
- **Lesen üben**: Buchstaben einzeln kennenlernen (Laut, Beispielwörter, nachspuren), dann Spiele: Anlaute, Laute hören, Gross & klein, Wörter lesen, Wort zum Bild, Wörter bauen.
- **Zahlen üben**: Zahlen 1–20 einzeln kennenlernen (zählen, Zehnerfeld, nachspuren), dann Spiele: Zählen, Zahl hören, Zehnerfeld, Zahlenreihe, Mehr/weniger, Zerlegen, Plus & Minus.
- **Schreiben**: Buchstaben und Zahlen mit dem Finger auf Schreiblinien nachspuren.
- **Einstellungen**: Schrift «nur Grossbuchstaben» oder «gross und klein»; automatisches Vorlesen an/aus.
- **Eltern**: einzelne Laute mit eigener Stimme aufnehmen (haben Vorrang vor den mitgelieferten Clips), Fortschritt zurücksetzen.

## Sprachausgabe

Alle Laute, Zahlen, Wörter, Satzbausteine und die komplette Geschichte sind als MP3 in `www/audio/` enthalten (ca. 4 MB).
Erzeugt werden sie lokal mit [Piper TTS](https://github.com/OHF-Voice/piper1-gpl) (Open Source, offline) und der deutschen Stimme `de_DE-thorsten-high`.
Die Laute werden per Phonem-Eingabe erzeugt (z. B. «mmm», «sss», «bə»), damit wirklich der Laut und nicht der Buchstabenname gesprochen wird.
Die App setzt gesprochene Sätze aus den Clips zusammen (z. B. «3 plus 4 gibt 7. Super!»); nur unbekannte Texte gehen an die Sprachsynthese des Geräts.

Audio neu erzeugen (z. B. nach Textänderungen in `story.js` oder neuen Wörtern):

```bash
python3 -m venv tools/venv && tools/venv/bin/pip install piper-tts imageio-ffmpeg
tools/venv/bin/python -m piper.download_voices de_DE-thorsten-high --data-dir tools/voices
tools/venv/bin/python tools/gen_audio.py            # nur fehlende Dateien; --force erzeugt alles neu, --only geschichte nur die Geschichte
```

Alle Daten (Sterne, Stufen, Geschichte, Aufnahmen) bleiben **nur auf dem Gerät** (kein Backend, kein Internet nötig).

## Installation auf dem Android-Tablet

1. Auf dem Tablet den Link zur aktuellen APK öffnen (siehe «Releases» → `lernspiel.apk`).
2. Download bestätigen, Datei öffnen, «Aus dieser Quelle installieren» erlauben.
3. App «Lernspiel» starten. Für die Sprachausgabe muss auf dem Tablet eine deutsche Stimme installiert sein (Einstellungen → System → Sprachen → Text-in-Sprache, z. B. «Google Speech Services» mit Deutsch).

## Entwicklung

```bash
npm install
npm start            # Web-Version lokal unter http://localhost:8765
npm run apk          # Android-APK bauen (benötigt Android SDK + JDK 21)
```

Die Web-Dateien liegen in `www/` (reines HTML/CSS/JS, ohne Build-Schritt). `android/` ist das Capacitor-Projekt.
Jeder Push auf `main` baut per GitHub Actions die APK (Release «latest») und veröffentlicht die Web-Version über GitHub Pages.

### Eigene Laut-Aufnahmen mitliefern

Statt über den Eltern-Bereich aufzunehmen, können MP3-Dateien unter `www/audio/laute/` abgelegt werden: `A.mp3`, `B.mp3`, …, `AE.mp3`, `OE.mp3`, `UE.mp3`, `SCH.mp3`, `CH.mp3`, `EI.mp3`, `AU.mp3`, `EU.mp3`.
