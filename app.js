const main = document.querySelector('main');
const timeline = document.querySelector('#timeline');
const storageKey = 'tschechische-geschichte-fortschritt-v1';
let saved = {};
try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  if (stored && typeof stored === 'object') saved = stored;
} catch {
  // The course also works when browser storage is unavailable.
}

function element(tag, value, className) {
  const item = document.createElement(tag);
  if (value) item.textContent = value;
  if (className) item.className = className;
  return item;
}

function link(label, href, external = false) {
  const anchor = element('a', label);
  anchor.href = href;
  if (external) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  return anchor;
}

function updateProgress(current) {
  const count = chapters.filter(chapter => saved[chapter.id] === true).length;
  const progress = document.querySelector('#progress');
  progress.value = count;
  progress.max = chapters.length;
  document.querySelector('#progress-label').textContent = count + ' von ' + chapters.length + ' Kapiteln abgeschlossen';
  timeline.replaceChildren(...chapters.map(chapter => {
    const anchor = link('', '#' + chapter.id);
    const preview = element('img');
    preview.src = chapterVisuals[chapter.id][0];
    preview.alt = '';
    preview.loading = 'lazy';
    const label = element('span', '', 'chapter-label');
    label.append(element('span', chapter.era, 'date'), element('span', chapter.title));
    anchor.append(preview, label);
    if (saved[chapter.id] === true) anchor.append(element('small', '✓ Abgeschlossen'));
    if (chapter.id === current.id) anchor.setAttribute('aria-current', 'location');
    return anchor;
  }));
}

function addCompletionButton(chapter) {
  const button = element('button', '', 'completion');
  button.type = 'button';
  const refresh = () => {
    const completed = saved[chapter.id] === true;
    button.textContent = completed ? '✓ Kapitel abgeschlossen' : 'Kapitel abschliessen';
    button.setAttribute('aria-pressed', String(completed));
  };
  button.addEventListener('click', () => {
    saved[chapter.id] = saved[chapter.id] !== true;
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
    refresh();
    updateProgress(chapter);
  });
  refresh();
  main.querySelector('.next').before(button);
}

function sourceImage([file, directory, caption, credit]) {
  const source = commons + encodeURIComponent(file.replaceAll(' ', '_'));
  const figure = element('figure');
  const picture = element('img');
  picture.src = 'https://upload.wikimedia.org/wikipedia/commons/' + directory + '/' + encodeURIComponent(file.replaceAll(' ', '_'));
  picture.alt = caption;
  picture.loading = 'lazy';
  picture.addEventListener('error', () => picture.remove());
  const description = element('figcaption', caption + ' · ' + credit + ' · ');
  description.append(link('Original und Rechte', source, true));
  figure.append(picture, description);
  return figure;
}

function modelAnswer(model) {
  const reveal = element('details');
  reveal.append(element('summary', 'Musterlösung anzeigen'), element('p', model));
  return reveal;
}

// Each entry gives the text section for each medium, in chapter.media order.
const sourceSections = {
  republik: [2,6,4,1,7],
  muenchen: [2,4],
  besatzung: [1,0,2],
  umbruch: [1,0,3],
  diktatur: [1],
  fruehling: [2,0,3],
  charta: [0],
  revolution: [0],
  europa: [2,1,1,2],
  gegenwart: [0,1,1,3,3,3]
};

const imageSections = {berg: 2, republik: 2, fruehling: 1, revolution: 0};
const reflectionSections = {berg: 2, republik: 2, muenchen: 2, besatzung: 1, diktatur: 1, fruehling: 1, revolution: 2, europa: 1, gegenwart: 2};

function appendSectionSources(section, chapter, index) {
  const exercises = mediaTasks[chapter.id] || [];
  if (imageSections[chapter.id] === index) {
    const figure = sourceImage(chapter.image);
    section.append(figure);
    const exercise = exercises.find(([source]) => source === 'image');
    if (exercise) section.append(sourceActivity('Bild lesen', null, exercise));
  }
  chapter.media?.forEach(([kind, title, url], source) => {
    if (sourceSections[chapter.id][source] !== index) return;
    const exercise = exercises.find(([entry]) => entry === source);
    section.append(sourceActivity(kind, link(title + ' ↗', url, true), exercise));
  });
  if (reflectionSections[chapter.id] === index) {
    const [prompt, model] = chapter.task;
    section.append(sourceActivity('Weiterdenken', null, [null, prompt, model]));
  }
}

function appendCulturalSources(section, chapterId, index) {
  const photo = culturalImages[chapterId]?.[index];
  if (photo) {
    const [file, caption, url, credit, license, context] = photo;
    const figure = element('figure');
    const picture = element('img');
    picture.src = 'bilder/' + file;
    picture.alt = caption;
    picture.loading = 'lazy';
    const description = element('figcaption', caption + ' ');
    description.append(link(credit, url, true));
    if (license) description.append(' · ', link('Lizenz', license, true), ' · verkleinert');
    figure.append(picture, description);
    if ('bilder/' + file !== chapterVisuals[chapterId][0]) section.append(figure);
    section.append(element('p', context));
  }
  for (const parts of culturalSources[chapterId]?.[index] || []) {
    const paragraph = element('p');
    for (let part = 0; part < parts.length; part += 3) {
      paragraph.append(parts[part]);
      if (parts[part + 1]) paragraph.append(link(parts[part + 1], parts[part + 2], true));
    }
    section.append(paragraph);
  }
  if (chapterId === 'besatzung' && index === 3) {
    appendAnthropoidMedia(section);
    const exercise = mediaTasks.besatzung.find(([source]) => source === 'lidice');
    section.append(sourceActivity('Widerstand und Besatzungsterror', null, exercise));
  }
  if (chapterId === 'diktatur' && index === 1) {
    section.append(element('h4', 'Lenka Reinerová – aus einem Namen wird eine Nummer'));
    section.append(element('p', 'Die deutschsprachige Prager Schriftstellerin Lenka Reinerová war Jüdin, hatte vor den Nationalsozialisten fliehen müssen und war überzeugte Kommunistin. 1952 wurde sie selbst Opfer der stalinistischen Verfolgung. Ihre fünfzehnmonatige Haft 1952/53 wird in den biografischen Quellen dem Prager Gefängnis Ruzyně zugeordnet. Im Deutschlandfunk erinnerte sie sich an den Verlust ihres Namens im Gefängnis:'));
    const quote = element('blockquote', '«Ich habe nie meinen Namen gehört, nie. Ich war 2814.»');
    section.append(quote, link('Lenka Reinerová im Deutschlandfunk, 20. Oktober 2003 · Bericht zu «Alle Farben der Sonne und der Nacht» ↗', 'https://www.deutschlandfunk.de/lenka-reinerova-alle-farben-der-sonne-und-der-nacht-100.html', true));
    section.append(element('p', 'Höre Reinerová im längeren WDR-Gespräch «Erlebte Geschichten» von Georg Beck vom 20. Februar 2005. Ihre Haft wird hier in ihre Lebensgeschichte eingeordnet. Der Player gibt das frei zugängliche WDR-Original wieder.'));
    const prisonAudio = element('audio');
    prisonAudio.controls = true;
    prisonAudio.preload = 'none';
    prisonAudio.src = 'https://wdrmedien-a.akamaihd.net/medp/ondemand/weltweit/fsk0/19/192711/192711_1898974.mp3';
    prisonAudio.setAttribute('aria-label', 'Lenka Reinerová – Erlebte Geschichten, WDR 5');
    prisonAudio.style.width = '100%';
    prisonAudio.addEventListener('play', () => {
      soundtrack.pause();
      closeMarta();
    });
    section.append(prisonAudio, link('Hörprobe beim WDR öffnen ↗', 'https://www1.wdr.de/radio/wdr5/sendungen/erlebtegeschichten/reinerovalenka102.html', true));
    for (const [range, start, question, answer] of [
      ['00:00–00:43', 0, 'Wie werden Nummer und Melderegel im Haftalltag eingesetzt? Was kritisiert Reinerová mit ihrer ironischen Bemerkung am Schluss des Ausschnitts?', 'Sie wird durch eine Nummer bezeichnet und muss bei jedem Öffnen der Zellentür förmlich Meldung machen, auch bei der Essensausgabe. Die Ironie am Schluss verweist darauf, dass sie die verschlossene Zelle ohnehin nicht verlassen konnte. Die Routine zwingt sie trotzdem zur wiederholten Unterordnung.'],
      ['00:43–02:18', 43, 'Rekonstruiere den Weg von der Entlassung aus dem Rundfunk bis zur Abholung. Welche Einzelheiten zeigen, wie wenig sie die Gefahr auf sich selbst bezieht?', 'Nach der fristlosen Entlassung sucht sie eine neue Stelle und beteiligt sich an Gartenarbeiten. Nach ihrer Heimkehr holen zwei Männer sie ab. Selbst zum Händewaschen bleibt keine Zeit. Ihre Schilderung betont, dass sie den politischen Zusammenhang damals nicht erkannte.'],
      ['02:18–03:36', 138, 'Warum bittet sie um einen Anruf zu Hause? Wie reagiert der Verhörende? Erkläre, was diese Episode über ihre damaligen Erwartungen und ihre spätere Selbstbeurteilung zeigt.', 'Sie will ihre Familie informieren, weil sie gewöhnlich über Nacht nach Hause kommt. Der überraschte Verhörende erlaubt den Anruf. Rückblickend beschreibt sie ihre damalige Ahnungslosigkeit. Sie erwartete weiterhin eine alltägliche Erklärung für eine Situation, deren Bedrohlichkeit sie noch nicht erfasste.'],
      ['04:18–06:17', 258, 'Wie verbindet sie Orientierungslosigkeit, Häftlingskleidung und Waschen in der Zelle? Welche frühere Hafterfahrung zieht sie zum Vergleich heran?', 'Beim Transport werden ihr die Augen verbunden. Sie berichtet, das Gefängnis erst viel später im Fernsehen gesehen zu haben. Häftlingskleidung empfindet sie als Vorverurteilung und vergleicht sie mit der Zivilkleidung in französischer Untersuchungshaft. In der Zelle muss sie beim Waschen an einem Rohr über dem Abtritt balancieren.']
    ]) {
      const activity = sourceActivity('WDR-Hörprobe', null, [null, question, answer, range]);
      const jump = element('button', 'Hörstelle ' + range + ' starten');
      jump.type = 'button';
      jump.addEventListener('click', async () => {
        soundtrack.pause();
        closeMarta();
        prisonAudio.currentTime = start;
        try { await prisonAudio.play(); } catch { prisonAudio.focus(); }
      });
      activity.prepend(jump);
      section.append(activity);
    }

    section.append(element('h4', 'Festnahme, Zelle und Verhör – längere Lesepassage'));
    section.append(element('p', 'Lies im verlinkten Deutschlandfunk-Beitrag die Abschnitte von ihrer Festnahme bis zum Verhör über ihre jüdische Herkunft. Der Text enthält längere Äusserungen Reinerovás und Auszüge aus ihrem Haftbericht. Die folgenden Aufgaben nennen jeweils den Anfang der passenden Passage.'));
    section.append(link('Lesepassage frei beim Deutschlandfunk öffnen ↗', 'https://www.deutschlandfunk.de/lenka-reinerova-alle-farben-der-sonne-und-der-nacht-100.html', true));
    for (const [heading, question, answer] of [
      ['Festnahme · Passage ab «Ich weiß bis heute»', 'Welche Einzelheiten machen die Festnahme als Einbruch in ihren Alltag erfahrbar? Erläutere auch die Wirkung der Ich-Perspektive.', 'Die Erinnerung verbindet den überraschenden Zugriff mit alltäglichen Verrichtungen. Die Ich-Perspektive vermittelt ihre damalige Orientierungslosigkeit und die spätere Rückschau.'],
      ['Zelle · Passage ab «Was Nummer 2814»', 'Wie werden Licht, Zellenausstattung und Augenbinde zu Mitteln der Kontrolle? Unterscheide Reinerovás Äusserungen von der Rahmenerzählung des Journalisten.', 'Körperliche Bedürfnisse und Orientierung werden kontrolliert. Der Journalist beschreibt die Haftumgebung und ordnet die eingefügten Erinnerungen ein. Reinerová berichtet konkrete Erfahrungen.'],
      ['Verhör · Passage ab «Wahrscheinlich war es so»', 'Was vermutet Reinerová über den Arbeitsauftrag des Verhörenden? Welche Formulierung zeigt, wie sicher sie das rückblickend weiss?', 'Sie vermutet ein vorgegebenes Verhörziel. Ihre einleitende Einschränkung kennzeichnet diese Erklärung als rückblickende Deutung.'],
      ['Antisemitismus · Passage ab «Seit wann sind Sie Zionistin?»', 'Wie wird aus ihrer Herkunft ein Vorwurf gemacht? Verbinde die Passage mit dem Slánský-Prozess und erläutere, warum ihre eigene politische Überzeugung sie nicht schützte.', 'Jüdische Herkunft wird pauschal politisch verdächtigt. Kommunistische Überzeugung bietet keinen Schutz vor diesem antisemitischen Feindbild. Im Kapitel zum Slánský-Prozess begegnet dieselbe Logik.']
    ]) {
      section.append(sourceActivity(heading, null, [null, question, answer]));
    }
  }
  if (chapterId === 'revolution' && index === 2) appendHavelFilm(section);
  if (chapterId === 'umbruch' && index === 1) {
    section.append(element('h4', 'Wie die Vertreibung in der Gegenwart erinnert wird'));
    section.append(element('p', 'Jaroslav Rudiš und Jaromír 99 greifen in «Alois Nebel» die Gewaltgeschichte des Grenzlands auf. Die Handlung am Ende der 1980er-Jahre verbindet den Alltag eines Eisenbahners mit belastenden Erinnerungen. Die Comicbilder geben der Erfahrung von Angst und Verunsicherung eine eigene Form.'));
    section.append(link('Zu den Comic-Auszügen und Aufgaben in der Rudiš-Station →', '#gegenwart/5'));
    section.append(sourceActivity('Vergleich · historische Darstellung und Graphic Novel', null, [null,
      'Vergleiche diesen Abschnitt über die Vertreibung mit den Comicseiten 39 und 94 in der Rudiš-Station. Welche Fragen beantwortet der historische Text? Wie gestalten die Bilder aufgeschreckten Gesichtsausdruck, Licht, Schatten und räumliche Distanz? Erkläre, was die literarische Darstellung zur Erinnerung beitragen kann und welche Tatsachen über die Vertreibung sich aus diesen beiden Seiten allein nicht erschliessen lassen.',
      'Der historische Text erklärt die Gewalt von 1945, die organisierten Transporte von 1946 und Eingriffe in Staatsbürgerschaft und Eigentum. Die Comicseiten konzentrieren sich auf Wahrnehmung und Atmosphäre. Seite 39 zeigt ein angespanntes Gesicht und Kabel, Seite 94 eine sich im Flur entfernende Figur. So kann die Graphic Novel Angst und Entfremdung erfahrbar machen. Diese Seiten zeigen jedoch keine unmittelbar erkennbare Vertreibungsszene. Opferzahlen, politische Entscheidungen und individuelle Verantwortung müssen anhand historischer Quellen geprüft werden.'
    ]));
  }
  if (chapterId === 'gegenwart' && index === 4) appendRudisSources(section);
}

function appendRudisSources(section) {
  section.append(element('p', 'Die Erinnerung an Krieg und Vertreibung verbindet diese Graphic Novel mit dem Nachkriegskapitel.'));
  section.append(link('Zur Station «Flucht und Vertreibung» mit Vergleichsaufgabe →', '#umbruch/2'));

  section.append(element('h4', 'Kafka Band – Literatur wird Musik'));
  section.append(element('p', 'Rudiš verbindet in der Kafka Band literarische Texte mit Musik. Das Projekt arbeitet mehrsprachig und greift Kafkas Romane auf. Die offizielle Bandseite verweist auf diese Aufnahme zu «Der Process».'));
  const music = element('iframe', '', 'film-player');
  music.src = 'https://www.youtube-nocookie.com/embed/TCBJ4-QIkdc';
  music.title = 'Kafka Band – Der Process, von der offiziellen Bandseite verlinkte Aufnahme';
  music.loading = 'lazy';
  music.allow = 'fullscreen; picture-in-picture';
  section.append(music, link('Kafka Band · offizielle Seite und weitere Aufnahmen ↗', 'https://kafkaband.eu/', true));
  section.append(element('p', 'Die Zeitmarken beziehen sich auf das 1:50 Minuten lange Promo-Livevideo «Der Process» des offiziellen Kafka-Band-Kanals. Werbung zählt nicht zur Filmzeit.'));
  for (const [range, start, title, question, model] of [
    ['00:15–00:30', 15, 'Instrumente und Kameraführung', 'Welche Instrumente rückt die Kamera nacheinander ins Bild? Beschreibe, wie Nahaufnahmen und Bühnenlicht die Musik als körperliche Arbeit sichtbar machen.', 'Um 00:15 sieht man einen Bogen an Saiten, um 00:20 das Schlagzeug und um 00:30 eine Trompete. Die Nahaufnahmen zeigen Hände, Instrumententeile und Spielbewegungen. Die dunkle Umgebung und die Lichtakzente konzentrieren den Blick auf das Musizieren.'],
    ['00:32–01:14', 32, 'Der Türhüter – Macht durch Sprache', 'Welche Bitte wird im deutschen Vortrag zurückgewiesen? Erkläre, wie sich die Möglichkeit eines späteren Zugangs und das gegenwärtige Verbot zueinander verhalten. Wie verstärkt die wiederholte Zurückweisung die Machtposition des Türhüters?', 'Es geht um den erbetenen Eintritt in das Gesetz. Der Türhüter hält die Möglichkeit eines späteren Zugangs offen, verweigert ihn aber jetzt. So bleibt die bittende Person von seiner Entscheidung abhängig. Die wiederkehrende Ablehnung und der Hinweis auf seine Macht verdichten das Verhältnis von Hoffnung, Verbot und Unterordnung.']
  ]) {
    section.append(sourceActivity(title, link('Ausschnitt ab ' + range.split('–')[0] + ' auf YouTube öffnen ↗', 'https://www.youtube.com/watch?v=TCBJ4-QIkdc&t=' + start + 's', true), [null, question, model, range]));
  }
  section.append(element('h4', 'Alois Nebel – Geschichte in Schwarz und Weiss'));
  section.append(element('p', 'Rudiš schreibt die Texte, Jaromír 99 zeichnet. Im Mittelpunkt steht ein Eisenbahner im tschechisch-polnischen Grenzland. Die Trilogie verbindet seinen Alltag am Ende der 1980er-Jahre mit Erinnerungen an Krieg und Vertreibung. Die offizielle Buchseite bietet einzelne Comicseiten. Die zusätzliche zehnseitige Verlagsleseprobe stammt aus «Alois Nebel – Leben nach Fahrplan».'));
  const gallery = element('div', '', 'evidence-images');
  for (const [file, page] of [[39,39],[96,94]]) {
    const figure = element('figure');
    const imageLink = link('', 'https://www.aloisnebel.de/img/' + file + '.jpg', true);
    const image = element('img');
    image.src = imageLink.href;
    image.alt = 'Alois Nebel, deutsche Comicseite ' + page + ' aus der offiziellen Leseauswahl';
    image.loading = 'lazy';
    imageLink.append(image);
    figure.append(imageLink, element('figcaption', 'Comicseite ' + page + ' · Jaroslav Rudiš / Jaromír 99 · Übersetzung Eva Profousová · Voland & Quist. Zum Vergrössern öffnen.'));
    gallery.append(figure);
  }
  section.append(gallery, link('Offizielle Buchseite mit weiteren Comic-Auszügen ↗', 'https://www.aloisnebel.de/', true));
  const preview = element('iframe');
  preview.src = 'https://www.voland-quist.de/wp-content/uploads/2021/02/Leseprobe-Alios-Nebel.pdf#page=4';
  preview.title = 'Zehnseitige deutsche Verlagsleseprobe aus Alois Nebel – Leben nach Fahrplan';
  preview.loading = 'lazy';
  preview.style.width = '100%';
  preview.style.height = '34rem';
  section.append(preview, link('Deutsche PDF-Leseprobe frei öffnen ↗', 'https://www.voland-quist.de/wp-content/uploads/2021/02/Leseprobe-Alios-Nebel.pdf', true));
  for (const [title, source, question, model] of [
    ['Trilogie · gedruckte Seite 39 · ganzseitiges Einzelbild', 'https://www.aloisnebel.de/img/39.jpg', 'Beschreibe Gesicht, Kabel und Hell-Dunkel-Kontrast. Welche Empfindung erzeugt das Bild? Welche Aussage über den konkreten Ablauf einer Behandlung wäre ohne die Nachbarseiten zu weitgehend?', 'Die Augen sind weit geöffnet, Kabel führen am Kopf entlang, eine gezackte helle Fläche hebt sich vom schwarzen Grund ab. Das kann Angst und körperliche Bedrohung ausdrücken. Welche Behandlung genau stattfindet, durch wen und mit welchem Ergebnis, lässt sich aus dem Einzelbild allein nicht zuverlässig rekonstruieren.'],
    ['Trilogie · gedruckte Seite 94 · drei übereinanderliegende Panels', 'https://www.aloisnebel.de/img/96.jpg', 'Verfolge die Figur durch die drei Bilder. Wie verändern sich ihre Grösse, ihr Schatten und der Blick in den Flur? Welche Wirkung hat die stumme Bildfolge?', 'Anfangs füllt die dunkle Figur einen grossen Teil des Vordergrunds. Danach wird sie kleiner und entfernt sich zur Tür am Flurende. Der Fluchtpunkt und die Linien des Bodens betonen die Tiefe. Der dunkle Schatten bleibt auffällig. Ohne Text entsteht eine langsame, distanzierende Bewegung, die sich als Einsamkeit oder Beklemmung deuten lässt.'],
    ['Leben nach Fahrplan · PDF-Seite 4 von 10 · gedruckte Seite 8 · «Werbung als Waffe»', 'https://www.voland-quist.de/wp-content/uploads/2021/02/Leseprobe-Alios-Nebel.pdf#page=4', 'Wie führt das Gespräch über Geld für die Bahn zu Nebels Erinnerung an einen Werbedreh? Erkläre die Pointe am Ende. Welche Möglichkeiten schreibt er Werbung zu?', 'Die Bahn sucht zusätzliche Einnahmen und lässt einen Film im Bahnhof drehen. Nebel erinnert sich an einen früheren Werbeauftritt. Am Schluss wird der Gedanke, Werbung könne einen Bahner sogar zum Präsidenten machen oder umgekehrt, zur Pointe. Werbung erscheint als Mittel, Rollen und öffentliche Bilder zu verändern.'],
    ['Leben nach Fahrplan · PDF-Seiten 2–3 von 10 · Figurenporträts', 'https://www.voland-quist.de/wp-content/uploads/2021/02/Leseprobe-Alios-Nebel.pdf#page=2', 'Vergleiche die Porträts des Pfarrers auf PDF-Seite 2 und Květas auf PDF-Seite 3. Wie verbinden ihre Biografien Religion, Arbeit und Nachbarländer?', 'Der Pfarrer ist ein polnischer katholischer Geistlicher und sucht einen deutschen Kirchenchor. Květa stammt aus Prag und arbeitete am Hauptbahnhof als Toilettenfrau. Ihr werden Vermittlungen zwischen Tschechen, Deutschen und Polen zugeschrieben. Die humorvollen Porträts verbinden grenzüberschreitende Kontakte mit alltäglichen Lebensläufen.']
  ]) {
    section.append(sourceActivity(title, link('Zugehörigen Auszug öffnen ↗', source, true), [null, question, model]));
  }
}

function appendAnthropoidMedia(section) {
  const gallery = element('div', '', 'evidence-images');
  for (const [file, caption, page, credit] of [
    ['heydrich-wagen.jpg', 'Heydrichs beschädigter Mercedes nach dem Attentat in Prag, 1942. Die Aufnahme zeigt die Folgen des Angriffs.', 'Bundesarchiv_Bild_146-1972-039-44,_Heydrich-Attentat.jpg', 'Bundesarchiv, Bild 146-1972-039-44 · CC BY-SA 3.0 DE'],
    ['lidice-1942.jpg', 'Lidice nach der Zerstörung im Juni 1942. Von den Häusern stehen Ruinen.', 'Bundesarchiv_Bild_146-1993-020-26A,_Lidice,_Ort_nach_Zerstörung.jpg', 'Bundesarchiv, Bild 146-1993-020-26A · unbekannte Urheberschaft · gemeinfrei']
  ]) {
    const figure = element('figure');
    const image = element('img');
    image.src = 'bilder/' + file;
    image.alt = caption;
    image.loading = 'lazy';
    const description = element('figcaption', caption + ' ');
    description.append(link(credit, 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(page), true));
    figure.append(image, description);
    gallery.append(figure);
  }
  section.append(gallery);
  section.append(element('h4', 'Das Attentat erklären'));
  section.append(element('p', 'Der deutschsprachige Kalenderblatt-Beitrag «27.5.1942: Auf Reinhard Heydrich wird ein Attentat verübt» erläutert den Anschlag. Die YouTube-Veröffentlichung trägt die Kennzeichnung SWR und stammt vom Kanal Kalenderblatt. Laufzeit 3:26 Minuten.'));
  const attack = element('iframe', '', 'film-player');
  attack.src = 'https://www.youtube-nocookie.com/embed/iUtNlkNn9-U';
  attack.title = 'Deutschsprachiger Kurzbeitrag zum Attentat auf Heydrich';
  attack.loading = 'lazy';
  attack.allow = 'fullscreen; picture-in-picture';
  section.append(attack, link('Beitrag auf YouTube öffnen ↗', 'https://www.youtube.com/watch?v=iUtNlkNn9-U', true));
  section.append(sourceActivity('Attentat rekonstruieren · Höranalyse', link('Gesamten Beitrag ab 00:00 öffnen ↗', 'https://www.youtube.com/watch?v=iUtNlkNn9-U&t=0s', true), [null,
    'Höre 00:00–03:26. Rekonstruiere den Anschlag in vier Schritten. Erkläre, warum Heydrichs Tagesablauf und die Strassenführung für den Plan wichtig waren, was beim ersten Angriff scheiterte und wie Heydrich dennoch verletzt wurde. Unterscheide anschliessend die nachgespielte Todesmeldung aus Fritz Langs Film von der historischen Chronologie. Wer trägt die Verantwortung für den anschliessenden Terror gegen Zivilisten?',
    'Der Kommentar führt Heydrichs berechenbaren Tagesablauf als Voraussetzung der Planung ein. An der Haarnadelkurve warten die Angreifer auf seinen offenen Wagen. Gabčík versucht zu schiessen, doch seine Maschinenpistole hat eine Ladehemmung. Kubiš wirft daraufhin eine Granate. Sie explodiert am Wagen und verletzt Heydrich durch Splitter. Der Beitrag spielt danach eine Meldung von dessen Tod ein und benennt sie als Ausschnitt aus Fritz Langs Spielfilm «Auch Henker sterben». Historisch starb Heydrich erst am 4. Juni 1942. Die Verantwortung für die folgenden Massenmorde lag bei den deutschen NS-Machthabern und den ausführenden Tätern. Quellenkritik: Der Beitrag bezeichnet Gabčík ungenau als Tschechen und datiert die Besetzung auf 1938. Gabčík war Slowake. Die Besetzung der verbliebenen böhmischen Länder erfolgte im März 1939.',
    '00:00–03:26 · vollständiger Kurzbeitrag'
  ]));
  section.append(link('Offizielle SWR-Sendeseite mit Manuskript zum Abgleich ↗', 'https://www.swr.de/swrkultur/wissen/2751942-auf-reinhard-heydrich-wird-ein-attentat-veruebt-100.html', true));
  section.append(element('h4', 'Lidice in historischen Filmaufnahmen'));
  section.append(element('p', 'Der einminütige Archivfilm «Destruction of Lidice» zeigt die Zerstörung des Dorfes. Die deutschen Untertitel sind ergänzende historische Erläuterungen dieser Lernstation. Sie ordnen die Bilder anhand des USHMM-Dossiers ein.'));
  const video = element('video', '', 'film-player');
  video.controls = true;
  video.preload = 'none';
  video.playsInline = true;
  video.poster = 'bilder/lidice-1942.jpg';
  video.src = 'https://encyclopedia.ushmm.org/asset/c39694ea-6446-430e-910b-3d8fd4a90e75.mp4';
  const captions = element('track');
  captions.kind = 'subtitles';
  captions.label = 'Deutsche historische Erläuterungen';
  captions.srclang = 'de';
  captions.src = 'untertitel/lidice-de.vtt';
  captions.default = true;
  video.append(captions);
  video.addEventListener('play', () => {
    soundtrack.pause();
    closeMarta();
  });
  section.append(video, link('Archivfilm und Herkunft beim USHMM ↗', 'https://encyclopedia.ushmm.org/content/en/film/destruction-of-lidice', true));
  section.append(sourceActivity('Lidice · Zerstörung beobachten', null, [null,
    'Betrachte 00:00–00:10. Was verändert sich in der Landschaft durch die Explosion und die aufsteigende Wolke? Beschreibe zuerst das Sichtbare. Erläutere dann mit dem Stationstext, warum diese Bilder zu einer gezielten Zerstörung gehören.',
    'Eine Explosion schleudert Material in die Höhe. Eine dichte Wolke breitet sich über dem Boden aus und verdeckt Teile der Landschaft. Der Stationstext ordnet die Aufnahme in die systematische Zerstörung Lidices ein. Aus diesem kurzen Bild allein lassen sich weder die Identität der Ausführenden noch das Schicksal der Einwohner erschliessen.',
    '00:00–00:10'
  ]));
  section.append(sourceActivity('Lidice · Ruinen als Quelle', null, [null,
    'Halte bei 00:45 an. Beschreibe zwei sichtbare Schäden an den Häusern. Was belegt die Aufnahme, und welche Informationen über die Opfer musst du anderen Quellen entnehmen?',
    'Die Aufnahme zeigt stehen gebliebene Giebel und freiliegende Dachkonstruktionen. Ganze Dachflächen fehlen, Teile der Gebäude sind zerstört. Das Bild belegt schwere Zerstörungen an der Bebauung. Wie viele Menschen ermordet wurden und wohin Frauen und Kinder verschleppt wurden, lässt sich daraus nicht ablesen. Diese Angaben liefern das USHMM-Dossier und der Stationstext.',
    '00:45 · Standbild'
  ]));
}

function appendHavelFilm(section) {
  const vimeo = 'https://vimeo.com/197563573';
  const film = element('div');
  const player = element('iframe');
  player.src = 'https://player.vimeo.com/video/197563573?dnt=1';
  player.title = 'Občan Havel – Dokumentarfilm mit englischen Untertiteln';
  player.className = 'film-player';
  player.loading = 'lazy';
  player.allow = 'fullscreen; picture-in-picture';
  film.append(element('h4', 'Občan Havel · Bürger Havel'), element('p', 'Dokumentarfilm · 1 Std. 58 Min. · englische Untertitel im Bild'), player, link('Film direkt auf Vimeo öffnen ↗', vimeo, true));
  for (const [range, start, prompt, model] of havelScenes) {
    film.append(sourceActivity('Filmstelle · ' + range, link('Bei ' + range.split('–')[0] + ' auf Vimeo öffnen ↗', vimeo + '#t=' + start, true), [null, prompt, model]));
  }
  section.append(film);
}

function sourceActivity(kind, source, exercise) {
  const activity = element('div', '', 'source-activity');
  activity.append(element('p', kind, 'date'));
  if (source) {
    const heading = element('h4');
    heading.append(source);
    activity.append(heading);
  }
  if (exercise) {
    const [, prompt, model, range] = exercise;
    if (range) activity.append(element('p', 'Zeitfenster ' + range + ' ab Beitragsbeginn, ohne Werbung', 'date'));
    activity.append(element('p', prompt), modelAnswer(model));
  }
  return activity;
}

const chapterVisuals = {
  anfang: ['karten/regionen.png', 'Böhmen, Mähren und Tschechisch-Schlesien auf einer heutigen Karte.', '#karten'],
  berg: ['bilder/weisser-berg.jpg', 'Schlacht am Weissen Berg 1620, Darstellung im Theatrum Europaeum.', 'https://commons.wikimedia.org/wiki/File:White_Mountain_plan.jpg', 'Matthäus Merian · gemeinfrei · verkleinert'],
  sprache: ['bilder/prag-1900.jpg', 'Das Nationaltheater an der Moldau, um 1900.', 'https://commons.wikimedia.org/wiki/File:Prag_Nationaltheater.jpg'],
  republik: ['bilder/prag-1918.jpg', 'Staatsgründung in Prag am 28. Oktober 1918.', 'https://commons.wikimedia.org/wiki/File:Overthrow_of_Austrian_rule_in_Prague.jpg'],
  muenchen: ['bilder/muenchen-1938.jpg', 'Die Münchner Konferenz, 29. September 1938.', 'https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_183-H28788,_M%C3%BCnchener_Abkommen.jpg'],
  besatzung: ['bilder/terezin.jpg', 'Der Torbogen der Kleinen Festung in Terezín. Die Gestapo nutzte die Festung als Gefängnis. Das Ghetto lag in der Stadt.', 'https://commons.wikimedia.org/wiki/File:Terezin.ArbeitMachtFrei.JPG', 'Eugene Tsuprun · Freie Kunstlizenz'],
  umbruch: ['bilder/prag-1945.jpg', 'Einwohner bauen am 6. Mai 1945 während des Prager Aufstands eine Barrikade.', 'https://commons.wikimedia.org/wiki/File:Pra%C5%BEsk%C3%A9_povst%C3%A1n%C3%AD,_stavba_barik%C3%A1dy.jpg', 'Unbekannte Urheberschaft · eSbírky · CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'],
  diktatur: ['bilder/gottwald.jpg', 'Klement Gottwald, offizielles Porträt als Regierungschef, Juni 1948.', 'https://commons.wikimedia.org/wiki/File:Klement_GOTTWALD,_p%C5%99edseda_%C4%8Deskoslovensk%C3%A9_vl%C3%A1dy,_ofici%C3%A1ln%C3%AD_portr%C3%A9t_(%C4%8CTK,_ID_FO00075657).jpg', 'ČTK · Bildnachweis und Lizenz'],
  fruehling: ['bilder/prag-1968.jpg', 'Prag im August 1968. Menschen tragen eine Flagge an einem brennenden Panzer vorbei.', 'https://commons.wikimedia.org/wiki/File:10_Soviet_Invasion_of_Czechoslovakia_-_Flickr_-_The_Central_Intelligence_Agency.jpg'],
  charta: ['bilder/smichov-1978.png', 'Strassenbahn und rote Fahnen im Prager Stadtteil Smíchov, 1978.', 'https://commons.wikimedia.org/wiki/File:Tram.Nadrazni.Smichov_Prague.1978.PatrickNicholas.png', 'Patrick Nicholas · CC BY-SA 3.0'],
  revolution: ['bilder/prag-1989.jpg', 'Proteste auf dem Prager Wenzelsplatz, 1989.', 'https://commons.wikimedia.org/wiki/File:Praha_1989,_Václavské_náměstí,_dav.jpg'],
  europa: ['bilder/eu-beitritt.jpg', 'Gruppenbild zur Unterzeichnung des EU-Beitrittsvertrags in Athen, 16. April 2003.', 'https://commons.wikimedia.org/wiki/File:Signing_ceremony_of_the_accession_treaty_of_the_New_Member_States_of_the_EU_(P-009815_00-17).jpg', '© Europäische Gemeinschaften, 2003 · Foto Jan Van de Vel · CC BY 4.0 · verkleinert', 'https://creativecommons.org/licenses/by/4.0/'],
  gegenwart: ['bilder/prag-2014.jpg', 'Die Karlsbrücke über der Moldau in Prag, 2014.', 'https://commons.wikimedia.org/wiki/File:Charles_Bridge_-_panorama.jpg', 'Tiia Monto · Bildnachweis und Lizenz']
};

function chapterVisual(chapter) {
  const [file, caption, source, credit, license] = chapterVisuals[chapter.id];
  const figure = element('figure', '', 'chapter-visual');
  const picture = element('img');
  picture.src = file;
  picture.alt = caption;
  const description = element('figcaption', caption + ' ');
  description.append(link(credit || 'Bildnachweis', source, source.startsWith('https:')));
  if (license) description.append(' · ', link('Lizenz', license, true));
  figure.append(picture, description);
  return figure;
}

function stationAddress(chapter, index) {
  return '#' + chapter.id + (index ? '/' + (index + 1) : '');
}

function render(focus = false) {
  const requested = location.hash.slice(1);
  const [chapterId, stationNumber] = requested.split('/');
  const chapter = chapters.find(entry => entry.id === chapterId) || chapters.find(entry => entry.id === 'republik');
  const requestedIndex = Number(stationNumber) - 1;
  const station = Number.isInteger(requestedIndex) && chapter.sections[requestedIndex] ? requestedIndex : 0;
  updateProgress(chapter);
  const index = chapters.indexOf(chapter);
  const header = element('header', '', 'chapter-header');
  const heading = element('div');
  heading.append(element('p', chapter.era, 'eyebrow'), element('h2', chapter.title), link('Karten vergleichen ↓', '#karten'));
  header.append(chapterVisual(chapter), heading);
  const outline = element('nav', '', 'station-nav');
  outline.setAttribute('aria-label', 'Lernstationen in diesem Kapitel');
  chapter.sections.forEach(([title], position) => {
    const stop = link(title, stationAddress(chapter, position));
    if (position === station) stop.setAttribute('aria-current', 'step');
    outline.append(stop);
  });
  const [title, body] = chapter.sections[station];
  const section = element('section', '', 'reading station');
  section.append(element('p', 'Station ' + (station + 1) + ' von ' + chapter.sections.length, 'date'), element('h3', title), element('p', body));
  appendCulturalSources(section, chapter.id, station);
  appendSectionSources(section, chapter, station);
  const navigation = element('nav', '', 'next');
  navigation.setAttribute('aria-label', 'Weiterlernen');
  if (station > 0) navigation.append(link('← Vorige Station', stationAddress(chapter, station - 1)));
  else if (index > 0) navigation.append(link('← ' + chapters[index - 1].title, '#' + chapters[index - 1].id));
  if (station + 1 < chapter.sections.length) navigation.append(link('Nächste Station →', stationAddress(chapter, station + 1)));
  else if (index + 1 < chapters.length) navigation.append(link(chapters[index + 1].title + ' →', '#' + chapters[index + 1].id));
  const scenes = element('details', '', 'scene-picker');
  scenes.append(element('summary', 'Alle Szenen dieses Kapitels · ' + chapter.sections.length), outline);
  main.replaceChildren(header, section, navigation, scenes);
  if (station === chapter.sections.length - 1 || saved[chapter.id] === true) addCompletionButton(chapter);
  if (focus && requested !== 'karten') {
    const chapterTitle = header.querySelector('h2');
    chapterTitle.tabIndex = -1;
    chapterTitle.focus({preventScroll: true});
    main.scrollIntoView({block: 'start'});
  }
}

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({block: 'start'});
});
window.addEventListener('hashchange', () => render(true));
render(Boolean(location.hash && location.hash !== '#lektion'));

const soundtrack = document.querySelector('#moldau');
const soundtrackToggle = document.querySelector('#soundtrack-toggle');
const soundtrackStatus = document.querySelector('#soundtrack-status');
soundtrack.volume = 0.25;
soundtrack.closest('.soundtrack').hidden = false;

function updateSoundtrackButton() {
  const playing = !soundtrack.paused;
  soundtrackToggle.textContent = playing ? 'Ⅱ Moldau pausieren' : '♪ Moldau abspielen';
  soundtrackToggle.setAttribute('aria-pressed', String(playing));
}

soundtrackToggle.addEventListener('click', async () => {
  soundtrackStatus.textContent = '';
  if (!soundtrack.paused) {
    soundtrack.pause();
    return;
  }
  try {
    await soundtrack.play();
  } catch {
    soundtrackStatus.textContent = 'Die Musik konnte nicht gestartet werden.';
  }
});
soundtrack.addEventListener('play', updateSoundtrackButton);
soundtrack.addEventListener('pause', updateSoundtrackButton);
const martaPlayer = document.querySelector('#marta-player');
const martaVideo = document.querySelector('#marta-video');

function closeMarta() {
  martaVideo.replaceChildren();
  martaPlayer.hidden = true;
}

soundtrack.addEventListener('play', closeMarta);
document.querySelector('#marta-close').addEventListener('click', closeMarta);
function startMarta() {
  soundtrack.pause();
  const player = element('iframe', '', 'film-player');
  player.title = 'Marta Kubišová – Modlitba pro Martu';
  player.src = 'https://www.youtube-nocookie.com/embed/8IzKWTcK1po?autoplay=1&playsinline=1';
  player.allow = 'autoplay; fullscreen';
  martaPlayer.hidden = false;
  martaVideo.replaceChildren(player);
}
soundtrack.addEventListener('ended', startMarta);
document.querySelector('#marta-start').addEventListener('click', startMarta);
main.addEventListener('click', event => {
  if (event.target.closest('a[target="_blank"]')) {
    soundtrack.pause();
    closeMarta();
  }
});
