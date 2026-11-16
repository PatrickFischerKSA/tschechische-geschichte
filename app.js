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
    anchor.append(element('span', chapter.era, 'date'), element('span', chapter.title));
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
  main.append(button);
}

function addImage([file, directory, caption, credit]) {
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
  main.append(figure);
}

function render(focus = false) {
  const requested = location.hash.slice(1);
  const chapter = chapters.find(entry => entry.id === requested) || chapters[0];
  updateProgress(chapter);
  const index = chapters.indexOf(chapter);
  main.replaceChildren(element('p', chapter.era, 'eyebrow'), element('h2', chapter.title));
  if (chapter.image) addImage(chapter.image);
  for (const [title, body] of chapter.sections) {
    const section = element('section', '', 'reading');
    section.append(element('h3', title), element('p', body));
    main.append(section);
  }
  if (chapter.media) {
    const section = element('section', '', 'media');
    const list = element('ul');
    for (const [kind, title, url] of chapter.media) {
      const row = element('li');
      row.append(element('span', kind, 'date'), link(title + ' ↗', url, true));
      list.append(row);
    }
    section.append(element('h3', 'Quellen und Medien'), list);
    main.append(section);
  }
  if (chapter.task) {
    const [prompt, model] = chapter.task;
    const section = element('section', '', 'task');
    const reveal = element('details');
    reveal.append(element('summary', 'Mögliche Auswertung anzeigen'), element('p', model));
    section.append(element('h3', 'Quellenarbeit'), element('p', prompt), reveal);
    main.append(section);
  }
  addCompletionButton(chapter);
  const navigation = element('nav', '', 'next');
  navigation.setAttribute('aria-label', 'Kapitel wechseln');
  if (index > 0) navigation.append(link('← ' + chapters[index - 1].title, '#' + chapters[index - 1].id));
  if (index < chapters.length - 1) navigation.append(link(chapters[index + 1].title + ' →', '#' + chapters[index + 1].id));
  main.append(navigation);
  if (focus) {
    main.focus({preventScroll: true});
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
