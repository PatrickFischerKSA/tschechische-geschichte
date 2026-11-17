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
    const exercise = mediaTasks.besatzung.find(([source]) => source === 'lidice');
    section.append(sourceActivity('Widerstand und Besatzungsterror', null, exercise));
  }
  if (chapterId === 'revolution' && index === 2) appendHavelFilm(section);
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
soundtrack.addEventListener('ended', () => {
  updateSoundtrackButton();
  const player = element('iframe', '', 'film-player');
  player.title = 'Marta Kubišová – Modlitba pro Martu';
  player.src = 'https://www.youtube-nocookie.com/embed/8IzKWTcK1po?autoplay=1&playsinline=1';
  player.allow = 'autoplay; fullscreen';
  martaPlayer.hidden = false;
  martaVideo.replaceChildren(player);
});
main.addEventListener('click', event => {
  if (event.target.closest('a[target="_blank"]')) {
    soundtrack.pause();
    closeMarta();
  }
});
