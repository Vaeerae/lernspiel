/* Wortschatz und Buchstaben für die 1. Klasse (Schweizer Schreibung: ss statt ß) */
const DATA = (() => {
  // Jedes Wort: Schreibung, Bild (Emoji), Anlaut, Stufe für "Wörter bauen" (1 = leicht)
  const words = [
    // A
    { w: 'Apfel', e: '🍎', s: 2 }, { w: 'Ameise', e: '🐜', s: 3 }, { w: 'Affe', e: '🐵', s: 2 }, { w: 'Ananas', e: '🍍', s: 3 },
    // B
    { w: 'Ball', e: '⚽', s: 1 }, { w: 'Banane', e: '🍌', s: 3 }, { w: 'Baum', e: '🌳', s: 1 }, { w: 'Bär', e: '🐻', s: 1 }, { w: 'Buch', e: '📖', s: 2 }, { w: 'Blume', e: '🌸', s: 2 }, { w: 'Brot', e: '🍞', s: 2 },
    // D
    { w: 'Delfin', e: '🐬', s: 3 }, { w: 'Drache', e: '🐉', s: 3 },
    // E
    { w: 'Elefant', e: '🐘', s: 3 }, { w: 'Ente', e: '🦆', s: 1 }, { w: 'Erdbeere', e: '🍓', s: 3 }, { w: 'Esel', e: '🐴', s: 1 },
    // F
    { w: 'Fisch', e: '🐟', s: 2 }, { w: 'Frosch', e: '🐸', s: 3 }, { w: 'Fuchs', e: '🦊', s: 3 }, { w: 'Feuer', e: '🔥', s: 2 }, { w: 'Fahne', e: '🚩', s: 2 },
    // G
    { w: 'Gabel', e: '🍴', s: 2 }, { w: 'Giraffe', e: '🦒', s: 3 }, { w: 'Geschenk', e: '🎁', s: 3 }, { w: 'Gitarre', e: '🎸', s: 3 },
    // H
    { w: 'Hund', e: '🐶', s: 1 }, { w: 'Haus', e: '🏠', s: 1 }, { w: 'Hase', e: '🐰', s: 1 }, { w: 'Hut', e: '🎩', s: 1 }, { w: 'Herz', e: '❤️', s: 2 }, { w: 'Hand', e: '✋', s: 1 },
    // I
    { w: 'Igel', e: '🦔', s: 1 }, { w: 'Insel', e: '🏝️', s: 2 },
    // J
    { w: 'Jacke', e: '🧥', s: 2 },
    // K
    { w: 'Katze', e: '🐱', s: 2 }, { w: 'Kuh', e: '🐮', s: 1 }, { w: 'Käse', e: '🧀', s: 2 }, { w: 'Krone', e: '👑', s: 2 }, { w: 'Kerze', e: '🕯️', s: 2 }, { w: 'Kamel', e: '🐫', s: 2 }, { w: 'Koala', e: '🐨', s: 2 },
    // L
    { w: 'Löwe', e: '🦁', s: 1 }, { w: 'Lampe', e: '💡', s: 2 }, { w: 'Leiter', e: '🪜', s: 3 },
    // M
    { w: 'Maus', e: '🐭', s: 1 }, { w: 'Mond', e: '🌙', s: 1 }, { w: 'Milch', e: '🥛', s: 2 }, { w: 'Melone', e: '🍉', s: 3 },
    // N
    { w: 'Nase', e: '👃', s: 1 }, { w: 'Nuss', e: '🥜', s: 1 }, { w: 'Nashorn', e: '🦏', s: 3 },
    // O
    { w: 'Oma', e: '👵', s: 1 }, { w: 'Opa', e: '👴', s: 1 }, { w: 'Orange', e: '🍊', s: 3 },
    // P
    { w: 'Pferd', e: '🐴', s: 2 }, { w: 'Pinguin', e: '🐧', s: 3 }, { w: 'Pizza', e: '🍕', s: 2 }, { w: 'Pilz', e: '🍄', s: 1 }, { w: 'Papagei', e: '🦜', s: 3 },
    // R
    { w: 'Rose', e: '🌹', s: 1 }, { w: 'Rakete', e: '🚀', s: 3 }, { w: 'Regen', e: '🌧️', s: 2 }, { w: 'Ring', e: '💍', s: 1 }, { w: 'Robbe', e: '🦭', s: 2 },
    // S
    { w: 'Sonne', e: '☀️', s: 2 }, { w: 'Salat', e: '🥗', s: 2 }, { w: 'Socke', e: '🧦', s: 2 }, { w: 'Saft', e: '🧃', s: 1 }, { w: 'Schaf', e: '🐑', s: 2 },
    // T
    { w: 'Tiger', e: '🐯', s: 2 }, { w: 'Tomate', e: '🍅', s: 3 }, { w: 'Tasse', e: '☕', s: 2 }, { w: 'Tür', e: '🚪', s: 1 }, { w: 'Traktor', e: '🚜', s: 3 },
    // U
    { w: 'Uhr', e: '⌚', s: 1 }, { w: 'Uhu', e: '🦉', s: 1 },
    // V
    { w: 'Vogel', e: '🐦', s: 2 }, { w: 'Velo', e: '🚲', s: 1 },
    // W
    { w: 'Wal', e: '🐳', s: 1 }, { w: 'Wolke', e: '☁️', s: 2 }, { w: 'Wurm', e: '🪱', s: 1 }, { w: 'Würfel', e: '🎲', s: 3 },
    // Z
    { w: 'Zebra', e: '🦓', s: 2 }, { w: 'Zug', e: '🚂', s: 1 }, { w: 'Zitrone', e: '🍋', s: 3 }, { w: 'Zahn', e: '🦷', s: 1 }, { w: 'Zelt', e: '⛺', s: 1 },
  ];
  words.forEach(x => { x.first = x.w[0].toUpperCase(); });

  // Anlaute, die Kinder eindeutig hören können (kein Sch/St/Sp, V klingt wie F → separat)
  const anlautLetters = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'Z'];
  // Wörter, deren Anlaut anders klingt als geschrieben → bei Anlaut-Spielen ausschliessen
  const anlautExclude = new Set(['Schaf', 'Vogel', 'Velo', 'Erdbeere', 'Pferd', 'Fuchs', 'Zitrone', 'Zebra']);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const umlaute = ['Ä', 'Ö', 'Ü'];

  // Wie der Laut dem Kind vorgesprochen wird: "M wie Maus"
  const exampleFor = {};
  for (const l of alphabet) {
    const ex = words.find(x => x.first === l && !anlautExclude.has(x.w));
    exampleFor[l] = ex ? ex.w : null;
  }
  exampleFor['C'] = 'Clown'; exampleFor['Q'] = 'Quelle'; exampleFor['X'] = 'Xylofon'; exampleFor['Y'] = 'Yak'; exampleFor['V'] = 'Vogel';

  // Zählobjekte
  const countObjects = ['🍎', '⭐', '🐟', '🌸', '🚗', '🐞', '🍓', '🎈', '🐤', '🧁', '🦋', '🍪'];

  const zahlwort = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
    'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'];

  return { words, anlautLetters, anlautExclude, alphabet, umlaute, exampleFor, countObjects, zahlwort };
})();
