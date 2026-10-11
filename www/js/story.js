/* Abenteuer-Modus: Die Einhornwelt retten – Kapitel für Kapitel */
const Story = (() => {
  const { el } = UI;

  // Jedes Kapitel: Szene, Einleitung (wird vorgelesen), Spiel + Stufe, Text bei Erfolg
  const CHAPTERS = [
    { scene: '🦄', title: 'Luna ruft um Hilfe', game: 'anlaut', level: 1,
      intro: 'Weit hinter den Bergen liegt das Regenbogenland. Dort leben die Einhörner. Doch der Nebeltroll Grummel hat alle Farben gestohlen! Alles ist grau. Das Einhorn Luna schaut dich mit grossen Augen an: "Bitte hilf mir! Nur wer die Zauberbuchstaben und Zauberzahlen kennt, kann die Farben zurückholen." Die ersten Buchstaben liegen verstreut auf der Wiese. Finde zu jedem Buchstaben das richtige Bild!',
      success: 'Die Buchstaben leuchten auf! Ein Hauch von Rot kommt zurück auf die Wiese. Luna wiehert vor Freude: "Du kannst das! Komm, wir gehen weiter in den Zahlenwald."' },
    { scene: '🌲', title: 'Der Zahlenwald', game: 'zaehlen', level: 1,
      intro: 'Im Zahlenwald ist es dunkel. Nur kleine Glühwürmchen leuchten zwischen den Bäumen. "Grummel hat die Zahlen durcheinandergebracht", flüstert Luna. "Zähle die Dinge genau und finde die richtige Zahl, dann finden die Glühwürmchen ihren Weg."',
      success: 'Die Glühwürmchen tanzen in einer Reihe und zeigen euch den Weg aus dem Wald. Ein Streifen Orange zieht über den Himmel!' },
    { scene: '🏔️', title: 'Das Echo im Tal', game: 'laut', level: 1,
      intro: 'Ihr kommt in ein stilles Tal. Hier wohnt das Echo. "Hör gut zu", sagt Luna. "Das Echo ruft dir einen Laut zu. Finde den passenden Buchstaben!"',
      success: 'Das Echo lacht und ruft "Dankeee!" durch das Tal. Gelbes Licht fällt auf die Felsen. Zwei Farben habt ihr schon zurück!' },
    { scene: '🌉', title: 'Die Regenbogenbrücke', game: 'reihe', level: 1,
      intro: 'Vor euch liegt die Regenbogenbrücke. Aber in der Brücke fehlen Steine! Auf jedem Stein steht eine Zahl. "Welche Zahl fehlt in der Reihe?", fragt Luna. "Wenn du es weisst, wächst der Stein nach."',
      success: 'Stein für Stein wird die Brücke wieder ganz. Ihr lauft hinüber. Unter euch glitzert der Fluss in hellem Grün.' },
    { scene: '🔑', title: 'Die Schatztruhe', game: 'grossklein', level: 1,
      intro: 'Hinter der Brücke steht eine alte Truhe mit vielen Schlössern. "Jeder grosse Buchstabe ist ein Schloss, jeder kleine Buchstabe ein Schlüssel", erklärt Luna. "Finde zu jedem grossen Buchstaben den kleinen!"',
      success: 'Klick, klick, klick! Die Truhe springt auf. Darin liegt ein Zauberstab, der blau leuchtet. Luna steckt ihn in ihre Mähne.' },
    { scene: '🌷', title: 'Der Blumengarten', game: 'vergleichen', level: 1,
      intro: 'Ihr betretet den Garten der Einhörner. Alle Blumen sind grau und hängen traurig herab. Die Gärtnerin, eine Schnecke, sagt: "Die Blumen brauchen Wasser, aber ich sehe so schlecht. Wo sind mehr Blumen? Wo sind weniger? Hilf mir zählen!"',
      success: 'Die Blumen heben die Köpfe und werden lila, rosa und rot. Die Schnecke strahlt: "Vielen Dank, kleiner Held!"' },
    { scene: '📜', title: 'Die Zaubersprüche', game: 'lesen', level: 1,
      intro: 'Im Garten findet ihr ein altes Zauberbuch. Die Zaubersprüche sind ganz einfache Wörter! "Lies das Wort und tippe auf das passende Bild", sagt Luna. "Dann wirkt der Zauber."',
      success: 'Jedes gelesene Wort lässt ein Stück Himmel blau werden. Luna hüpft vor Freude: "Du kannst schon lesen!"' },
    { scene: '⭐', title: 'Die Sternenleiter', game: 'menge', level: 1,
      intro: 'Es wird Nacht. Die Sterne sind vom Himmel gefallen und liegen in Zehnerfeldern auf dem Boden. "Wie viele Sterne liegen in jedem Feld?", fragt Luna. "Sag es schnell, ohne lange zu zählen!"',
      success: 'Die Sterne steigen zurück an den Himmel und bilden eine Leiter aus Licht. Ihr klettert hinauf zur Wolkenstadt.' },
    { scene: '💧', title: 'Der verzauberte Teich', game: 'bauen', level: 1,
      intro: 'In der Wolkenstadt gibt es einen Teich. Grummel hat alle Wörter in Buchstaben zerlegt und hineingeworfen. "Baue die Wörter wieder zusammen", sagt Luna. "Tippe die Buchstaben in der richtigen Reihenfolge an!"',
      success: 'Jedes fertige Wort springt wie ein Fisch aus dem Wasser und glitzert silbern. Der Teich wird klar und blau.' },
    { scene: '💎', title: 'Die Kristallhöhle', game: 'zerlegen', level: 1,
      intro: 'Ein Tunnel führt in eine Kristallhöhle. Die Kristalle sind zersprungen. "Immer fünf gehören zusammen", sagt Luna. "Wie viele fehlen noch bis fünf?"',
      success: 'Die Kristalle fügen sich zusammen und leuchten in allen Farben. Die Höhle funkelt wie ein Sternenhimmel.' },
    { scene: '☁️', title: 'Die Wolkenstadt', game: 'anlaut', level: 2,
      intro: 'In der Wolkenstadt wohnen die Wolkenwesen. Sie haben ihre Namen vergessen! Auf jeder Tür steht ein grosser und ein kleiner Buchstabe. "Finde das Bild, das mit diesem Buchstaben beginnt!"',
      success: 'Die Wolkenwesen erinnern sich wieder und rufen fröhlich ihre Namen. Die Wolken werden weiss und weich wie Watte.' },
    { scene: '👹', title: 'Die Brücke der Trolle', game: 'rechnen', level: 1,
      intro: 'Zwei kleine Trolle bewachen eine Brücke. "Niemand kommt vorbei, der nicht rechnen kann!", brummen sie. "Plus-Aufgaben! Wie viel gibt das zusammen?"',
      success: 'Die Trolle staunen: "So schnell hat noch nie jemand gerechnet!" Sie lassen euch durch und winken euch nach.' },
    { scene: '📚', title: 'Die Bibliothek', game: 'wortfinden', level: 2,
      intro: 'Ihr erreicht die grosse Bibliothek. Die Bilder sind aus den Büchern gefallen! "Zu jedem Bild gehört ein Wort", sagt die Bibliothekarin, eine Eule. "Finde das richtige Wort!"',
      success: 'Die Bilder flattern zurück in ihre Bücher. Die Eule schenkt dir eine Feder, die golden leuchtet.' },
    { scene: '🐉', title: 'Der schlafende Drache', game: 'zaehlen', level: 2,
      intro: 'Vor Grummels Burg schläft ein Drache. Um ihn herum liegen viele Schätze. "Zähle leise, wie viele es sind", flüstert Luna. "Wenn du dich verzählst, wacht er auf!"',
      success: 'Du hast alles richtig gezählt! Der Drache schnarcht weiter. Ihr schleicht an ihm vorbei.' },
    { scene: '🏰', title: 'Das Tor der Burg', game: 'zahlhoeren', level: 1,
      intro: 'Das Burgtor hat ein Zahlenschloss. Eine Stimme aus dem Tor sagt eine Zahl. "Hör gut zu und tippe die Zahl!", sagt Luna.',
      success: 'Knarrend öffnet sich das Tor. Ihr seid in Grummels Burg!' },
    { scene: '🧩', title: 'Der Buchstabensaal', game: 'bauen', level: 2,
      intro: 'In der Burg liegt ein grosser Saal voller Buchstaben. Hier hat Grummel die Zauberwörter versteckt – und falsche Buchstaben dazugelegt! "Baue die Wörter zusammen. Aber Achtung: Nicht jeder Buchstabe gehört dazu."',
      success: 'Die Zauberwörter leuchten. Die Wände der Burg verlieren ihr Grau und werden bunt.' },
    { scene: '🗼', title: 'Der hohe Turm', game: 'lesen', level: 2,
      intro: 'Eine Wendeltreppe führt in den Turm. Auf jeder Stufe steht ein Wort. "Lies das Wort und finde das Bild, dann darfst du eine Stufe höher."',
      success: 'Ihr seid oben! Von hier siehst du das ganze Land – und es ist schon fast wieder bunt.' },
    { scene: '⚙️', title: 'Die Nebelmaschine', game: 'rechnen', level: 2,
      intro: 'Im Turm steht Grummels Nebelmaschine. Sie hat viele Hebel mit Rechenaufgaben – plus und minus! "Löse die Aufgaben, dann stoppt die Maschine", ruft Luna.',
      success: 'Ratter, zisch, puff! Die Maschine bleibt stehen. Der graue Nebel löst sich auf.' },
    { scene: '🧌', title: 'Grummels Rätsel', game: 'bauen', level: 3,
      intro: 'Da steht Grummel, der Nebeltroll. Er sieht gar nicht böse aus, nur traurig. "Niemand spielt mit mir, weil ich nicht lesen kann", schnieft er. "Wenn du mir zeigst, wie man die langen Wörter baut, gebe ich die Farben zurück."',
      success: 'Grummel staunt und klatscht. "Jetzt verstehe ich es!" Er öffnet eine Kiste – und alle Farben fliegen hinaus ins Land.' },
    { scene: '🎉', title: 'Das grosse Fest', game: 'zerlegen', level: 2,
      intro: 'Das Regenbogenland ist wieder bunt! Die Einhörner feiern ein Fest. Für den Kuchen braucht Luna immer zehn Kerzen. "Wie viele fehlen noch bis zehn?" Eine letzte Aufgabe für den grössten Helden!',
      success: 'Alle Kerzen brennen. Luna und Grummel tanzen zusammen. Luna sagt: "Du hast die Einhornwelt gerettet! Du kannst lesen, schreiben und zählen – du bist ein echter Zauberer!" ENDE – und doch kannst du jederzeit wieder spielen.' },
  ];

  const KEY = 'lernspiel-story';
  const state = JSON.parse(localStorage.getItem(KEY) || '{"unlocked":0,"stars":{}}');
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  // Im Modus «nur Grossbuchstaben» wird «Gross & klein» durch «Laute hören» ersetzt
  const gameById = (id) => [...Reading.games, ...Numbers.games].find(g => g.id === (id === 'grossklein' && UI.settings.caps ? 'laut' : id));

  // ---------- Karte ----------
  function map(onBack) {
    const root = UI.screen();
    root.innerHTML = '';
    const done = Object.keys(state.stars).length;
    const head = el('div', { class: 'menu-head' }, el('h1', {}, '🦄 Rette die Einhornwelt'),
      el('p', {}, done === 0 ? 'Luna braucht deine Hilfe. Tippe auf das erste Kapitel!' : `${done} von ${CHAPTERS.length} Kapiteln geschafft. Weiter so!`));
    const grid = el('div', { class: 'menu', style: 'grid-template-columns:repeat(auto-fit,minmax(170px,1fr))' });
    CHAPTERS.forEach((c, i) => {
      const locked = i > state.unlocked;
      const stars = state.stars[i];
      const t = el('button', { class: 'tile' + (locked ? ' locked' : ''), style: locked ? 'opacity:.45;filter:grayscale(1)' : (i === state.unlocked ? 'outline:5px solid var(--primary)' : '') },
        el('div', { class: 'emoji' }, locked ? '🔒' : c.scene),
        el('div', { style: 'font-size:18px' }, `${i + 1}. ${c.title}`),
        stars ? el('div', { class: 'badge' }, '⭐'.repeat(stars)) : null);
      t.onclick = () => { if (!locked) intro(i, onBack); };
      grid.append(t);
    });
    root.append(head, grid);
    if (done === 0) setTimeout(() => Speech.speak('Rette die Einhornwelt! Tippe auf das erste Kapitel.'), 300);
  }

  // ---------- Kapitel-Einleitung ----------
  function intro(i, onBack) {
    const c = CHAPTERS[i];
    const root = UI.screen();
    root.innerHTML = '';
    const box = el('div', { class: 'result', style: 'max-width:820px' },
      el('div', { style: 'font-size:120px;line-height:1.1' }, c.scene),
      el('h2', {}, `Kapitel ${i + 1}: ${c.title}`),
      el('p', { style: 'font-size:24px;line-height:1.45;color:var(--text);text-align:left' }, c.intro),
      el('div', { class: 'toolbar' },
        el('button', { class: 'btn big secondary', onclick: () => Speech.speak(c.intro) }, '🔊 Vorlesen'),
        el('button', { class: 'btn big', onclick: () => play(i, onBack) }, '▶ Los geht\'s!'),
        el('button', { class: 'btn secondary', onclick: () => map(onBack) }, '🗺️ Karte')));
    root.append(box);
    Speech.preloadText(c.intro); Speech.preloadText(c.success);
    if (UI.settings.autoRead) setTimeout(() => Speech.speak(c.intro), 200);
  }

  // ---------- Aufgabenrunde ----------
  function play(i, onBack) {
    const c = CHAPTERS[i];
    const game = gameById(c.game);
    Speech.stop();
    UI.runRound(game, () => map(onBack), {
      fixedLevel: c.level,
      onResult(stars) {
        const root = UI.screen();
        if (stars >= 2) {
          state.stars[i] = Math.max(state.stars[i] || 0, stars);
          if (i === state.unlocked && i < CHAPTERS.length - 1) state.unlocked = i + 1;
          save();
          UI.soundWin(); UI.confetti();
          const last = i === CHAPTERS.length - 1;
          root.append(el('div', { class: 'result', style: 'max-width:820px' },
            el('div', { class: 'big-stars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
            el('div', { style: 'font-size:100px;line-height:1.1' }, c.scene),
            el('p', { style: 'font-size:24px;line-height:1.45;color:var(--text);text-align:left' }, c.success),
            el('div', { class: 'toolbar' },
              el('button', { class: 'btn big secondary', onclick: () => Speech.speak(c.success) }, '🔊 Vorlesen'),
              last ? el('button', { class: 'btn big', onclick: () => map(onBack) }, '🏆 Zur Karte')
                : el('button', { class: 'btn big', onclick: () => intro(i + 1, onBack) }, '▶ Weiter'))));
          if (CHAPTERS[i + 1]) Speech.preloadText(CHAPTERS[i + 1].intro);
          if (UI.settings.autoRead) setTimeout(() => Speech.speak(c.success), 500);
        } else {
          const txt = 'Oh, das war noch nicht genug. Luna sagt: "Kein Problem, versuch es noch einmal. Ich glaube an dich!"';
          root.append(el('div', { class: 'result', style: 'max-width:820px' },
            el('div', { style: 'font-size:100px;line-height:1.1' }, '🦄'),
            el('p', { style: 'font-size:24px;line-height:1.45;color:var(--text)' }, txt),
            el('div', { class: 'toolbar' },
              el('button', { class: 'btn big', onclick: () => play(i, onBack) }, '🔁 Noch einmal'),
              el('button', { class: 'btn big secondary', onclick: () => Reading.LEARN_ORDER && (game.id === 'anlaut' || game.id === 'laut' || game.id === 'grossklein' || game.id === 'bauen' || game.id === 'lesen' || game.id === 'wortfinden') ? Reading.learn(() => intro(i, onBack)) : Numbers.learn(() => intro(i, onBack)) }, '📚 Zuerst üben'),
              el('button', { class: 'btn secondary', onclick: () => map(onBack) }, '🗺️ Karte'))));
          if (UI.settings.autoRead) setTimeout(() => Speech.speak(txt), 300);
        }
      },
    });
  }

  return { map, CHAPTERS, state };
})();
