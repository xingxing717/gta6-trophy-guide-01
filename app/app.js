// Leonida Legend — GTA VI trophy guide & tracker.
// Plain ES module, no libraries, no network at run time beyond loading the
// trophy data file beside this script. Progress lives in localStorage and can
// be exported to a file and imported back.
const STORAGE_KEY = 'gta6-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  side: 'Side jobs',
  online: 'Online',
};
const KIND_ORDER = ['all', 'story', 'missable', 'collectibles', 'activities', 'side', 'online'];

const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', time: '60–80 hours', blurb: 'Chapters 1–5 and the mission trophies. Do the Chapter 1 meditation while you are there, start stranger strands as they unlock, and scan vehicles and animals as you travel.' },
  { n: 2, title: 'Stage 2 — Activities & stranger strands', time: 'About 40 hours', blurb: 'Races, ranges, heists and side missions. Most activity trophies land here, and the stranger finales close out their chains.' },
  { n: 3, title: 'Stage 3 — Collectibles, money & cleanup', time: 'About 60 hours', blurb: 'Cards, WAiNK, exploration, garages and laundering. The long grind, best done after the story when the whole map is open.' },
  { n: 4, title: 'Stage 4 — 100% & platinum', time: 'About 10 hours of cleanup', blurb: 'Finish the 100% completion checklist for A Long Road; the platinum follows the moment it is done.' },
];

const params = new URLSearchParams(location.search);
const seeded = params.has('seed');
const seedCount = Number(params.get('seed') || 0);

let trophies = [];
const state = {
  earned: new Set(),
  counts: {},
  spoiler: true,
  hideEarned: false,
  kind: 'all',
  grade: 'all',
  query: '',
  view: 'checklist',
  openId: null,
};

const $ = (id) => document.getElementById(id);

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter((id) => Number.isInteger(id)));
    if (saved.counts && typeof saved.counts === 'object') state.counts = saved.counts;
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
    if (typeof saved.hideEarned === 'boolean') state.hideEarned = saved.hideEarned;
  } catch {
    // A corrupt save is ignored; the checklist starts empty.
  }
}

function saveState() {
  if (seeded) return; // Screenshot staging (?seed=) never writes to storage.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: [...state.earned],
      counts: state.counts,
      spoiler: state.spoiler,
      hideEarned: state.hideEarned,
    }));
  } catch {
    // Storage full or unavailable: progress still works for this session.
  }
}

function applyUrlParams() {
  if (seeded) {
    // Screenshot staging: tick the first N trophies in roadmap order, skipping
    // the platinum and A Long Road (neither can be earned that early).
    const order = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id)
      .filter((t) => t.id !== 1 && t.id !== 14);
    state.earned = new Set(order.slice(0, seedCount).map((t) => t.id));
  }
  if (params.get('spoiler') === '0') state.spoiler = false;
  if (params.get('spoiler') === '1') state.spoiler = true;
  if (KIND_ORDER.includes(params.get('kind'))) state.kind = params.get('kind');
  if (params.get('view')) state.view = params.get('view');
  if (params.get('open')) state.openId = Number(params.get('open'));
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isSpoiled(t) {
  return state.spoiler && t.kinds.includes('story') && !state.earned.has(t.id);
}

function formatCount(t) {
  const n = state.counts[t.id] || 0;
  const fmt = (v) => v.toLocaleString('en-US');
  return `${fmt(n)} / ${fmt(t.target)} ${t.unit}`;
}

function counterStep(t) {
  return t.target >= 10000 ? 1000 : 1;
}

function setCount(t, value) {
  const next = Math.max(0, Math.min(t.target, value));
  state.counts[t.id] = next;
  if (next >= t.target) state.earned.add(t.id);
  saveState();
  renderAll();
}

function toggleEarned(t, on) {
  if (on) state.earned.add(t.id);
  else state.earned.delete(t.id);
  saveState();
  renderAll();
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind !== 'all' && !t.kinds.includes(state.kind)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function gradeLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] || '?';
}

function renderProgress() {
  const earned = state.earned.size;
  const total = trophies.length;
  $('progressFill').style.width = total ? `${Math.round((earned / total) * 100)}%` : '0%';
  $('progressCount').textContent = `${earned} / ${total}`;
  const byGrade = {};
  for (const t of trophies) {
    if (state.earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  $('progressGrades').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g] || 0} ${g}`).join(' · ');
}

function renderChips() {
  const wrap = $('kindChips');
  wrap.replaceChildren();
  for (const kind of KIND_ORDER) {
    const count = kind === 'all' ? trophies.length : trophies.filter((t) => t.kinds.includes(kind)).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (state.kind === kind ? ' active' : '');
    chip.textContent = `${KIND_LABELS[kind]} (${count})`;
    chip.setAttribute('aria-pressed', String(state.kind === kind));
    chip.addEventListener('click', () => { state.kind = kind; renderCards(); renderChips(); });
    wrap.append(chip);
  }
}

function renderCards() {
  const list = visibleTrophies();
  const cards = $('cards');
  cards.replaceChildren();
  $('resultCount').textContent = `Showing ${list.length} of ${trophies.length} trophies` +
    (state.kind === 'online' ? ' — there are no online trophies in GTA VI; every trophy is offline single-player.' : '');
  $('emptyState').hidden = list.length !== 0;

  for (const t of list) {
    const earned = state.earned.has(t.id);
    const spoiled = isSpoiled(t);
    const card = document.createElement('article');
    card.className = 'card' + (earned ? ' earned' : '');

    const head = document.createElement('div');
    head.className = 'card-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${spoiled ? 'hidden story trophy' : t.name} as earned`);
    box.addEventListener('change', () => toggleEarned(t, box.checked));
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.textContent = gradeLetter(t.grade);
    medal.title = t.grade;
    const title = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'card-title';
    name.textContent = spoiled ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = spoiled ? 'card-desc spoiled' : 'card-desc';
    desc.textContent = spoiled ? 'Hidden until earned — turn the spoiler setting off to see it.' : t.description;
    title.append(name, desc);
    head.append(box, medal, title);
    card.append(head);

    const tags = document.createElement('div');
    tags.className = 'card-tags';
    for (const kind of t.kinds) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = KIND_LABELS[kind] || kind;
      tags.append(tag);
    }
    if (t.hidden) {
      const tag = document.createElement('span');
      tag.className = 'tag hidden-flag';
      tag.textContent = 'Hidden on PSN';
      tags.append(tag);
    }
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'tag missable';
      tag.textContent = 'Possibly missable';
      tags.append(tag);
    }
    if (earned) {
      const tag = document.createElement('span');
      tag.className = 'tag earned-tag';
      tag.textContent = 'Earned';
      tags.append(tag);
    }
    card.append(tags);

    if (t.target) {
      const counter = document.createElement('div');
      counter.className = 'counter';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', `Decrease progress for ${t.name}`);
      minus.addEventListener('click', () => setCount(t, (state.counts[t.id] || 0) - counterStep(t)));
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', `Increase progress for ${t.name}`);
      plus.addEventListener('click', () => setCount(t, (state.counts[t.id] || 0) + counterStep(t)));
      const label = document.createElement('span');
      label.className = 'count';
      label.textContent = formatCount(t);
      counter.append(minus, label, plus);
      if ((state.counts[t.id] || 0) >= t.target) {
        const done = document.createElement('span');
        done.className = 'done';
        done.textContent = 'Target reached';
        counter.append(done);
      }
      card.append(counter);
    }

    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const stage = document.createElement('span');
    stage.className = 'stage-note';
    stage.textContent = `Roadmap stage ${t.stage}`;
    const guideBtn = document.createElement('button');
    guideBtn.type = 'button';
    guideBtn.className = 'guide-btn';
    guideBtn.textContent = 'Guide & sources';
    guideBtn.disabled = spoiled;
    guideBtn.addEventListener('click', () => openDetail(t.id));
    foot.append(stage, guideBtn);
    card.append(foot);
    cards.append(card);
  }
}

function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const items = trophies.filter((t) => t.stage === stage.n);
    const done = items.filter((t) => state.earned.has(t.id)).length;
    const box = document.createElement('div');
    box.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const time = document.createElement('p');
    time.className = 'time';
    time.textContent = stage.time;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const prog = document.createElement('p');
    prog.className = 'stage-progress';
    prog.textContent = `${done} / ${items.length} earned in this stage`;
    const list = document.createElement('ul');
    for (const t of items) {
      const li = document.createElement('li');
      if (state.earned.has(t.id)) li.className = 'done';
      const dot = document.createElement('span');
      dot.className = `dot ${t.grade}`;
      const label = document.createElement('span');
      label.textContent = isSpoiled(t) ? 'Hidden story trophy' : t.name;
      li.append(dot, label);
      list.append(li);
    }
    box.append(h, time, blurb, prog, list);
    wrap.append(box);
  }
}

function renderMissables() {
  const wrap = $('missableList');
  wrap.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = `⚠ ${t.name} — ${t.grade} · possibly missable`;
    const desc = document.createElement('p');
    desc.textContent = t.description;
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const steps = document.createElement('ol');
    for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      steps.append(li);
    }
    const src = document.createElement('p');
    src.textContent = 'Sources: ' + t.sources.map((s) => s.name).join(' · ');
    card.append(h, desc, guide, steps, src);
    wrap.append(card);
  }
}

function openDetail(id) {
  const t = trophyById(id);
  if (!t || isSpoiled(t)) return;
  state.openId = id;
  const body = $('detailBody');
  body.replaceChildren();

  const medal = document.createElement('span');
  medal.className = `medal ${t.grade}`;
  medal.textContent = gradeLetter(t.grade);
  const h = document.createElement('h2');
  h.textContent = t.name;
  const gradeLine = document.createElement('p');
  gradeLine.className = 'grade-line';
  gradeLine.textContent = `${t.grade} trophy${t.hidden ? ' · hidden on PlayStation until earned' : ''}${t.missable ? ' · possibly missable' : ''} · roadmap stage ${t.stage}`;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `“${t.description}” — the official description.`;
  body.append(medal, h, gradeLine, official);

  if (t.missable) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = 'Possibly missable: do the Chapter 1 meditation before the chapter ends. See the Missables tab for the full warning.';
    body.append(note);
  }

  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  body.append(guideH, guide);

  const stepsH = document.createElement('h3');
  stepsH.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const s of t.steps) {
    const li = document.createElement('li');
    li.textContent = s;
    steps.append(li);
  }
  body.append(stepsH, steps);

  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources';
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    list.append(li);
  }
  body.append(srcH, list);

  $('detail').hidden = false;
  $('scrim').hidden = false;
}

function closeDetail() {
  state.openId = null;
  $('detail').hidden = true;
  $('scrim').hidden = true;
}

function switchView(view) {
  state.view = view;
  for (const btn of document.querySelectorAll('.tab')) {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('active', section.id === `view-${view}`);
  }
}

function renderAll() {
  renderProgress();
  renderCards();
  renderRoadmap();
  renderMissables();
}

function exportProgress() {
  const payload = {
    app: 'leonida-legend-gta6-trophy-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: trophies.filter((t) => state.earned.has(t.id)).map((t) => t.name),
    counts: Object.fromEntries(
      Object.entries(state.counts).map(([id, n]) => [trophyById(Number(id))?.name || id, n]),
    ),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data.earned) ? data.earned : [];
    const byName = new Map(trophies.map((t) => [t.name, t]));
    const byId = new Map(trophies.map((t) => [t.id, t]));
    const next = new Set();
    for (const entry of names) {
      const t = typeof entry === 'number' ? byId.get(entry) : byName.get(entry);
      if (t) next.add(t.id);
    }
    const counts = {};
    if (data.counts && typeof data.counts === 'object') {
      for (const [key, value] of Object.entries(data.counts)) {
        const t = byName.get(key) || byId.get(Number(key));
        if (t && Number.isFinite(Number(value))) counts[t.id] = Math.max(0, Math.min(t.target || 0, Number(value)));
      }
    }
    state.earned = next;
    state.counts = counts;
    saveState();
    renderAll();
  } catch {
    alert('That file could not be read as trophy progress. Export a progress file from this guide and import that one.');
  }
}

async function boot() {
  const doc = await (await fetch(DATA_URL)).json();
  trophies = doc.trophies || doc;
  loadStoredState();
  applyUrlParams();

  $('spoilerToggle').checked = state.spoiler;
  $('hideEarnedToggle').checked = state.hideEarned;

  $('search').addEventListener('input', (e) => { state.query = e.target.value; renderCards(); });
  $('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderCards(); });
  $('spoilerToggle').addEventListener('change', (e) => { state.spoiler = e.target.checked; saveState(); renderAll(); });
  $('hideEarnedToggle').addEventListener('change', (e) => { state.hideEarned = e.target.checked; saveState(); renderCards(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies and counters?')) return;
    state.earned = new Set();
    state.counts = {};
    saveState();
    renderAll();
  });
  for (const btn of document.querySelectorAll('.tab')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  $('detailClose').addEventListener('click', closeDetail);
  $('scrim').addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

  renderChips();
  renderAll();
  switchView(state.view);
  if (state.openId) openDetail(state.openId);
}

boot();
