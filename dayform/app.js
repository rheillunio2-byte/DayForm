'use strict';
/* ==========================================================================
   Dayform — vanilla JS. Data model and storage key (dayform-data-v1) are
   unchanged from the original; UI preferences live under dayform-prefs-v1.
   ========================================================================== */

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
const fmt = (d, o = { month: 'short', day: 'numeric' }) => new Intl.DateTimeFormat('en-US', o).format(d);
const timeMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const uid = () => 'id-' + Math.random().toString(36).slice(2, 10);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attr = (s = '') => esc(s).replace(/`/g, '&#96;');
const DAY3 = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYFULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STORAGE_KEY = 'dayform-data-v1', PREFS_KEY = 'dayform-prefs-v1';
const HPX = 56; // pixels per hour in the time grid

const CATEGORIES = { Academic: 'cap', Workout: 'dumbbell', Meal: 'utensils', Routine: 'repeat', Work: 'briefcase', Task: 'check-square', Personal: 'star', Custom: 'layers' };
const catKey = c => (CATEGORIES[c] ? c : 'Custom').toLowerCase();
const icon = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const catIcon = c => icon(CATEGORIES[c] || CATEGORIES.Custom);
const fmtDur = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`;

let today = new Date();
const state = { activities: [], templates: [], page: 'dashboard', view: 'week', cursor: new Date(today), filter: 'all', templateCategory: 'All', templateSearch: '', previewId: null, applyStep: 1, justToggled: null };
let prefs = { theme: 'system', sidebar: 'expanded' };

/* ---------- sample data (unchanged) ---------- */
function sampleData() {
  const mon = startOfWeek(today);
  const act = (offset, title, category, start, end, location = '', notes = '') => ({ id: uid(), title, category, date: toISO(addDays(mon, offset)), start, end, location, notes, completed: false });
  state.activities = [
    act(0, 'Research Methods', 'Academic', '08:00', '09:30', 'Room 204'), act(0, 'Independent study', 'Academic', '10:00', '11:00', 'Library'), act(0, 'Push day', 'Workout', '17:00', '18:00', 'Gym', 'Chest, shoulders, triceps'),
    act(1, 'Communication Arts', 'Academic', '09:00', '10:30', 'Room 105'), act(1, 'Lunch', 'Meal', '12:00', '12:45', 'Cafeteria'), act(1, 'Project work', 'Task', '14:00', '15:30', 'Home'),
    act(2, 'Pull day', 'Workout', '17:00', '18:00', 'Gym'), act(2, 'Study session', 'Academic', '19:00', '20:00', 'Home'),
    act(3, 'Work immersion prep', 'Academic', '08:00', '09:30', 'Room 204'), act(3, 'Dinner', 'Meal', '18:30', '19:00', 'Home'),
    act(4, 'Leg day', 'Workout', '16:30', '17:30', 'Gym'), act(4, 'Weekly review', 'Routine', '20:00', '20:30', 'Home'),
    act(5, 'Grocery and meal prep', 'Routine', '10:00', '11:30', 'Market'), act(6, 'Rest and reset', 'Routine', '18:00', '18:30', 'Home')
  ];
  const T = (name, category, description, favorite, items) => ({ id: uid(), name, category, description, favorite, updated: Date.now(), items });
  state.templates = [
    T('Weekly class timetable', 'Academic', 'A balanced Monday to Friday class and study rhythm.', true, [{ day: 1, title: 'Research Methods', category: 'Academic', start: '08:00', end: '09:30', location: 'Room 204' }, { day: 1, title: 'Independent study', category: 'Academic', start: '10:00', end: '11:00' }, { day: 2, title: 'Communication Arts', category: 'Academic', start: '09:00', end: '10:30', location: 'Room 105' }, { day: 3, title: 'Core Subject', category: 'Academic', start: '08:00', end: '09:30' }, { day: 4, title: 'Work immersion prep', category: 'Academic', start: '08:00', end: '09:30' }, { day: 5, title: 'Research consultation', category: 'Academic', start: '10:00', end: '11:00' }]),
    T('Push / Pull / Legs', 'Workout', 'Three focused strength sessions with recovery days.', true, [{ day: 1, title: 'Push day', category: 'Workout', start: '17:00', end: '18:00', location: 'Gym' }, { day: 3, title: 'Pull day', category: 'Workout', start: '17:00', end: '18:00', location: 'Gym' }, { day: 5, title: 'Leg day', category: 'Workout', start: '17:00', end: '18:00', location: 'Gym' }]),
    T('Simple meal plan', 'Meal', 'A simple daily meal rhythm to keep meals organized.', false, [{ day: 1, title: 'Breakfast', category: 'Meal', start: '07:00', end: '07:30' }, { day: 1, title: 'Lunch', category: 'Meal', start: '12:00', end: '12:45' }, { day: 1, title: 'Dinner', category: 'Meal', start: '18:30', end: '19:00' }]),
    T('Morning reset', 'Routine', 'A calm start before the day gets busy.', false, [{ day: 1, title: 'Wake up and hydrate', category: 'Routine', start: '06:00', end: '06:15' }, { day: 1, title: 'Stretch and get ready', category: 'Routine', start: '06:15', end: '06:45' }, { day: 1, title: 'Plan the day', category: 'Routine', start: '06:45', end: '07:00' }])
  ];
  save();
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ activities: state.activities, templates: state.templates })); $('templateCount').textContent = state.templates.length; }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (d && Array.isArray(d.activities) && Array.isArray(d.templates)) {
      // Backward-compatible normalisation: older saves may lack optional fields.
      state.activities = d.activities.map(a => ({ location: '', notes: '', completed: false, ...a }));
      state.templates = d.templates.map(t => ({ description: '', favorite: false, updated: Date.now(), ...t, items: Array.isArray(t.items) ? t.items : [] }));
      $('templateCount').textContent = state.templates.length;
      return;
    }
  } catch (e) { /* fall through to sample data */ }
  sampleData();
}
function loadPrefs() { try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch (e) { } }
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { } }

/* ---------- theme & sidebar ---------- */
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && darkMQ.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('themeColorMeta').content = dark ? '#111113' : '#f6f5f2';
  $('themeToggle').innerHTML = icon(dark ? 'sun' : 'moon');
  $$('[data-theme-choice]').forEach(b => b.classList.toggle('active', b.dataset.themeChoice === prefs.theme));
}
function setTheme(t) { prefs.theme = t; savePrefs(); applyTheme(); }
darkMQ.addEventListener?.('change', () => { if (prefs.theme === 'system') applyTheme(); });
function applySidebar() {
  const c = prefs.sidebar === 'collapsed';
  if (c) document.documentElement.dataset.sidebar = 'collapsed'; else delete document.documentElement.dataset.sidebar;
  $('collapseSidebar').setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
}
function setSidebarOpen(open) { $('sidebar').classList.toggle('open', open); $('scrim').classList.toggle('show', open); }

/* ---------- toast, modals, confirm ---------- */
function toast(msg, type = 'ok') {
  const el = $('toast');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = icon(type === 'error' ? 'alert' : 'check') + `<span>${esc(msg)}</span>`;
  void el.offsetWidth; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
const modalStack = [];
let confirmResolve = null;
function openModal(id) {
  const m = $(id);
  m._returnFocus = document.activeElement;
  m.classList.add('open'); modalStack.push(id);
  setTimeout(() => {
    const f = m.querySelector('[autofocus],input:not([type=hidden]):not([type=checkbox]),select,textarea') || m.querySelector('.btn.primary,.btn.solid');
    if (f && m.classList.contains('open')) f.focus({ preventScroll: true });
  }, 60);
}
function closeModal(id) {
  const m = $(id); if (!m.classList.contains('open')) return;
  m.classList.remove('open');
  const i = modalStack.lastIndexOf(id); if (i > -1) modalStack.splice(i, 1);
  if (id === 'confirmModal' && confirmResolve) { const r = confirmResolve; confirmResolve = null; r(false); }
  const rf = m._returnFocus; if (rf && document.contains(rf) && rf.focus) rf.focus({ preventScroll: true });
}
function confirmDialog({ title, message, confirm = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    $('confirmTitle').textContent = title; $('confirmMessage').textContent = message;
    const ok = $('confirmOk'); ok.textContent = confirm; ok.className = 'btn ' + (danger ? 'danger solid' : 'primary');
    confirmResolve = resolve;
    openModal('confirmModal');
    ok.onclick = () => { const r = confirmResolve; confirmResolve = null; closeModal('confirmModal'); r && r(true); };
    $('confirmCancel').onclick = () => closeModal('confirmModal');
  });
}
function setError(inputId, msg) {
  const f = $(inputId).closest('.field'); if (!f) return;
  f.classList.toggle('invalid', !!msg);
  const e = f.querySelector('.field-error'); if (e) e.textContent = msg || '';
}
const clearErrors = root => $$('.field.invalid', root).forEach(f => { f.classList.remove('invalid'); const e = f.querySelector('.field-error'); if (e) e.textContent = ''; });

/* ---------- time helpers ---------- */
const whenStart = a => { const d = parseDate(a.date); d.setHours(0, timeMins(a.start), 0, 0); return d; };
const whenEnd = a => { const d = parseDate(a.date); d.setHours(0, timeMins(a.end), 0, 0); return d; };
const dayLabel = iso => iso === toISO(today) ? 'Today' : iso === toISO(addDays(today, 1)) ? 'Tomorrow' : fmt(parseDate(iso), { weekday: 'short' });
const inLabel = ms => { const m = Math.max(0, Math.round(ms / 60000)); if (m < 1) return 'now'; if (m < 60) return `${m} min`; const h = Math.floor(m / 60); if (h < 24) return `${h}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`; return `${Math.round(h / 24)} d`; };
const activitiesOn = date => state.activities.filter(a => a.date === toISO(date)).sort((a, b) => a.start.localeCompare(b.start));
const filtered = acts => state.filter === 'all' ? acts : acts.filter(a => a.category === state.filter);
function nextUp(pred = () => true) {
  const now = new Date();
  return state.activities.filter(a => !a.completed && whenEnd(a) > now && pred(a)).sort((a, b) => whenStart(a) - whenStart(b))[0];
}

/* ---------- navigation ---------- */
const PAGE_NAMES = { dashboard: 'Dashboard', schedule: 'My Schedule', academic: 'Academic Planner', workout: 'Workout Planner', meals: 'Meal Planner', habits: 'Habits & Routines', tasks: 'Tasks & Events', templates: 'Templates', settings: 'Settings' };
const PLANNERS = { academic: ['Academic', 'Classes and study sessions'], workout: ['Workout', 'Training sessions and recovery'], meals: ['Meal', 'Meals planned throughout the day'], habits: ['Routine', 'Small actions that make a rhythm'], tasks: ['Task', 'Things to move forward'] };
function setPage(page) {
  state.page = page;
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  $$('.nav-item[data-page]').forEach(b => { const on = b.dataset.page === page; b.classList.toggle('active', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  $('breadcrumbCurrent').textContent = PAGE_NAMES[page] || page;
  setSidebarOpen(false);
  if (page === 'dashboard') renderDashboard();
  if (page === 'schedule') renderCalendar(true);
  if (page === 'templates') renderTemplates();
  if (PLANNERS[page]) renderPlanner(page);
  window.scrollTo({ top: 0 });
}

/* ---------- dashboard ---------- */
const NOTES = ['Small steps every day add up.', 'Protect the time that matters most.', 'A calm plan makes a calm day.', 'Consistency beats intensity.', 'Done is a good place to start.', 'Make room for rest, too.', 'Begin before you feel ready.'];
function agendaRow(a, { showDate = false } = {}) {
  const meta = [showDate ? fmt(parseDate(a.date), { weekday: 'short', month: 'short', day: 'numeric' }) : '', a.location].filter(Boolean).map(esc).join(' · ');
  return `<div class="agenda-row cat-${catKey(a.category)} ${a.completed ? 'done' : ''}" data-edit="${a.id}">
    <span class="agenda-time">${a.start}</span><span class="agenda-bar"></span>
    <span class="agenda-text"><span class="agenda-title">${esc(a.title)}</span><span class="agenda-meta">${a.start}–${a.end}${meta ? ' · ' + meta : ''}</span></span>
    <button class="check ${a.completed ? 'done' : ''} ${state.justToggled === a.id ? 'pop' : ''}" data-toggle="${a.id}" aria-label="${a.completed ? 'Mark as not done' : 'Mark as done'}" aria-pressed="${!!a.completed}">${icon('check')}</button></div>`;
}
function renderDashboard() {
  const iso = toISO(today), acts = activitiesOn(today), done = acts.filter(a => a.completed).length, left = acts.length - done;
  const h = new Date().getHours();
  $('greeting').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('welcomeDate').textContent = fmt(today, { weekday: 'long', month: 'long', day: 'numeric' });
  $('topDate').textContent = fmt(today, { weekday: 'short', month: 'short', day: 'numeric' });
  $('todayPretty').textContent = fmt(today, { weekday: 'long', month: 'short', day: 'numeric' });
  $('dashSub').textContent = !acts.length ? 'Nothing is scheduled today.' : left === 0 ? 'Everything on today’s plan is done.' : `${left} ${left === 1 ? 'activity' : 'activities'} left on today’s plan.`;
  $('dailyNote').textContent = NOTES[Math.floor(today.getTime() / 864e5) % NOTES.length];

  // Up next / now
  const now = new Date();
  const current = acts.find(a => !a.completed && whenStart(a) <= now && whenEnd(a) > now);
  const upcoming = current || nextUp();
  if (upcoming) {
    const isNow = upcoming === current;
    const label = isNow ? `Now · ends in ${inLabel(whenEnd(upcoming) - now)}` : `Up next · ${upcoming.date === iso ? 'in ' + inLabel(whenStart(upcoming) - now) : dayLabel(upcoming.date)}`;
    $('upNext').innerHTML = `<div class="upnext cat-${catKey(upcoming.category)}" data-edit="${upcoming.id}"><div class="upnext-body"><div class="upnext-label"><i></i>${label}</div><h2>${esc(upcoming.title)}</h2>
      <div class="upnext-meta"><span>${icon('clock')}<time>${upcoming.start} – ${upcoming.end}</time></span>${upcoming.location ? `<span>${icon('pin')}${esc(upcoming.location)}</span>` : ''}<span>${catIcon(upcoming.category)}${esc(upcoming.category)}</span></div></div>
      <button class="btn secondary" data-toggle="${upcoming.id}">${icon('check')}Mark done</button></div>`;
  } else {
    $('upNext').innerHTML = `<div class="upnext is-empty"><div class="upnext-body"><div class="upnext-label"><i></i>All clear</div><h2>Nothing coming up</h2><div class="upnext-meta"><span>Add an activity or apply a template to fill your week.</span></div></div><button class="btn secondary" data-goto="templates">Browse templates</button></div>`;
  }

  $('todayTimeline').innerHTML = acts.length ? acts.map(a => agendaRow(a)).join('') :
    `<div class="empty-state"><strong>A little breathing room</strong>No activities planned for today.<br><button class="btn secondary sm" data-add-category="Academic">${icon('plus')}Add activity</button></div>`;

  // progress ring
  const pct = acts.length ? Math.round(done / acts.length * 100) : 0;
  $('progressPercent').textContent = pct + '%';
  $('progressRing').style.strokeDashoffset = 150.8 * (1 - pct / 100);
  $('progressTitle').textContent = acts.length ? `${done} of ${acts.length} done` : 'No activities yet';
  $('progressNote').textContent = acts.length ? (pct === 100 ? 'Nicely done. Today is complete.' : `${left} ${left === 1 ? 'activity' : 'activities'} to go.`) : 'Start with one small win.';

  // week strip
  const mon = startOfWeek(today);
  $('miniWeek').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mon, i), list = activitiesOn(d);
    return `<button class="mini-day ${toISO(d) === iso ? 'today' : ''}" data-day="${toISO(d)}" aria-label="${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}, ${list.length} activities"><span class="dn">${DAY3[i + 1]}</span><span class="dd">${d.getDate()}</span><span class="dots">${list.slice(0, 4).map(a => `<i class="cat-${catKey(a.category)}" style="background:var(--cat)"></i>`).join('')}</span></button>`;
  }).join('');

  // coming up
  const picks = [['Academic', 'Next class'], ['Workout', 'Next workout'], ['Meal', 'Next meal'], ['Task', 'Pending task']];
  $('comingUp').innerHTML = picks.map(([cat, label]) => {
    const a = nextUp(x => x.category === cat);
    return a ? `<div class="row-item cat-${catKey(cat)}" data-edit="${a.id}"><span class="row-icon">${catIcon(cat)}</span><span class="row-text"><small>${label}</small><strong>${esc(a.title)}</strong></span><span class="row-when">${dayLabel(a.date)} ${a.start}</span></div>`
      : `<div class="row-item is-none cat-${catKey(cat)}"><span class="row-icon">${catIcon(cat)}</span><span class="row-text"><small>${label}</small><strong>Nothing planned</strong></span></div>`;
  }).join('');

  // quick templates
  const favs = state.templates.filter(t => t.favorite).slice(0, 3), chosen = favs.length ? favs : state.templates.slice(0, 3);
  $('quickTemplates').innerHTML = chosen.length ? chosen.map(t => `<div class="row-item cat-${catKey(t.category)}" data-quick-apply="${t.id}"><span class="row-icon">${catIcon(t.category)}</span><span class="row-text"><strong>${esc(t.name)}</strong><small>${t.items.length} activities · ${daysLabel(t)}</small></span><span class="row-when">${icon('chevron-right', 'xs')}</span></div>`).join('') : '<div class="empty-state">Save a template to see it here.</div>';
}

/* ---------- calendar ---------- */
function layoutOverlaps(items) {
  const list = items.map(a => ({ a, s: timeMins(a.start), e: timeMins(a.end) })).sort((x, y) => x.s - y.s || y.e - x.e);
  const out = []; let cluster = [], end = -1;
  const flush = () => { const cols = []; cluster.forEach(it => { let c = cols.findIndex(e => e <= it.s); if (c < 0) { c = cols.length; cols.push(it.e); } else cols[c] = it.e; it.col = c; }); cluster.forEach(it => { it.cols = cols.length; out.push(it); }); cluster = []; };
  list.forEach(it => { if (cluster.length && it.s >= end) { flush(); end = -1; } cluster.push(it); end = Math.max(end, it.e); });
  flush(); return out;
}
function hourRange(acts) {
  let s = 7, e = 21;
  acts.forEach(a => { s = Math.min(s, Math.floor(timeMins(a.start) / 60)); e = Math.max(e, Math.ceil(timeMins(a.end) / 60)); });
  return [s, Math.min(24, e)];
}
function eventHTML(it, sh) {
  const a = it.a, top = (it.s - sh * 60) * HPX / 60, height = Math.max(22, (it.e - it.s) * HPX / 60 - 2), w = 100 / it.cols;
  const short = height < 40;
  return `<div class="event cat-${catKey(a.category)} ${a.completed ? 'completed' : ''} ${short ? 'short' : ''}" data-edit="${a.id}" tabindex="0" role="button" title="${attr(a.title)} · ${a.start}–${a.end}" style="top:${top}px;height:${height}px;left:calc(${it.col * w}% + 2px);width:calc(${w}% - 4px)"><b>${esc(a.title)}</b><time>${a.start}–${a.end}</time>${!short && a.location && height > 62 ? `<span class="loc">${esc(a.location)}</span>` : ''}</div>`;
}
function timeGrid(dates) {
  const per = dates.map(d => filtered(activitiesOn(d)));
  const [sh, eh] = hourRange(per.flat()), H = (eh - sh) * HPX, iso = toISO(today);
  const head = `<div class="tg-head"><div></div>${dates.map(d => `<div class="${toISO(d) === iso ? 'is-today' : ''}"><span class="wd">${fmt(d, { weekday: 'short' })}</span><span class="dn">${d.getDate()}</span></div>`).join('')}</div>`;
  const times = `<div class="tg-times">${Array.from({ length: eh - sh }, (_, i) => `<div class="tg-time">${pad(sh + i)}:00</div>`).join('')}</div>`;
  const cols = dates.map((d, i) => {
    const isToday = toISO(d) === iso, nowM = new Date().getHours() * 60 + new Date().getMinutes();
    const now = isToday && nowM >= sh * 60 && nowM <= eh * 60 ? `<div class="now-line" data-sh="${sh}" style="top:${(nowM - sh * 60) * HPX / 60}px"></div>` : '';
    return `<div class="tg-col ${isToday ? 'today' : ''}" data-date="${toISO(d)}" data-sh="${sh}">${layoutOverlaps(per[i]).map(it => eventHTML(it, sh)).join('')}${now}</div>`;
  }).join('');
  return `<div class="tg ${dates.length === 1 ? 'one' : ''}" style="--cols:${dates.length};--h:${H}px;--hpx:${HPX}px">${head}<div class="tg-body">${times}${cols}</div></div>`;
}
const isMobile = () => window.matchMedia('(max-width:720px)').matches;
function renderCalendar(scroll = false) {
  const view = state.view, cur = state.cursor, surface = $('calendarSurface');
  $$('.view-btn').forEach(b => { const on = b.dataset.view === view; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  $$('#categoryFilter .fchip').forEach(b => b.classList.toggle('active', b.dataset.filter === state.filter));
  if (view === 'week') {
    const mon = startOfWeek(cur), sun = addDays(mon, 6), dates = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    $('periodLabel').textContent = `${fmt(mon)} – ${fmt(sun, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (isMobile()) {
      surface.innerHTML = `<div class="agenda-week">${dates.map(d => { const list = filtered(activitiesOn(d)); return `<div class="aw-day ${toISO(d) === toISO(today) ? 'today' : ''}"><h3>${fmt(d, { weekday: 'long' })}<span>${fmt(d)}</span></h3>${list.length ? `<div class="agenda">${list.map(a => agendaRow(a)).join('')}</div>` : '<div class="aw-none">Nothing planned</div>'}</div>`; }).join('')}</div>`;
    } else surface.innerHTML = timeGrid(dates);
  } else if (view === 'day') {
    $('periodLabel').textContent = fmt(cur, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    surface.innerHTML = timeGrid([cur]);
  } else {
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1), start = addDays(first, -((first.getDay() + 6) % 7));
    $('periodLabel').textContent = fmt(cur, { month: 'long', year: 'numeric' });
    surface.innerHTML = `<div class="month"><div class="month-head">${DAY3.slice(1).map(x => `<div>${x}</div>`).join('')}</div><div class="month-grid">${Array.from({ length: 42 }, (_, i) => {
      const d = addDays(start, i), acts = filtered(activitiesOn(d));
      return `<div class="month-cell ${d.getMonth() !== cur.getMonth() ? 'outside' : ''} ${toISO(d) === toISO(today) ? 'today' : ''}" data-date="${toISO(d)}"><span class="month-number">${d.getDate()}</span>${acts.slice(0, 3).map(a => `<span class="mchip cat-${catKey(a.category)} ${a.completed ? 'completed' : ''}" data-edit="${a.id}">${esc(a.title)}</span>`).join('')}${acts.length > 3 ? `<span class="mmore">+${acts.length - 3} more</span>` : ''}<span class="month-dots">${acts.slice(0, 6).map(a => `<i class="cat-${catKey(a.category)}" style="background:var(--cat)"></i>`).join('')}</span></div>`;
    }).join('')}</div></div>`;
  }
  if (scroll && view !== 'month' && !isMobile()) {
    const col = surface.querySelector('.tg-col'); const sh = col ? Number(col.dataset.sh) : 7;
    const nowM = new Date().getHours() * 60 + new Date().getMinutes();
    const showsToday = $$('.tg-col', surface).some(c => c.dataset.date === toISO(today));
    surface.scrollTop = Math.max(0, ((showsToday ? nowM - 120 : 7 * 60 + 30) - sh * 60) * HPX / 60);
  }
}
function tickNowLine() {
  if (toISO(new Date()) !== toISO(today)) { today = new Date(); refresh(); return; }
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  $$('.now-line').forEach(l => { l.style.top = (nowM - Number(l.dataset.sh) * 60) * HPX / 60 + 'px'; });
  if (state.page === 'dashboard') renderDashboard();
}

/* ---------- activities ---------- */
function openActivity(a = null, category = 'Academic', preset = {}) {
  const f = $('activityForm'); f.reset(); clearErrors(f);
  $('activityId').value = a?.id || '';
  $('activityModalTitle').textContent = a ? 'Edit activity' : 'Add activity';
  $('activityTitle').value = a?.title || '';
  $('activityCategory').value = a?.category || category;
  $('activityDate').value = a?.date || preset.date || toISO(state.page === 'schedule' ? (state.cursor || today) : today);
  $('activityStart').value = a?.start || preset.start || '09:00';
  $('activityEnd').value = a?.end || preset.end || '10:00';
  $('activityLocation').value = a?.location || ''; $('activityNotes').value = a?.notes || '';
  $('activityCompleted').checked = !!a?.completed;
  $('deleteActivity').classList.toggle('hidden', !a);
  updateActivityConflict(); openModal('activityModal');
}
const overlaps = (a, b) => a.date === b.date && timeMins(a.start) < timeMins(b.end) && timeMins(a.end) > timeMins(b.start);
function formActivity() { return { id: $('activityId').value || uid(), title: $('activityTitle').value.trim(), category: $('activityCategory').value, date: $('activityDate').value, start: $('activityStart').value, end: $('activityEnd').value, location: $('activityLocation').value.trim(), notes: $('activityNotes').value.trim(), completed: $('activityCompleted').checked }; }
function updateActivityConflict() {
  const a = formActivity(), box = $('activityConflict');
  if (!a.date || !a.start || !a.end || timeMins(a.end) <= timeMins(a.start)) { box.hidden = true; return; }
  const c = state.activities.filter(x => x.id !== $('activityId').value && overlaps(a, x));
  box.hidden = !c.length;
  if (c.length) box.innerHTML = icon('alert') + `<span>Overlaps with ${c.map(x => `<b>${esc(x.title)}</b> (${x.start}–${x.end})`).join(', ')}.</span>`;
}
['activityDate', 'activityStart', 'activityEnd'].forEach(id => $(id).addEventListener('input', () => { setError('activityEnd', ''); updateActivityConflict(); }));
$('activityTitle').addEventListener('input', () => setError('activityTitle', ''));
$('activityForm').addEventListener('submit', async e => {
  e.preventDefault();
  const a = formActivity(), id = $('activityId').value; let bad = false;
  setError('activityTitle', ''); setError('activityDate', ''); setError('activityStart', ''); setError('activityEnd', '');
  if (!a.title) { setError('activityTitle', 'Give this activity a name.'); bad = true; }
  if (!a.date) { setError('activityDate', 'Choose a date.'); bad = true; }
  if (!a.start) { setError('activityStart', 'Set a start time.'); bad = true; }
  if (!a.end) { setError('activityEnd', 'Set an end time.'); bad = true; }
  else if (a.start && timeMins(a.end) <= timeMins(a.start)) { setError('activityEnd', 'End time must be later than start time.'); bad = true; }
  if (bad) { const f = $('activityForm').querySelector('.invalid input'); f && f.focus(); return; }
  const conflicts = state.activities.filter(x => x.id !== id && overlaps(a, x));
  if (conflicts.length && !(await confirmDialog({ title: 'This overlaps another activity', message: `“${a.title}” overlaps with ${conflicts.map(x => x.title).join(', ')}. Save it anyway?`, confirm: 'Save anyway' }))) return;
  if (id) state.activities = state.activities.map(x => x.id === id ? a : x); else state.activities.push(a);
  save(); closeModal('activityModal'); refresh(); toast(id ? 'Activity updated.' : 'Activity added to your schedule.');
});
$('deleteActivity').addEventListener('click', async () => {
  const id = $('activityId').value, a = state.activities.find(x => x.id === id); if (!a) return;
  if (await confirmDialog({ title: 'Delete this activity?', message: `“${a.title}” will be removed from your schedule.`, confirm: 'Delete', danger: true })) {
    state.activities = state.activities.filter(x => x.id !== id); save(); closeModal('activityModal'); refresh(); toast('Activity deleted.');
  }
});
function toggleComplete(id) {
  const a = state.activities.find(x => x.id === id); if (!a) return;
  a.completed = !a.completed; state.justToggled = a.completed ? id : null; save(); refresh(); state.justToggled = null;
}

/* ---------- templates ---------- */
const daysOf = t => [...new Set(t.items.map(i => Number(i.day)))].sort((a, b) => a - b);
function daysLabel(t) {
  const d = daysOf(t); if (!d.length) return 'No days';
  if (d.length === 7) return 'Every day';
  if (d.length > 2 && d[d.length - 1] - d[0] === d.length - 1) return `${DAY3[d[0]]}–${DAY3[d[d.length - 1]]}`;
  return d.map(x => DAY3[x]).join(', ');
}
function relDate(ts) {
  const d = new Date(ts); if (isNaN(d)) return '—';
  const diff = Math.round((new Date(toISO(today)) - new Date(toISO(d))) / 864e5);
  if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday';
  return fmt(d, d.getFullYear() === today.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}
function distHTML(t) {
  const cols = Array.from({ length: 7 }, (_, i) => `<div class="dist-col">${t.items.filter(x => Number(x.day) === i + 1).map(x => { const s = timeMins(x.start), e = timeMins(x.end), top = Math.min(94, Math.max(0, (s - 360) / 960 * 100)), h = Math.max(7, (e - s) / 960 * 100); return `<i class="cat-${catKey(x.category || t.category)}" style="top:${top}%;height:${h}%"></i>`; }).join('')}</div>`).join('');
  return `<div class="dist" aria-hidden="true">${cols}</div><div class="dist-days" aria-hidden="true">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => `<span>${x}</span>`).join('')}</div>`;
}
function renderTemplates() {
  const q = state.templateSearch.toLowerCase(), cat = state.templateCategory;
  const list = state.templates.filter(t => (cat === 'All' || (cat === 'Favorites' ? t.favorite : t.category === cat)) && `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q));
  $('allTemplateCount').textContent = state.templates.length;
  $$('[data-template-category]').forEach(b => b.classList.toggle('active', b.dataset.templateCategory === cat));
  $('templateGrid').innerHTML = list.length ? list.map(t => `<article class="tcard cat-${catKey(t.category)}" data-preview="${t.id}" tabindex="0" role="button" aria-label="Preview ${attr(t.name)}">
    <div class="tcard-top"><span class="cat-pill"><i></i>${esc(t.category)}</span><button class="star ${t.favorite ? 'active' : ''}" data-favorite="${t.id}" aria-pressed="${!!t.favorite}" aria-label="${t.favorite ? 'Remove from favorites' : 'Add to favorites'}">${icon('star')}</button></div>
    <h3>${esc(t.name)}</h3><p>${esc(t.description || 'A reusable schedule template.')}</p>${distHTML(t)}
    <dl class="tmeta"><div><dt>Activities</dt><dd>${t.items.length}</dd></div><div><dt>Days</dt><dd>${daysLabel(t)}</dd></div><div><dt>Modified</dt><dd>${relDate(t.updated)}</dd></div></dl>
    <div class="tcard-actions"><button class="btn primary sm" data-apply="${t.id}">Apply</button><button class="icon-btn" data-edit-template="${t.id}" title="Edit" aria-label="Edit template">${icon('pencil')}</button><button class="icon-btn" data-duplicate="${t.id}" title="Duplicate" aria-label="Duplicate template">${icon('copy')}</button><button class="icon-btn danger-hover" data-delete-template="${t.id}" title="Delete" aria-label="Delete template">${icon('trash')}</button></div></article>`).join('')
    : `<div class="empty-state"><strong>${state.templates.length ? 'No templates match' : 'No templates yet'}</strong>${state.templates.length ? 'Try another category or search term.' : 'Create one, or save your current week as a template.'}</div>`;
}
function openTemplate(t = null, initialItems = null) {
  const f = $('templateForm'); f.reset(); clearErrors(f); $('templateError').textContent = '';
  $('templateId').value = t?.id || ''; $('templateModalTitle').textContent = t ? 'Edit template' : 'New template';
  $('templateName').value = t?.name || ''; $('templateCategory').value = t?.category || 'Academic'; $('templateDescription').value = t?.description || '';
  renderTemplateEditor(initialItems || t?.items || []); openModal('templateModal');
}
const EMPTY_ROWS = '<div class="empty-state">No activities yet. Add one to build your template.</div>';
function renderTemplateEditor(items) { const root = $('templateActivityEditor'); root.innerHTML = items.length ? '' : EMPTY_ROWS; items.forEach(it => addTemplateRow(it)); updateTemplateCount(); }
function addTemplateRow(it = { day: 1, title: '', category: $('templateCategory').value, start: '09:00', end: '10:00', location: '' }) {
  const root = $('templateActivityEditor'); root.querySelector('.empty-state')?.remove();
  const row = document.createElement('div'); row.className = 'template-activity-row';
  row.innerHTML = `<input aria-label="Activity title" placeholder="Activity name" value="${attr(it.title || '')}"><select aria-label="Day">${DAY3.slice(1).map((d, i) => `<option value="${i + 1}" ${Number(it.day) === i + 1 ? 'selected' : ''}>${d}</option>`).join('')}</select><input aria-label="Start time" type="time" value="${it.start || '09:00'}"><input aria-label="End time" type="time" value="${it.end || '10:00'}"><button type="button" class="icon-btn danger-hover" title="Remove activity" aria-label="Remove activity">${icon('x')}</button>`;
  row.querySelector('button').addEventListener('click', () => { row.remove(); if (!root.children.length) root.innerHTML = EMPTY_ROWS; updateTemplateCount(); });
  row.dataset.category = it.category || $('templateCategory').value; row.dataset.location = it.location || ''; row.dataset.notes = it.notes || '';
  root.appendChild(row); updateTemplateCount();
  if (!it.title) row.firstElementChild.focus();
}
function updateTemplateCount() { const n = $$('.template-activity-row', $('templateActivityEditor')).length; $('templateActivityCount').textContent = `${n} ${n === 1 ? 'activity' : 'activities'}`; }
function collectTemplateItems() { return $$('.template-activity-row', $('templateActivityEditor')).map(r => ({ title: r.children[0].value.trim(), day: Number(r.children[1].value), start: r.children[2].value, end: r.children[3].value, category: r.dataset.category || $('templateCategory').value, location: r.dataset.location || '', notes: r.dataset.notes || '', _row: r })).filter(x => x.title); }
$('addTemplateActivity').addEventListener('click', () => addTemplateRow());
$('templateName').addEventListener('input', () => setError('templateName', ''));
$('templateForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('templateId').value, name = $('templateName').value.trim(), items = collectTemplateItems();
  setError('templateName', ''); $('templateError').textContent = ''; $$('.template-activity-row .invalid').forEach(x => x.classList.remove('invalid'));
  if (!name) { setError('templateName', 'Give this template a name.'); $('templateName').focus(); return; }
  if (!items.length) { $('templateError').textContent = 'Add at least one activity with a name.'; return; }
  const bad = items.filter(x => !x.start || !x.end || timeMins(x.end) <= timeMins(x.start));
  if (bad.length) { bad.forEach(x => x._row.querySelectorAll('input[type=time]').forEach(i => i.classList.add('invalid'))); $('templateError').textContent = 'Each activity needs an end time after its start time.'; return; }
  const old = state.templates.find(t => t.id === id);
  const t = { id: id || uid(), name, category: $('templateCategory').value, description: $('templateDescription').value.trim(), items: items.map(({ _row, ...rest }) => rest), favorite: old?.favorite || false, updated: Date.now() };
  if (id) state.templates = state.templates.map(x => x.id === id ? t : x); else state.templates.unshift(t);
  save(); closeModal('templateModal'); renderTemplates(); renderDashboard(); toast(id ? 'Template updated.' : 'Template saved to your library.');
});
function saveCurrentAsTemplate() {
  const mon = startOfWeek(state.cursor || today), week = state.activities.filter(a => a.date >= toISO(mon) && a.date <= toISO(addDays(mon, 6)));
  if (!week.length) { toast('There are no activities in this week to save.', 'error'); return; }
  openTemplate(null, week.map(a => ({ day: ((parseDate(a.date).getDay() + 6) % 7) + 1, title: a.title, category: a.category, start: a.start, end: a.end, location: a.location, notes: a.notes })));
  $('templateName').value = 'My weekly schedule'; $('templateCategory').value = 'Custom'; $('templateDescription').value = 'Saved from my current weekly schedule.';
}
function duplicateTemplate(id) {
  const t = state.templates.find(x => x.id === id); if (!t) return;
  const copy = { ...JSON.parse(JSON.stringify(t)), id: uid(), name: `${t.name} (copy)`.slice(0, 60), favorite: false, updated: Date.now() };
  state.templates.unshift(copy); save(); renderTemplates(); renderDashboard(); toast('Template duplicated.');
}
async function deleteTemplate(id) {
  const t = state.templates.find(x => x.id === id); if (!t) return;
  if (await confirmDialog({ title: 'Delete this template?', message: `“${t.name}” will be removed. Activities already created from it stay on your schedule.`, confirm: 'Delete template', danger: true })) {
    state.templates = state.templates.filter(x => x.id !== id); save(); renderTemplates(); renderDashboard(); toast('Template deleted.');
  }
}
function openPreview(id) {
  const t = state.templates.find(x => x.id === id); if (!t) return;
  state.previewId = id;
  const items = t.items.slice().sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  const total = items.reduce((s, x) => s + Math.max(0, timeMins(x.end) - timeMins(x.start)), 0);
  let s = 24, e = 0; items.forEach(x => { s = Math.min(s, Math.floor(timeMins(x.start) / 60)); e = Math.max(e, Math.ceil(timeMins(x.end) / 60)); }); if (!items.length) { s = 8; e = 17; } if (e - s < 6) e = Math.min(24, s + 6); if (e - s < 6) s = e - 6;
  const PH = 24, ph = (e - s) * PH;
  $('previewTitle').textContent = t.name;
  $('previewSub').textContent = t.description || 'Reusable schedule template.';
  const cols = Array.from({ length: 7 }, (_, i) => `<div class="pv-col" style="--ph:${ph}px">${items.filter(x => Number(x.day) === i + 1).map(x => { const top = (timeMins(x.start) - s * 60) * PH / 60, h = Math.max(14, (timeMins(x.end) - timeMins(x.start)) * PH / 60 - 1); return `<div class="pv-block cat-${catKey(x.category || t.category)}" style="top:${top}px;height:${h}px" title="${attr(x.title)} ${x.start}–${x.end}">${h > 22 ? esc(x.title) : ''}</div>`; }).join('')}</div>`).join('');
  const days = daysOf(t);
  $('previewContent').innerHTML = `<div class="pv-stats"><div><small>Category</small><strong>${esc(t.category)}</strong></div><div><small>Activities</small><strong>${items.length}</strong></div><div><small>Days</small><strong>${daysLabel(t)}</strong></div><div><small>Total time</small><strong>${fmtDur(total)}</strong></div></div>
  <div class="pv-grid"><div class="hd empty"></div>${DAY3.slice(1).map((d, i) => `<div class="hd ${days.includes(i + 1) ? '' : 'empty'}">${d}</div>`).join('')}<div class="pv-times" style="--ph:${ph}px">${Array.from({ length: e - s }, (_, i) => i ? `<span style="top:${i * PH}px">${pad(s + i)}</span>` : '').join('')}</div>${cols}</div>
  ${days.map(d => `<div class="pv-day"><h4>${DAYFULL[d]}</h4>${items.filter(x => Number(x.day) === d).map(x => `<div class="pv-item cat-${catKey(x.category || t.category)}"><i></i><div><strong>${esc(x.title)}</strong>${x.location ? `<small>${esc(x.location)}</small>` : ''}</div><time>${x.start} – ${x.end}</time></div>`).join('')}</div>`).join('')}`;
  openModal('previewModal');
}

/* ---------- apply template (3 steps) ---------- */
function targetActivities(template) {
  const start = parseDate($('applyStartDate').value), freq = $('applyFrequency').value;
  const days = $$('#applyDays input:checked').map(x => Number(x.value)); const targets = []; const weeks = freq === 'four' ? 4 : 1;
  for (let w = 0; w < weeks; w++) for (const item of template.items) {
    let date;
    if (freq === 'single') date = addDays(start, 0);
    else { date = addDays(startOfWeek(start), (item.day - 1) + w * 7); if (!days.includes(item.day % 7)) continue; }
    targets.push({ ...item, date: toISO(date) });
  }
  return targets;
}
function analyzeApply() {
  const t = state.templates.find(x => x.id === $('applyTemplateId').value);
  if (!t || !$('applyStartDate').value) return null;
  const targets = targetActivities(t), dates = [...new Set(targets.map(x => x.date))].sort(), replace = $('applyMode').value === 'replace';
  const existing = replace ? state.activities.filter(a => !dates.includes(a.date)) : state.activities;
  const removed = replace ? state.activities.filter(a => dates.includes(a.date)).length : 0;
  const conflicts = []; targets.forEach(a => existing.forEach(old => { if (overlaps(a, old)) conflicts.push({ a, old }); }));
  return { t, targets, dates, replace, removed, conflicts };
}
function applySummaryHTML() {
  const t = state.templates.find(x => x.id === $('applyTemplateId').value);
  $('applySummary').innerHTML = t ? `<strong>${esc(t.name)}</strong>${t.items.length} activities · ${daysLabel(t)} · ${esc(t.category)}` : 'Choose a template.';
}
function setApplyStep(n) {
  state.applyStep = n;
  $$('#applyModal .step').forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
  $$('#applyStepper li').forEach((li, i) => { li.classList.toggle('active', i + 1 === n); li.classList.toggle('done', i + 1 < n); });
  $('applyBack').hidden = n === 1; $('applyNext').hidden = n === 3; $('applySubmit').hidden = n !== 3;
  if (n === 3) renderApplyReview();
}
function renderApplyReview() {
  const r = analyzeApply(); if (!r) return;
  const range = r.dates.length ? (r.dates.length === 1 ? fmt(parseDate(r.dates[0]), { month: 'short', day: 'numeric' }) : `${fmt(parseDate(r.dates[0]))} – ${fmt(parseDate(r.dates[r.dates.length - 1]))}`) : '—';
  $('reviewStats').innerHTML = `<div><span>Template</span><b>${esc(r.t.name)}</b></div><div><span>Dates</span><b>${range}</b></div><div><span>Existing activities</span><b>${r.replace ? 'Replace' : 'Merge'}</b></div><div><span>Activities to add</span><b>${r.targets.length}</b></div>${r.replace ? `<div><span>Activities removed</span><b>${r.removed}</b></div>` : ''}`;
  const n = r.conflicts.length;
  $('conflictPreview').innerHTML = n ? `<div class="cp-head warn">${icon('alert')}${n} possible time conflict${n > 1 ? 's' : ''}</div><ul class="cp-list">${r.conflicts.slice(0, 20).map(c => `<li><b>${esc(c.a.title)}</b> overlaps <b>${esc(c.old.title)}</b> · ${fmt(parseDate(c.a.date), { weekday: 'short', month: 'short', day: 'numeric' })} ${c.old.start}–${c.old.end}</li>`).join('')}</ul><p class="cp-note">You can still apply and adjust them in your calendar.${r.replace ? '' : ' Choose Replace to clear those days first.'}</p>`
    : `<div class="cp-head ok">${icon('check')}No time conflicts with your existing activities</div>`;
}
function openApply(id) {
  const t = state.templates.find(x => x.id === id); if (!t) return;
  $('applyTemplateId').innerHTML = state.templates.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join(''); $('applyTemplateId').value = id;
  $('applyStartDate').value = toISO(state.cursor || today); clearErrors($('applyForm'));
  setSeg('applyFrequency', 'week'); setSeg('applyMode', 'merge');
  $$('#applyDays input').forEach(x => x.checked = true); $('applyDays').style.display = '';
  applySummaryHTML(); setApplyStep(1); openModal('applyModal');
}
function setSeg(inputId, value) { $(inputId).value = value; $$(`[data-seg="${inputId}"] button`).forEach(b => b.classList.toggle('active', b.dataset.value === value)); if (inputId === 'applyFrequency') $('applyDays').style.display = value === 'single' ? 'none' : ''; }
$$('[data-seg]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (b) setSeg(g.dataset.seg, b.dataset.value); }));
$('applyTemplateId').addEventListener('change', applySummaryHTML);
$('applyNext').addEventListener('click', () => {
  if (state.applyStep === 2) {
    setError('applyStartDate', '');
    if (!$('applyStartDate').value) { setError('applyStartDate', 'Choose a start date.'); return; }
    const r = analyzeApply(); if (!r || !r.targets.length) { toast('Select at least one day to apply.', 'error'); return; }
  }
  setApplyStep(Math.min(3, state.applyStep + 1));
});
$('applyBack').addEventListener('click', () => setApplyStep(Math.max(1, state.applyStep - 1)));
$('applyForm').addEventListener('submit', e => {
  e.preventDefault();
  if (state.applyStep < 3) { $('applyNext').click(); return; }
  const r = analyzeApply(); if (!r) return;
  if (!r.targets.length) { toast('Select at least one day to apply.', 'error'); return; }
  if (r.replace) state.activities = state.activities.filter(a => !r.dates.includes(a.date));
  const added = r.targets.map(x => ({ id: uid(), title: x.title, category: x.category || r.t.category, date: x.date, start: x.start, end: x.end, location: x.location || '', notes: x.notes || '', completed: false }));
  state.activities.push(...added); save(); closeModal('applyModal'); state.cursor = parseDate($('applyStartDate').value); refresh();
  toast(`${added.length} activities added to your schedule.`);
});

/* ---------- planners ---------- */
function renderPlanner(page) {
  const [cat, desc] = PLANNERS[page], root = $(`${page}Content`), iso = toISO(today);
  const acts = state.activities.filter(a => a.category === cat).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  if (!acts.length) { root.innerHTML = `<div class="empty-state"><strong>Your ${cat.toLowerCase()} plan starts here</strong>${desc}. Add an activity or apply a saved template.<br><button class="btn secondary" data-goto="templates">Browse templates</button></div>`; return; }
  const up = acts.filter(a => a.date >= iso), past = acts.filter(a => a.date < iso).reverse();
  const row = a => `<div class="agenda-row cat-${catKey(cat)} ${a.completed ? 'done' : ''}" data-edit="${a.id}"><button class="check ${a.completed ? 'done' : ''} ${state.justToggled === a.id ? 'pop' : ''}" data-toggle="${a.id}" aria-label="${a.completed ? 'Mark as not done' : 'Mark as done'}" aria-pressed="${!!a.completed}">${icon('check')}</button><span class="agenda-bar"></span><span class="agenda-text"><span class="agenda-title">${esc(a.title)}</span><span class="agenda-meta">${fmt(parseDate(a.date), { weekday: 'short', month: 'short', day: 'numeric' })}${a.location ? ' · ' + esc(a.location) : ''}</span></span><span class="when">${a.start} – ${a.end}</span></div>`;
  root.innerHTML = (up.length ? `<section class="planner-group"><h2>Upcoming <span>${up.length}</span></h2><div class="agenda">${up.map(row).join('')}</div></section>` : '') + (past.length ? `<section class="planner-group"><h2>Earlier <span>${past.length}</span></h2><div class="agenda">${past.map(row).join('')}</div></section>` : '');
}

/* ---------- search ---------- */
let searchItems = [], searchIdx = 0;
function openSearch() { $('searchInput').value = ''; renderSearch(); openModal('searchModal'); }
function renderSearch() {
  const q = $('searchInput').value.trim().toLowerCase(); searchItems = [];
  const match = s => !q || s.toLowerCase().includes(q);
  Object.entries(PAGE_NAMES).filter(([, n]) => match(n)).slice(0, q ? 9 : 5).forEach(([k, n]) => searchItems.push({ g: 'Go to', icon: 'arrow-right', title: n, run: () => setPage(k) }));
  if (q) {
    state.activities.filter(a => match(`${a.title} ${a.location} ${a.category}`)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6).forEach(a => searchItems.push({ g: 'Activities', cat: a.category, title: a.title, meta: `${fmt(parseDate(a.date))} ${a.start}`, run: () => openActivity(a) }));
    state.templates.filter(t => match(`${t.name} ${t.description} ${t.category}`)).slice(0, 4).forEach(t => searchItems.push({ g: 'Templates', cat: t.category, title: t.name, meta: `${t.items.length} activities`, run: () => openPreview(t.id) }));
  }
  searchIdx = 0; paintSearch();
}
function paintSearch() {
  if (!searchItems.length) { $('searchResults').innerHTML = '<div class="empty-state"><strong>No results</strong>Try a different word.</div>'; return; }
  let last = '', html = '';
  searchItems.forEach((it, i) => { if (it.g !== last) { html += `<div class="sr-group">${it.g}</div>`; last = it.g; } html += `<button class="sr-item ${i === searchIdx ? 'active' : ''} ${it.cat ? 'cat-' + catKey(it.cat) : ''}" data-sr="${i}"><span class="row-icon">${it.cat ? catIcon(it.cat) : icon(it.icon)}</span><span>${esc(it.title)}</span>${it.meta ? `<small>${esc(it.meta)}</small>` : ''}</button>`; });
  $('searchResults').innerHTML = html; $('searchResults').querySelector('.active')?.scrollIntoView({ block: 'nearest' });
}
function runSearch(i) { const it = searchItems[i]; if (!it) return; closeModal('searchModal'); setTimeout(it.run, 60); }
$('searchInput').addEventListener('input', renderSearch);
$('searchInput').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); searchIdx = Math.min(searchItems.length - 1, searchIdx + 1); paintSearch(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); searchIdx = Math.max(0, searchIdx - 1); paintSearch(); }
  else if (e.key === 'Enter') { e.preventDefault(); runSearch(searchIdx); }
});
$('searchResults').addEventListener('click', e => { const b = e.target.closest('[data-sr]'); if (b) runSearch(Number(b.dataset.sr)); });

/* ---------- refresh ---------- */
function refresh() {
  renderDashboard();
  if (state.page === 'schedule') renderCalendar();
  if (state.page === 'templates') renderTemplates();
  if (PLANNERS[state.page]) renderPlanner(state.page);
}

/* ---------- global interactions ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const toggle = t.closest('[data-toggle]'); if (toggle) { e.stopPropagation(); toggleComplete(toggle.dataset.toggle); return; }
  const goto = t.closest('[data-goto]'); if (goto) { e.preventDefault(); setPage(goto.dataset.goto); return; }
  const addCat = t.closest('[data-add-category]'); if (addCat) { openActivity(null, addCat.dataset.addCategory); return; }
  const day = t.closest('[data-day]'); if (day) { state.cursor = parseDate(day.dataset.day); state.view = 'day'; setPage('schedule'); return; }
  const qa = t.closest('[data-quick-apply]'); if (qa) { openApply(qa.dataset.quickApply); return; }
  const edit = t.closest('[data-edit]'); if (edit) { const a = state.activities.find(x => x.id === edit.dataset.edit); if (a) openActivity(a); return; }
});
$$('.nav-item[data-page]').forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));
$('dashboardAdd').addEventListener('click', () => openActivity());
$('scheduleAdd').addEventListener('click', () => openActivity());
$('sidebarQuickAdd').addEventListener('click', () => { setSidebarOpen(false); openActivity(); });
$('createTemplate').addEventListener('click', () => openTemplate());
$('saveCurrentSchedule').addEventListener('click', saveCurrentAsTemplate);
$('templateSearch').addEventListener('input', e => { state.templateSearch = e.target.value; renderTemplates(); });
$('templateTabs').addEventListener('click', e => { const b = e.target.closest('[data-template-category]'); if (!b) return; state.templateCategory = b.dataset.templateCategory; renderTemplates(); });
$('templateGrid').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) {
    e.stopPropagation();
    if (b.dataset.favorite) { const t = state.templates.find(x => x.id === b.dataset.favorite); t.favorite = !t.favorite; save(); renderTemplates(); renderDashboard(); }
    else if (b.dataset.apply) openApply(b.dataset.apply);
    else if (b.dataset.editTemplate) openTemplate(state.templates.find(x => x.id === b.dataset.editTemplate));
    else if (b.dataset.duplicate) duplicateTemplate(b.dataset.duplicate);
    else if (b.dataset.deleteTemplate) deleteTemplate(b.dataset.deleteTemplate);
    return;
  }
  const card = e.target.closest('[data-preview]'); if (card) openPreview(card.dataset.preview);
});
$('templateGrid').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-preview]')) { e.preventDefault(); openPreview(e.target.dataset.preview); } });
$('previewEdit').addEventListener('click', () => { const t = state.templates.find(x => x.id === state.previewId); closeModal('previewModal'); openTemplate(t); });
$('previewApply').addEventListener('click', () => { const id = state.previewId; closeModal('previewModal'); openApply(id); });
$$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
$$('.modal-backdrop').forEach(m => m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m.id); }));
$('mobileMenu').addEventListener('click', () => setSidebarOpen(!$('sidebar').classList.contains('open')));
$('scrim').addEventListener('click', () => setSidebarOpen(false));
$('collapseSidebar').addEventListener('click', () => { prefs.sidebar = prefs.sidebar === 'collapsed' ? 'expanded' : 'collapsed'; savePrefs(); applySidebar(); });
$('themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
$$('[data-theme-choice]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.themeChoice)));
$('openSearch').addEventListener('click', openSearch); $('topSearch').addEventListener('click', openSearch);

// Calendar controls
$$('.view-btn').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; renderCalendar(true); }));
const step = dir => { state.cursor = state.view === 'day' ? addDays(state.cursor, dir) : state.view === 'week' ? addDays(state.cursor, 7 * dir) : new Date(state.cursor.getFullYear(), state.cursor.getMonth() + dir, 1); renderCalendar(true); };
$('prevPeriod').addEventListener('click', () => step(-1)); $('nextPeriod').addEventListener('click', () => step(1));
$('goToday').addEventListener('click', () => { state.cursor = new Date(today); renderCalendar(true); });
$('categoryFilter').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if (!b) return; state.filter = b.dataset.filter; renderCalendar(); });
$('calendarSurface').addEventListener('click', e => {
  if (e.target.closest('[data-edit],[data-toggle]')) return; // handled globally
  const cell = e.target.closest('.month-cell');
  if (cell) { state.cursor = parseDate(cell.dataset.date); state.view = 'day'; renderCalendar(true); return; }
  const col = e.target.closest('.tg-col');
  if (col && e.target === col) {
    const y = e.clientY - col.getBoundingClientRect().top, mins = Math.floor((y / HPX * 60 + Number(col.dataset.sh) * 60) / 30) * 30;
    const s = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`, en = mins + 60, e2 = `${pad(Math.min(23, Math.floor(en / 60)))}:${pad(en >= 1440 ? 59 : en % 60)}`;
    openActivity(null, state.filter === 'all' ? 'Academic' : state.filter, { date: col.dataset.date, start: s, end: e2 });
  }
});
$('calendarSurface').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.event')) { e.preventDefault(); e.target.click(); } });
window.matchMedia('(max-width:720px)').addEventListener?.('change', () => { if (state.page === 'schedule') renderCalendar(true); });

// Data
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
$('backupData').addEventListener('click', () => { downloadBlob(new Blob([JSON.stringify({ activities: state.activities, templates: state.templates }, null, 2)], { type: 'application/json' }), 'dayform-backup.json'); toast('Backup downloaded.'); });
$('resetData').addEventListener('click', async () => {
  if (await confirmDialog({ title: 'Reset this workspace?', message: 'Your current activities and templates will be replaced with the original sample data.', confirm: 'Reset workspace', danger: true })) { localStorage.removeItem(STORAGE_KEY); sampleData(); refresh(); toast('Sample workspace restored.'); }
});
$('exportButton').addEventListener('click', () => {
  const start = state.view === 'day' ? new Date(state.cursor) : state.view === 'week' ? startOfWeek(state.cursor) : new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1);
  const end = state.view === 'day' ? start : state.view === 'week' ? addDays(start, 6) : new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 0);
  const acts = state.activities.filter(a => a.date >= toISO(start) && a.date <= toISO(end)).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const rows = acts.map(a => `<tr><td>${esc(fmt(parseDate(a.date), { weekday: 'short', month: 'short', day: 'numeric' }))}</td><td>${esc(a.start)}–${esc(a.end)}</td><td>${esc(a.title)}</td><td>${esc(a.category)}</td><td>${esc(a.location || '')}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dayform schedule</title><style>body{font:14px system-ui,Arial;padding:35px;color:#1b1b1f}h1{font-size:24px;margin:0}p{color:#777}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{text-align:left;border-bottom:1px solid #ddd;padding:10px}th{background:#f3f2ef;font-weight:600}</style></head><body><h1>Dayform schedule</h1><p>${fmt(start, { month: 'long', day: 'numeric', year: 'numeric' })}${toISO(start) !== toISO(end) ? ' – ' + fmt(end, { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p><table><thead><tr><th>Date</th><th>Time</th><th>Activity</th><th>Category</th><th>Location</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No activities</td></tr>'}</tbody></table></body></html>`;
  const w = window.open('', '_blank'); if (!w) { toast('Allow pop-ups to print or save this schedule.', 'error'); return; }
  w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
});

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalStack.length) { closeModal(modalStack[modalStack.length - 1]); return; }
  if (e.key === 'Escape' && $('sidebar').classList.contains('open')) { setSidebarOpen(false); return; }
  if (e.key === 'Tab' && modalStack.length) { // keep focus inside the top modal
    const m = $(modalStack[modalStack.length - 1]), f = $$('button:not([hidden]):not([disabled]),input:not([type=hidden]):not([disabled]),select,textarea,[tabindex="0"]', m).filter(x => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modalStack.includes('searchModal') ? closeModal('searchModal') : (!modalStack.length && openSearch()); return; }
  if (!typing && !modalStack.length && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); openActivity(); }
});

/* ---------- init ---------- */
loadPrefs(); applyTheme(); applySidebar(); load();
renderDashboard(); setPage('dashboard');
setInterval(tickNowLine, 60000);
