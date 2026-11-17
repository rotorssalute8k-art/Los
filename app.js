// Los! – App-Oberfläche. Alle Daten bleiben lokal auf dem Handy.
import {
  uid, MIN, pad, hm, dshort, dlong, dayLabel, toLocalInput, sameDay, eventPlan, tripTotal, learnedTrip, placeKey,
  factorFrom, remainingMin, latestStart, ampelEvent, ampelProject, countdown, inWords, buildIcs, parseIcs, parseProjectFile
} from './logic.js';
import { PERS, ORDER, avatar, say, restartLine, comforter, MOODS } from './personas.js';

const KEY = 'vi-los-v1';
const DEFAULT = () => ({
  settings: {
    names: { prof: 'Prof. Melzer', mina: 'Mina', celine: 'Celine' },
    scolder: 'mina', fmt: 'hm', readyMin: 20, wakeBuffer: 5, arriveEarly: 5,
    bedtime: '23:00', perDay: 120, focusMin: 25, bundle: '', onboarded: false
  },
  events: [], projects: [], promises: [], trips: [], arrivals: [], history: [], sessions: [],
  chat: { prof: [], mina: [], celine: [] },
  moods: { prof: 'neutral', mina: 'neutral', celine: 'good' },
  checklist: ['Kleidung rauslegen', 'Tasche packen (Laptop, Ladekabel)', 'Schlüssel & Parkticket bereitlegen', 'Wecker stellen'],
  evening: {}, // { 'YYYY-MM-DD': [Index erledigt] }
  departed: null, // { eventId, at }
  focus: null // { start, min, stepId, projectId, task, report }
});

let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) { const d = DEFAULT(); return { ...d, ...s, settings: { ...d.settings, ...s.settings, names: { ...d.settings.names, ...(s.settings || {}).names } } }; }
  } catch (e) { /* neu anfangen */ }
  return DEFAULT();
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

// ---------- Helfer ----------
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (who) => esc(state.settings.names[who] || who);
const S = () => state.settings;
const dk = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };

const ICON = {
  heute: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  cd: '<rect x="7" y="2" width="10" height="20" rx="4"/><circle cx="12" cy="7" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="17" r="1.4"/>',
  fokus: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  team: '<path d="M4 5h16v11H9l-5 4z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.9.3 5 2.6 5 5.8"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  car: '<path d="M5 16l1.5-5h11L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
};
const svg = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

function toast(t) {
  const el = $('#toast');
  el.textContent = t;
  el.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => el.classList.remove('show'), 2600);
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- Chat ----------
function post(who, text, extra = {}) {
  state.chat[who].push({ id: uid(), from: who, text, at: Date.now(), ...extra });
  state.chat[who] = state.chat[who].slice(-80);
}
function me(who, text) { post(who, text, { me: true }); }
function slip(who, kind, ctx) {
  // Ausrutscher: zuständige Figur reagiert (nur die Schimpferin schimpft), danach Neustart-Angebot
  const sc = S().scolder;
  post(who, say(who, kind, ctx, sc));
  state.moods[who] = who === sc ? 'bad' : 'sad';
  if (sc && sc !== who) { post(sc, say(sc, kind, ctx, sc)); state.moods[sc] = 'bad'; }
  // Neustart im selben Chat, wenn diese Figur nicht schimpft – sonst bei der Trösterin
  post(who !== sc ? who : comforter(sc), restartLine(), { restart: true });
}

// ---------- Daten ableiten ----------
const factor = () => factorFrom(state.history);
function upcomingEvents(now = Date.now()) {
  return state.events.filter((e) => e.start > now - 30 * MIN).sort((a, b) => a.start - b.start);
}
function openProjects() {
  return state.projects.filter((p) => p.steps.some((s) => !s.done));
}
function projectInfo(p) {
  const f = factor();
  const ls = latestStart(p, f, +S().perDay);
  return { ls, amp: ampelProject(ls), rest: remainingMin(p), f };
}
function eventInfo(e) {
  const pl = eventPlan(e, S(), state.trips);
  return { ...pl, amp: ampelEvent(pl.leave) };
}
function headline(e, info, now = Date.now()) {
  const dep = state.departed && state.departed.eventId === e.id;
  if (dep) return 'Unterwegs';
  const ms = info.leave - now;
  if (!info.total) return ms > 0 ? `Fertig ${inWords(ms - (+S().readyMin) * MIN).replace('in ', 'machen in ')}` : 'Gleich geht’s los';
  if (ms <= 0) return 'Jetzt losfahren';
  return `Losfahren ${inWords(ms)}`;
}

// ---------- Router ----------
const routes = {
  heute: viewHeute, termin: viewTermin, 'neu-termin': viewNeuTermin, countdowns: viewCountdowns,
  projekt: viewProjekt, 'neu-projekt': viewNeuProjekt, fokus: viewFokus, team: viewTeam,
  chat: viewChat, rueckblick: viewRueckblick, einstellungen: viewEinstellungen, willkommen: viewWillkommen, abend: viewAbend
};
const TABS = [['heute', 'Heute', 'heute'], ['countdowns', 'Countdowns', 'cd'], ['fokus', 'Fokus', 'fokus'], ['team', 'Team', 'team']];
const TABOF = { termin: 'heute', 'neu-termin': 'countdowns', projekt: 'countdowns', 'neu-projekt': 'countdowns', chat: 'team', rueckblick: 'heute', einstellungen: 'heute', abend: 'heute' };

function route() {
  let [name, arg] = (location.hash.replace(/^#\/?/, '') || 'heute').split('/');
  if (!S().onboarded && name !== 'willkommen') { location.hash = '#/willkommen'; return; }
  if (!routes[name]) name = 'heute';
  $('#view').innerHTML = routes[name](arg ? decodeURIComponent(arg) : undefined);
  const active = TABOF[name] || name;
  $('#tabbar').hidden = name === 'willkommen';
  $('#tabbar').innerHTML = TABS.map(([r, l, i]) => `<a href="#/${r}" ${r === active ? 'aria-current="page"' : ''}>${svg(i)}<span>${l}</span></a>`).join('');
  autosize();
  tick();
}
// Mehrzeilige Felder an den Text anpassen (für ältere iPhones ohne field-sizing)
function autosize(root = document) {
  root.querySelectorAll('textarea.st-title, .wenn textarea').forEach((t) => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; });
}
document.addEventListener('input', (e) => { if (e.target.matches('textarea.st-title, .wenn textarea')) { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; } });
function rerender() {
  const y = window.scrollY;
  route();
  window.scrollTo(0, y);
}

const back = (href, label) => `<a class="back" href="${href}">${svg('back', 18)}${label}</a>`;
const chip = (who) => {
  const m = MOODS[state.moods[who]] || MOODS.neutral;
  return `<a class="mood" href="#/chat/${who}" style="background:${PERS[who].bg};color:${PERS[who].ink}">${avatar(who, 24)}<span>${N(who)} · ${m.label}</span><i style="background:${m.dot}"></i></a>`;
};
const cd = (target, cls = '') => `<span class="cdv ${cls}" data-cd="${target}">${countdown((target - Date.now()) / 1000, S().fmt)}</span>`;

// ---------- HEUTE ----------
function nextFocusItem(now = Date.now()) {
  const ev = upcomingEvents(now).filter((e) => !state.arrivals.some((a) => a.eventId === e.id))[0];
  const evInfo = ev && eventInfo(ev);
  const pr = openProjects().map((p) => ({ p, i: projectInfo(p) })).sort((a, b) => (a.i.ls ?? 9e15) - (b.i.ls ?? 9e15))[0];
  // Termin hat Vorrang, wenn er innerhalb von 36 Std. liegt
  if (ev && (ev.start - now < 36 * 3600000 || !pr)) return { type: 'ev', ev, info: evInfo };
  if (pr) return { type: 'pr', p: pr.p, info: pr.i };
  if (ev) return { type: 'ev', ev, info: evInfo };
  return null;
}

function heroTile(item, now = Date.now()) {
  if (!item) {
    return `<section class="hero gruen"><span class="eyebrow">Alles ruhig</span><h2 class="hero-title">Nichts Dringendes</h2>
      <p class="hero-sub">Trag deinen nächsten Termin oder ein Projekt ein – dann rechnet Los! rückwärts.</p>
      <div class="row"><a class="btn light" href="#/neu-termin">${svg('plus', 18)} Termin</a><a class="btn light" href="#/neu-projekt">${svg('plus', 18)} Projekt</a></div></section>`;
  }
  if (item.type === 'ev') {
    const { ev, info } = item;
    const dep = state.departed && state.departed.eventId === ev.id;
    const span = 3 * 3600000;
    const prog = Math.max(0, Math.min(100, 100 - ((info.leave - now) / span) * 100));
    return `<a class="hero ${info.amp}" href="#/termin/${ev.id}">
      <span class="eyebrow">${dayLabel(ev.start)} · ${hm(ev.start)}${ev.place ? ' · ' + esc(ev.place) : ''}</span>
      <h2 class="hero-title">${esc(ev.title)}</h2>
      <strong class="hero-big">${headline(ev, info, now)}</strong>
      <p class="hero-sub">${dep ? 'Tippe „Angekommen“, sobald du im Raum bist.' : info.total ? `Spätestens ${hm(info.leave)} los · Fahrt insgesamt ${info.total} Min` : 'Ohne Fahrt'}</p>
      <div class="bar"><i style="width:${prog}%"></i></div></a>`;
  }
  const { p, info } = item;
  const late = info.ls != null && info.ls < now;
  return `<a class="hero ${info.amp}" href="#/projekt/${p.id}">
    <span class="eyebrow">${p.due ? 'Abgabe ' + dlong(p.due) : 'Projekt ohne Datum'}</span>
    <h2 class="hero-title">${esc(p.title)}</h2>
    <strong class="hero-big">${info.ls == null ? 'Datum fehlt' : late ? 'Jetzt anfangen' : 'Start ' + inWords(info.ls - now)}</strong>
    <p class="hero-sub">Noch ${String(Math.round(info.rest * info.f / 6) / 10).replace('.', ',')} Std. Arbeit (mit deinem Faktor ×${String(info.f).replace('.', ',')})</p></a>`;
}

function viewHeute() {
  const now = Date.now();
  const item = nextFocusItem(now);
  let plan = '';
  if (item && item.type === 'ev' && item.info.total) {
    const st = item.info.steps;
    const w = st[0], l = st.find((x) => x.kind === 'go'), r = st[st.length - 1];
    plan = `<div class="three">
      <div class="mini"><span>Wecker</span><b>${hm(w.t)}</b></div>
      <div class="mini dark"><span>Losfahren</span><b>${hm(l.t)}</b></div>
      <div class="mini"><span>Im Raum</span><b>${hm(r.t)}</b></div></div>`;
  }
  // Wer spricht?
  let bubbleWho = 'celine', bubble = say('celine', 'hello');
  if (item && item.type === 'ev') {
    const m = Math.round((item.info.leave - now) / MIN);
    bubbleWho = 'mina';
    if (state.departed && state.departed.eventId === item.ev.id) bubble = 'Gute Fahrt! Sag Bescheid, wenn du da bist.';
    else if (m < -2 && item.info.total) bubble = say('mina', 'nudgeLeaveLate', { m }, S().scolder);
    else if (m <= 90) bubble = say('mina', 'nudgeLeave', { m: Math.max(0, m) });
    else bubble = say('mina', 'hello');
  } else if (item && item.type === 'pr') {
    bubbleWho = item.p.persona || 'prof';
    const step = item.p.steps.find((s) => !s.done);
    bubble = say(bubbleWho, 'nudgeStart', { x: step ? step.title : item.p.title });
  }
  const today = new Date(now);
  const promises = state.promises.filter((p) => p.status === 'open').sort((a, b) => a.due - b.due).slice(0, 4);
  const evening = eveningCard(now);
  const projs = openProjects().filter((p) => !(item && item.type === 'pr' && item.p.id === p.id))
    .map((p) => ({ p, i: projectInfo(p) })).sort((a, b) => (a.i.ls ?? 9e15) - (b.i.ls ?? 9e15)).slice(0, 2);
  return `<div class="page">
    <header class="top"><div><span class="muted">${dlong(today)}</span><h1>Heute</h1></div>
      <div class="top-r">${chip(bubbleWho)}<a class="iconbtn" href="#/einstellungen" aria-label="Einstellungen">${svg('gear', 20)}</a></div></header>
    ${heroTile(item, now)}
    ${plan}
    <div class="bubble" style="--pi:${PERS[bubbleWho].ink}">${avatar(bubbleWho, 40, PERS[bubbleWho].bg)}<p><b>${N(bubbleWho)}</b>${esc(bubble)}</p></div>
    ${evening}
    ${promises.length ? `<h3 class="sec">Zusagen</h3><div class="list">${promises.map((p) => `
      <a class="prom" href="#/chat/${p.who}" style="background:${PERS[p.who].bg};color:${PERS[p.who].ink}">${avatar(p.who, 34)}
      <div><b>${esc(p.what)}</b><span>Bericht an ${N(p.who)} · ${dayLabel(p.due) === 'Heute' ? '' : dayLabel(p.due) + ' '}${hm(p.due)}</span></div></a>`).join('')}</div>` : ''}
    ${projs.length ? `<h3 class="sec">Projekte</h3><div class="list">${projs.map(({ p, i }) => `
      <a class="row-item amp-${i.amp}" href="#/projekt/${p.id}"><i class="dot"></i><div><b>${esc(p.title)}</b><span>${i.ls == null ? 'Kein Datum' : i.ls < now ? 'Start überfällig' : 'Start ' + inWords(i.ls - now)}</span></div></a>`).join('')}</div>` : ''}
    <a class="btn red big" href="#/fokus">${svg('fokus', 20)} Fokus starten</a>
    <div class="row links"><a href="#/neu-termin">${svg('plus', 16)} Termin</a><a href="#/neu-projekt">${svg('plus', 16)} Projekt</a><a href="#/rueckblick">${svg('chart', 16)} Rückblick</a></div>
  </div>`;
}

// Abend vor einem Termin: Bettzeit + Vorbereitung (Schlafaufschub vermeiden)
function tomorrowEvent(now = Date.now()) {
  const t = new Date(now); t.setDate(t.getDate() + 1);
  return upcomingEvents(now).find((e) => sameDay(e.start, t));
}
function eveningCard(now = Date.now()) {
  const h = new Date(now).getHours();
  if (h < 17) return '';
  const ev = tomorrowEvent(now);
  if (!ev) return '';
  const info = eventInfo(ev);
  const done = state.evening[dk(now)] || [];
  return `<a class="evening" href="#/abend"><span class="ic">${svg('moon', 20)}</span><div><b>Morgen ${info.wake ? 'Wecker ' + hm(info.wake) : hm(ev.start)}</b>
    <span>Ins Bett um ${esc(S().bedtime)} · Vorbereitung ${done.length}/${state.checklist.length}</span></div></a>`;
}
function viewAbend() {
  const ev = tomorrowEvent();
  const done = state.evening[dk()] || [];
  const info = ev && eventInfo(ev);
  return `<div class="page">${back('#/heute', 'Heute')}
    <h1>Heute Abend</h1>
    <p class="muted">${ev ? `Morgen: ${esc(ev.title)} um ${hm(ev.start)}${info.wake ? ` · Wecker ${hm(info.wake)}` : ''}` : 'Morgen steht kein Termin an.'}</p>
    <section class="tile blue"><span class="eyebrow">Schlafenszeit</span><strong class="tile-big">${esc(S().bedtime)}</strong>
      <p>Wer abends das Ins-Bett-Gehen aufschiebt, kommt morgens schwerer raus. Leg das Handy um ${esc(S().bedtime)} weg.</p></section>
    <h3 class="sec">Für morgen bereitlegen</h3>
    <div class="list">${state.checklist.map((c, i) => `<label class="check"><input type="checkbox" data-chg="evening" data-i="${i}" ${done.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
    <p class="hint">Die Liste änderst du in den Einstellungen.</p></div>`;
}

// ---------- TERMIN ----------
function viewTermin(id) {
  const e = state.events.find((x) => x.id === id);
  if (!e) return `<div class="page">${back('#/heute', 'Heute')}<p>Termin nicht gefunden.</p></div>`;
  const info = eventInfo(e);
  const tt = tripTotal(e, state.trips);
  const dep = state.departed && state.departed.eventId === e.id;
  const arr = state.arrivals.find((a) => a.eventId === e.id);
  return `<div class="page">${back('#/heute', 'Heute')}
    <h1>${esc(e.title)}</h1><span class="muted block">${dshort(e.start)} · ${hm(e.start)}${e.place ? ' · ' + esc(e.place) : ''}</span>
    <section class="card timeline-card"><span class="eyebrow dark">Rückwärts geplant</span>
      <div class="tl">${info.steps.map((s, i) => `
        <span class="tl-t ${s.kind === 'go' ? 'red' : ''}">${hm(s.t)}</span>
        <div class="tl-d"><span class="d ${s.kind}"></span>${i < info.steps.length - 1 ? '<span class="ln"></span>' : ''}</div>
        <div class="tl-x"><b class="${s.kind === 'go' ? 'red' : ''}">${esc(s.label)}</b><span>${esc(s.sub)}</span></div>`).join('')}</div></section>
    ${e.place || e.travel ? `<section class="tile gelb route"><div class="sp"><span class="eyebrow">Strecke ${esc(e.place || '')}</span><strong>${tt.total} Min</strong></div>
      <div class="edit3">
        <label>Maps<input type="number" inputmode="numeric" min="0" value="${e.travel || 0}" data-chg="evField" data-id="${e.id}" data-f="travel"></label>
        <label>Stau +<input type="number" inputmode="numeric" min="0" value="${e.traffic || 0}" data-chg="evField" data-id="${e.id}" data-f="traffic"></label>
        <label>Parken & Weg +<input type="number" inputmode="numeric" min="0" value="${e.park || 0}" data-chg="evField" data-id="${e.id}" data-f="park"></label></div>
      <p>${tt.learned ? `Gelernt aus ${tt.learned.n} Fahrt${tt.learned.n > 1 ? 'en' : ''}: im Schnitt ${tt.learned.min} Min bis in den Raum. Los! plant mit dem höheren Wert.` : 'Noch keine Fahrten gelernt – tippe „Ich fahre los“ und „Angekommen“, dann lernt Los! deine echte Fahrzeit.'}</p></section>` : ''}
    <div class="stack">
      ${arr ? `<div class="tile ${arr.late > 0 ? 'rot' : 'gruen'}"><b>${arr.late > 0 ? `${arr.late} Min zu spät angekommen` : 'Pünktlich angekommen'}</b></div>`
        : dep ? `<button class="btn red big" data-act="arrived" data-id="${e.id}">${svg('check', 20)} Angekommen (im Raum)</button>`
          : `<button class="btn red big" data-act="depart" data-id="${e.id}">${svg('car', 20)} Ich fahre los</button>
             <button class="btn white" data-act="arrived" data-id="${e.id}">Angekommen (ohne Losfahr-Tipp)</button>`}
      <button class="btn white" data-act="icsOne" data-id="${e.id}">${svg('cal', 18)} Erinnerungen in den Kalender</button>
      <details class="more"><summary>Termin bearbeiten</summary>
        <label class="field">Titel<input value="${esc(e.title)}" data-chg="evField" data-id="${e.id}" data-f="title"></label>
        <label class="field">Beginn<input type="datetime-local" value="${toLocalInput(e.start)}" data-chg="evField" data-id="${e.id}" data-f="start"></label>
        <label class="field">Ort<input value="${esc(e.place || '')}" data-chg="evField" data-id="${e.id}" data-f="place" list="places"></label>
        <button class="btn ghost-red" data-act="delEvent" data-id="${e.id}">${svg('trash', 18)} Termin löschen</button>
      </details>
    </div>${placesList()}</div>`;
}
function placesList() {
  const set = [...new Set(state.events.map((e) => e.place).filter(Boolean))];
  return `<datalist id="places">${set.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>`;
}
function viewNeuTermin() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 15, 0, 0);
  return `<div class="page">${back('#/countdowns', 'Countdowns')}<h1>Neuer Termin</h1>
    <form class="form" data-form="newEvent">
      <label class="field">Was?<input name="title" required placeholder="z. B. Referat Therapyepigenetics"></label>
      <label class="field">Beginn<input name="start" type="datetime-local" required value="${toLocalInput(d)}"></label>
      <label class="field">Ort <small>leer lassen, wenn online</small><input name="place" list="places" placeholder="z. B. Uni Luxemburg" data-chg="placeFill"></label>
      <div class="edit3 plain">
        <label>Fahrt laut Maps<input name="travel" type="number" inputmode="numeric" min="0" placeholder="55"></label>
        <label>Stau-Puffer<input name="traffic" type="number" inputmode="numeric" min="0" value="10"></label>
        <label>Parken & Weg<input name="park" type="number" inputmode="numeric" min="0" value="10"></label></div>
      <button class="btn red big" type="submit">Rückwärts planen</button>
    </form>
    <h3 class="sec">Aus dem Kalender holen</h3>
    <p class="hint">Exportiere Termine als .ics-Datei (z. B. aus Google Kalender oder Outlook im Browser) und wähle sie hier aus.</p>
    <label class="btn white">${svg('cal', 18)} .ics-Datei importieren<input type="file" accept=".ics,text/calendar" class="sr-only" data-chg="importIcs"></label>
    ${placesList()}</div>`;
}

// ---------- COUNTDOWNS ----------
let cdFilter = 'alle';
function viewCountdowns() {
  const now = Date.now();
  const items = [];
  if (cdFilter !== 'abgaben') upcomingEvents(now).forEach((e) => { const i = eventInfo(e); items.push({ t: e.start, amp: i.amp, html: `
    <a class="cdtile ${i.amp}" href="#/termin/${e.id}"><span class="eyebrow">Termin · ${dshort(e.start)} ${hm(e.start)}</span><b>${esc(e.title)}</b>
    <div class="cdrow">${cd(i.total ? i.leave : e.start, 'big')}<span>${i.total ? 'bis Losfahren' : 'bis Beginn'}</span></div></a>` }); });
  if (cdFilter !== 'termine') openProjects().forEach((p) => { const i = projectInfo(p); items.push({ t: i.ls ?? p.due ?? 9e15, amp: i.amp, html: `
    <a class="cdtile ${i.amp}" href="#/projekt/${p.id}"><span class="eyebrow">Abgabe${p.due ? ' · ' + dshort(p.due) : ''}</span><b>${esc(p.title)}</b>
    <div class="cdrow">${p.due ? cd(p.due, 'big') : '<span class="cdv big">–</span>'}<span>bis Abgabe</span></div>
    ${i.ls != null ? `<span class="small">Spätester Start: ${i.ls < now ? 'überfällig' : dshort(i.ls)}</span>` : ''}</a>` }); });
  items.sort((a, b) => a.t - b.t);
  const seg = (k, l, cur, act) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</button>`;
  return `<div class="page"><header class="top"><h1>Countdowns</h1><a class="iconbtn" href="#/neu-termin" aria-label="Neuer Termin">${svg('plus', 20)}</a></header>
    <div class="tabs-u">${seg('alle', 'Alle', cdFilter, 'cdFilter')}${seg('termine', 'Termine', cdFilter, 'cdFilter')}${seg('abgaben', 'Abgaben', cdFilter, 'cdFilter')}</div>
    <div class="segrow"><span class="muted">Anzeige</span><div class="seg">${seg('h', 'Std.', S().fmt, 'fmt')}${seg('hm', 'Std. + Min', S().fmt, 'fmt')}${seg('hms', '+ Sek', S().fmt, 'fmt')}</div></div>
    <div class="list">${items.map((x) => x.html).join('') || '<p class="empty">Noch nichts eingetragen.</p>'}</div>
    <div class="row"><a class="btn white" href="#/neu-termin">${svg('plus', 18)} Termin</a><a class="btn white" href="#/neu-projekt">${svg('plus', 18)} Projekt</a></div>
    <button class="btn white wide" data-act="icsAll">${svg('cal', 18)} Alle Erinnerungen in den Kalender</button>
    <p class="hint">Mehr als 2 Tage entfernt zeigt Los! Tage – so wirkt die Frist näher.</p></div>`;
}

// ---------- PROJEKTE ----------
function viewProjekt(id) {
  const p = state.projects.find((x) => x.id === id);
  if (!p) return `<div class="page">${back('#/countdowns', 'Countdowns')}<p>Projekt nicht gefunden.</p></div>`;
  const i = projectInfo(p);
  const now = Date.now();
  const done = p.steps.filter((s) => s.done).length;
  return `<div class="page">${back('#/countdowns', 'Countdowns')}
    <h1>${esc(p.title)}</h1>
    <section class="tile ${i.amp}"><div class="sp"><span class="eyebrow">${p.due ? 'Abgabe ' + dlong(p.due) + ' · ' + hm(p.due) : 'Abgabedatum fehlt'}</span><span class="eyebrow">${done}/${p.steps.length}</span></div>
      <strong class="tile-big">${i.ls == null ? 'Datum eintragen' : i.ls < now ? 'Jetzt anfangen' : 'Start ' + inWords(i.ls - now)}</strong>
      <p>Noch ${i.rest} Min geschätzt × ${String(i.f).replace('.', ',')} (dein Faktor) ≈ ${String(Math.round(i.rest * i.f / 6) / 10).replace('.', ',')} Std. bei ${S().perDay} Min pro Tag.</p>
      <label class="field inline">Abgabe<input type="datetime-local" value="${p.due ? toLocalInput(p.due) : ''}" data-chg="prDue" data-id="${p.id}"></label></section>
    <h3 class="sec">Kleine Schritte</h3>
    <div class="steps">${p.steps.map((s) => `
      <div class="step ${s.done ? 'done' : ''}">
        <button class="ck" data-act="stepToggle" data-id="${p.id}" data-s="${s.id}" aria-label="erledigt">${s.done ? svg('check', 16) : ''}</button>
        <div class="st-b"><textarea class="st-title" rows="1" data-chg="stepField" data-id="${p.id}" data-s="${s.id}" data-f="title">${esc(s.title)}</textarea>
          <div class="st-meta"><label><input type="number" inputmode="numeric" min="5" step="5" value="${s.min}" data-chg="stepField" data-id="${p.id}" data-s="${s.id}" data-f="min"> Min</label>${s.act ? `<span>echt ${s.act} Min</span>` : ''}</div>
          ${s.ifThen || !s.done ? `<label class="wenn ${s.ifThen ? '' : 'empty'}"><span>Wenn … dann</span><textarea rows="1" placeholder="Wenn …, dann …" data-chg="stepField" data-id="${p.id}" data-s="${s.id}" data-f="ifThen">${esc(s.ifThen)}</textarea></label>` : ''}
          ${s.done ? '' : `<div class="st-act"><a href="#/fokus" data-act="focusStep" data-id="${p.id}" data-s="${s.id}">${svg('fokus', 16)} Fokus</a><button data-act="promiseStep" data-id="${p.id}" data-s="${s.id}">${svg('chat', 16)} ${N(p.persona || 'prof')} zusagen</button><button data-act="stepDel" data-id="${p.id}" data-s="${s.id}" aria-label="Schritt löschen">${svg('trash', 16)}</button></div>`}
        </div></div>`).join('')}</div>
    <form class="addstep" data-form="addStep" data-id="${p.id}"><input name="t" placeholder="Neuer Schritt (klein!)" required><input name="m" type="number" inputmode="numeric" value="30" min="5" step="5" aria-label="Minuten"><button class="btn red" type="submit">${svg('plus', 18)}</button></form>
    <p class="hint">Wenn-dann-Pläne („Wenn X, dann Y“) helfen nachweislich, wirklich anzufangen. Ein Satz pro Schritt reicht.</p>
    <details class="more"><summary>Projekt-Einstellungen</summary>
      <label class="field">Zuständig<select data-chg="prPersona" data-id="${p.id}">${ORDER.map((w) => `<option value="${w}" ${p.persona === w ? 'selected' : ''}>${N(w)}</option>`).join('')}</select></label>
      <button class="btn white" data-act="exportProject" data-id="${p.id}">${svg('file', 18)} Als Datei sichern</button>
      <button class="btn ghost-red" data-act="delProject" data-id="${p.id}">${svg('trash', 18)} Projekt löschen</button></details></div>`;
}
function viewNeuProjekt() {
  return `<div class="page">${back('#/countdowns', 'Countdowns')}<h1>Neues Projekt</h1>
    <section class="tile blue"><b>Projektdatei aus dem Chat?</b><p>Lass dir von Claude eine Los!-Projektdatei (.json) erstellen und wähle sie hier aus.</p>
      <label class="btn white">${svg('file', 18)} Datei importieren<input type="file" accept=".json,application/json,text/plain" class="sr-only" data-chg="importProject"></label></section>
    <form class="form" data-form="newProject">
      <label class="field">Titel<input name="title" required placeholder="z. B. Psydash"></label>
      <label class="field">Abgabe<input name="due" type="datetime-local"></label>
      <label class="field">Schritte <small>ein Schritt pro Zeile, optional „| 45“ für Minuten</small><textarea name="steps" rows="6" placeholder="Fallvignette lesen | 30&#10;Diagnose-Kriterien notieren | 45"></textarea></label>
      <label class="field">Zuständig<select name="persona">${ORDER.map((w) => `<option value="${w}" ${w === 'prof' ? 'selected' : ''}>${N(w)}</option>`).join('')}</select></label>
      <button class="btn red big" type="submit">Projekt anlegen</button></form></div>`;
}

// ---------- FOKUS ----------
let focusPick = null; // {projectId, stepId}
function openSteps() {
  const out = [];
  openProjects().forEach((p) => p.steps.filter((s) => !s.done).forEach((s) => out.push({ p, s })));
  return out;
}
function viewFokus() {
  const f = state.focus;
  const steps = openSteps();
  if (!focusPick && steps[0]) focusPick = { projectId: steps[0].p.id, stepId: steps[0].s.id };
  const cur = f ? steps.find((x) => x.s.id === f.stepId) : steps.find((x) => focusPick && x.s.id === focusPick.stepId);
  const min = f ? f.min : +S().focusMin;
  const C = 2 * Math.PI * 96;
  const end = f ? f.start + f.min * MIN : Date.now() + min * MIN;
  const endTxt = hm(end);
  const bundle = S().bundle;
  return `<div class="page"><header class="top"><h1>Fokus</h1>${chip('celine')}</header>
    <p class="lead">Anfangen ist der schwerste Teil. Danach wird’s leichter.</p>
    ${f ? `<div class="nowtask"><span class="eyebrow">Du arbeitest an</span><b>${esc(f.task)}</b></div>`
      : `<label class="field">Woran?<select data-chg="focusPick"><option value="">Freie Aufgabe</option>${steps.map(({ p, s }) => `<option value="${p.id}|${s.id}" ${cur && cur.s.id === s.id ? 'selected' : ''}>${esc(p.title)}: ${esc(s.title)}</option>`).join('')}</select></label>
      ${cur ? '' : '<label class="field">Aufgabe<input id="freeTask" placeholder="z. B. E-Mails beantworten"></label>'}`}
    ${cur && cur.s.ifThen ? `<div class="wenn-show"><span>Dein Wenn-dann-Plan</span>${esc(cur.s.ifThen)}</div>` : ''}
    <div class="ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" stroke="#FBE2E4" stroke-width="12" fill="none"/>
      <circle id="ringArc" cx="110" cy="110" r="96" stroke="#C8242F" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${f ? 0 : C}" transform="rotate(-90 110 110)"/></svg>
      <div class="ring-in"><b id="clock">${f ? '' : min + ':00'}</b><span id="clockLabel">${f ? 'bis ' + endTxt : 'Minuten'}</span></div></div>
    ${f ? `<div class="row"><button class="btn white" data-act="focusStop">Abbrechen</button><button class="btn red" data-act="focusFinish">Fertig</button></div>`
      : `<div class="seg wide">${[10, 25, 50].map((m) => `<button class="${min === m ? 'on' : ''}" data-act="focusMin" data-v="${m}">${m} Min</button>`).join('')}</div>
         <label class="check plain"><input type="checkbox" id="report" checked><span>Danach ${N(cur ? cur.p.persona || 'prof' : 'prof')} berichten</span></label>
         <button class="btn red big" data-act="focusStart">Start</button>`}
    ${bundle ? `<div class="bundle">${svg('music', 18)}<span>Nur im Fokus: <b>${esc(bundle)}</b></span></div>` : ''}
    <section class="bd"><h3 class="sec">Mit jemandem lernen</h3>
      <a class="bd-item" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Lust auf ${min} Min zusammen lernen? Ich fange jetzt an, bis ${endTxt}. Per Videocall oder einfach gleichzeitig 📚`)}"><span class="bd-ic" style="background:#DDF3E4;color:#14532D">${svg('people', 20)}</span><div><b>Freundin einladen</b><span>Einladung per WhatsApp</span></div></a>
      <a class="bd-item" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`study with me ${min} min`)}"><span class="bd-ic" style="background:#FFE7CF;color:#6B3A0E">${svg('video', 20)}</span><div><b>Study with me</b><span>Jemand lernt im Video mit dir</span></div></a>
      <button class="bd-item" data-act="announce" data-end="${endTxt}"><span class="bd-ic" style="background:#EAF0FF;color:#2F3A56">${svg('chat', 20)}</span><div><b>Ansagen</b><span>„Ich lerne jetzt bis ${endTxt} Uhr“</span></div></button>
    </section>
    <details class="more"><summary>${svg('phone', 18)} Ablenkungen am iPhone stummschalten</summary>
      <ol class="guide"><li>Einstellungen → Fokus → <b>+</b> → Eigener → „Lernen“.</li>
      <li>Mitteilungen: nur ausgewählte Personen (z. B. Mama) und Apps erlauben.</li>
      <li>Optional: unter „Bildschirme anpassen“ einen Home-Bildschirm nur mit Los! wählen.</li>
      <li>Vor dem Start: Kontrollzentrum öffnen → Fokus → „Lernen“.</li></ol>
      <p class="hint">Eine Web-App darf andere Apps nicht sperren – der iOS-Fokus übernimmt das.</p></details>
    <label class="field">Belohnung nur während Fokus <small>z. B. Lieblingsplaylist oder Podcast</small><input value="${esc(bundle)}" placeholder="z. B. meine Lern-Playlist" data-chg="bundle"></label>
  </div>`;
}

// ---------- TEAM ----------
function viewTeam() {
  return `<div class="page"><header class="top"><h1>Team</h1></header>
    <p class="lead">Sag jemandem, was du vorhast – dann machst du es eher.</p>
    <div class="list">${ORDER.map((w) => {
      const m = MOODS[state.moods[w]] || MOODS.neutral;
      const open = state.promises.filter((p) => p.who === w && p.status === 'open').length;
      const last = state.chat[w].slice(-1)[0];
      return `<a class="person" href="#/chat/${w}" style="background:${PERS[w].bg};color:${PERS[w].ink}">${avatar(w, 52)}
        <div><b>${N(w)}</b><span>${PERS[w].role}${S().scolder === w ? ' · darf schimpfen' : ''}</span>
        <em>${last ? esc(last.text).slice(0, 70) : 'Noch keine Nachrichten'}</em></div>
        <div class="p-r"><span class="mchip"><i style="background:${m.dot}"></i>${m.label}</span>${open ? `<span class="badge">${open}</span>` : ''}</div></a>`;
    }).join('')}</div>
    <p class="hint">Namen und wer schimpfen darf: ${svg('gear', 14)} <a href="#/einstellungen">Einstellungen</a></p></div>`;
}
function viewChat(who) {
  if (!PERS[who]) who = 'prof';
  if (!state.chat[who].length) { post(who, say(who, 'hello')); save(); }
  const open = state.promises.filter((p) => p.who === who && p.status === 'open');
  const t = new Date(Date.now() + 2 * 3600000);
  return `<div class="page chatpage">${back('#/team', 'Team')}
    <header class="chat-h" style="background:${PERS[who].bg};color:${PERS[who].ink}">${avatar(who, 44)}<div><b>${N(who)}</b><span>${PERS[who].role} · ${(MOODS[state.moods[who]] || MOODS.neutral).label}</span></div></header>
    <div class="msgs">${state.chat[who].map((m) => `<div class="msg ${m.me ? 'me' : ''}" ${m.me ? '' : `style="--pb:${PERS[who].bg};--pi:${PERS[who].ink}"`}>${esc(m.text)}
      ${m.restart ? `<a class="restart" href="#/fokus" data-act="restart">Neustart: 10 Min mit dem nächsten Schritt</a>` : ''}<time>${dayLabel(m.at)} ${hm(m.at)}</time></div>`).join('')}</div>
    ${open.map((p) => `<div class="ask"><b>${esc(p.what)}</b><span>Bis ${dayLabel(p.due)} ${hm(p.due)} – hast du’s geschafft?</span>
      <div class="row3"><button class="g" data-act="answer" data-id="${p.id}" data-v="done">Geschafft</button><button class="y" data-act="answer" data-id="${p.id}" data-v="part">Teilweise</button><button class="r" data-act="answer" data-id="${p.id}" data-v="no">Nicht gemacht</button></div></div>`).join('')}
    <form class="promise-f" data-form="promise" data-who="${who}"><span class="eyebrow dark">Neue Zusage an ${N(who)}</span>
      <input name="what" required placeholder="Was genau? z. B. Folien 1–3 fertig">
      <div class="row"><input name="due" type="datetime-local" value="${toLocalInput(t)}" required><button class="btn red" type="submit">Zusagen</button></div></form></div>`;
}

// ---------- RÜCKBLICK ----------
function viewRueckblick() {
  const since = Date.now() - 7 * 86400000;
  const arr = state.arrivals.filter((a) => a.at > since);
  const onTime = arr.filter((a) => a.late <= 0).length;
  const ses = state.sessions.filter((s) => s.at > since);
  const fmin = ses.reduce((s, x) => s + x.min, 0);
  const pr = state.promises.filter((p) => p.status !== 'open' && p.answeredAt > since);
  const kept = pr.filter((p) => p.status === 'done').length;
  const steps = state.history.filter((h) => h.at > since).length;
  const places = [...new Set(state.trips.map((t) => placeKey(t.place)))].map((k) => { const t = state.trips.find((x) => placeKey(x.place) === k); return { name: t.place, l: learnedTrip(state.trips, t.place) }; });
  const tile = (cls, label, big, sub) => `<div class="stat ${cls}"><span>${label}</span><b>${big}</b><em>${sub}</em></div>`;
  const ratio = (a, b) => (b ? a / b : 1);
  const c = (r) => (r >= 0.8 ? 'gruen' : r >= 0.5 ? 'gelb' : 'rot');
  return `<div class="page">${back('#/heute', 'Heute')}<h1>Rückblick</h1><p class="muted">Letzte 7 Tage</p>
    <div class="stats">
      ${tile(arr.length ? c(ratio(onTime, arr.length)) : 'grau', 'Pünktlich', `${onTime}/${arr.length}`, 'Termine')}
      ${tile(pr.length ? c(ratio(kept, pr.length)) : 'grau', 'Zusagen gehalten', `${kept}/${pr.length}`, 'an dein Team')}
      ${tile(fmin >= 120 ? 'gruen' : fmin >= 45 ? 'gelb' : 'grau', 'Fokus', `${fmin} Min`, `${ses.length} Sitzungen`)}
      ${tile(steps ? 'gruen' : 'grau', 'Schritte', steps, 'erledigt')}
    </div>
    <section class="card"><span class="eyebrow dark">Dein Zeit-Faktor</span><strong class="tile-big">× ${String(factor()).replace('.', ',')}</strong>
      <p class="muted">So viel länger dauern deine Schritte als geschätzt (aus Fokus-Zeiten gelernt). Los! rechnet Abgaben damit hoch.</p></section>
    ${places.length ? `<section class="card"><span class="eyebrow dark">Gelernte Fahrzeiten</span>${places.map((p) => `<div class="sp line"><span>${esc(p.name)}</span><b>${p.l ? p.l.min + ' Min · ' + p.l.n + '×' : '–'}</b></div>`).join('')}</section>` : ''}
    <div class="bubble" style="--pi:${PERS.celine.ink}">${avatar('celine', 40, PERS.celine.bg)}<p><b>${N('celine')}</b>${arr.length + pr.length === 0 ? 'Noch wenig Daten – nach ein paar Tagen siehst du hier Muster.' : kept + onTime >= (arr.length + pr.length) * 0.7 ? 'Richtig gute Woche! Merk dir, was geholfen hat.' : 'Nicht jede Woche läuft rund. Such dir einen Punkt aus, den du nächste Woche anders machst.'}</p></div></div>`;
}

// ---------- EINSTELLUNGEN / WILLKOMMEN ----------
function namesForm() {
  return `${ORDER.map((w) => `<label class="pname" style="background:${PERS[w].bg};color:${PERS[w].ink}">${avatar(w, 40)}<div><span>${PERS[w].role}</span><input value="${N(w)}" data-chg="name" data-w="${w}" aria-label="Name"></div></label>`).join('')}
    <h3 class="sec">Wer darf schimpfen?</h3><p class="hint">Nur diese Figur wird bei Ausrutschern deutlich. Die anderen bleiben freundlich und bieten einen Neustart an.</p>
    <div class="seg wide">${ORDER.map((w) => `<button class="${S().scolder === w ? 'on' : ''}" data-act="scolder" data-v="${w}">${N(w)}</button>`).join('')}<button class="${!S().scolder ? 'on' : ''}" data-act="scolder" data-v="">Niemand</button></div>`;
}
function viewWillkommen() {
  return `<div class="page"><h1 class="welcome">Los!</h1><p class="lead">Rückwärts planen, rechtzeitig losfahren, kleine Schritte – mit einem Team, das nachfragt.</p>
    <h3 class="sec">Dein Team</h3><p class="hint">Gib ihnen Namen, die dir passen.</p>${namesForm()}
    <h3 class="sec">Wie lange brauchst du zum Fertigmachen?</h3>
    <div class="seg wide">${[10, 15, 20, 30].map((m) => `<button class="${+S().readyMin === m ? 'on' : ''}" data-act="ready" data-v="${m}">${m} Min</button>`).join('')}</div>
    <button class="btn red big" data-act="onboard">Los geht’s</button>
    <p class="hint">Alles bleibt auf deinem Handy. Nichts wird hochgeladen.</p></div>`;
}
function viewEinstellungen() {
  const num = (f, l, step = 5) => `<label class="field inline">${l}<input type="number" inputmode="numeric" min="0" step="${step}" value="${S()[f]}" data-chg="setting" data-f="${f}"></label>`;
  return `<div class="page">${back('#/heute', 'Heute')}<h1>Einstellungen</h1>
    <h3 class="sec">Team</h3>${namesForm()}
    <h3 class="sec">Morgens</h3>
    ${num('wakeBuffer', 'Wachwerden (Min)')}${num('readyMin', 'Fertigmachen (Min)')}${num('arriveEarly', 'So früh im Raum sein (Min)')}
    <h3 class="sec">Abends</h3>
    <label class="field inline">Schlafenszeit<input type="time" value="${esc(S().bedtime)}" data-chg="setting" data-f="bedtime"></label>
    <label class="field">Vorbereitungs-Liste <small>ein Punkt pro Zeile</small><textarea rows="4" data-chg="checklist">${esc(state.checklist.join('\n'))}</textarea></label>
    <h3 class="sec">Projekte</h3>
    ${num('perDay', 'Arbeitszeit pro Tag (Min)', 15)}
    <h3 class="sec">Daten</h3>
    <button class="btn white wide" data-act="backup">${svg('file', 18)} Backup speichern</button>
    <label class="btn white wide">Backup wiederherstellen<input type="file" accept=".json,application/json" class="sr-only" data-chg="restore"></label>
    <button class="btn ghost-red wide" data-act="reset">${svg('trash', 18)} Alles löschen</button>
    <p class="hint">Los! · Version 2 · Daten nur auf diesem Gerät</p></div>`;
}

// ---------- Aktionen ----------
function icsForEvent(e) {
  const info = eventInfo(e);
  const s = S();
  const out = [{
    title: e.title, start: e.start, end: e.start + 60 * MIN, place: e.place,
    desc: info.steps.map((x) => `${hm(x.t)} ${x.label}`).join('\n'),
    alarms: [
      { min: (e.start - info.leave) / MIN, text: info.total ? `Jetzt losfahren: ${e.title}` : `Gleich: ${e.title}` },
      ...(info.total ? [{ min: (e.start - info.leave) / MIN + 15, text: `In 15 Min losfahren: ${e.title}` }] : [])
    ]
  }];
  // Eigener Eintrag fürs Kalender- bzw. Countdown-Widget
  if (info.total) out.push({ title: `Losfahren: ${e.title}`, start: info.leave, end: info.leave + 5 * MIN, place: e.place, desc: `Beginn ${hm(e.start)} · Fahrt ${info.total} Min`, alarms: [] });
  else out.push({ title: `Termin: ${e.title}`, start: e.start, end: e.start + 5 * MIN, alarms: [] });
  if (info.wake) out.push({ title: `Wecker: ${e.title}`, start: info.wake, end: info.wake + 5 * MIN, desc: `Aufstehen – Losfahren um ${hm(info.leave)}`, alarms: [{ min: 0 }] });
  // Abend davor
  const [bh, bm] = s.bedtime.split(':').map(Number);
  const eve = new Date(e.start); eve.setDate(eve.getDate() - 1); eve.setHours(bh, bm, 0, 0);
  if (eve.getTime() > Date.now()) {
    out.push({ title: `Für morgen packen: ${e.title}`, start: eve.getTime() - 30 * MIN, desc: state.checklist.join('\n'), alarms: [{ min: 0 }] });
    out.push({ title: 'Handy weg – ins Bett', start: eve.getTime(), desc: info.wake ? `Morgen Wecker ${hm(info.wake)}` : '', alarms: [{ min: 0 }] });
  }
  return out;
}
function startFocus(task, stepId, projectId, report) {
  state.focus = { start: Date.now(), min: +S().focusMin, task, stepId, projectId, report };
  save();
}
function finishFocus(completed) {
  const f = state.focus;
  if (!f) return;
  const min = Math.max(1, Math.round((Math.min(Date.now(), f.start + f.min * MIN) - f.start) / MIN));
  state.focus = null;
  state.sessions.push({ at: Date.now(), min, task: f.task });
  const p = state.projects.find((x) => x.id === f.projectId);
  const st = p && p.steps.find((s) => s.id === f.stepId);
  if (st) st.act = (st.act || 0) + min;
  if (completed && min >= 5) {
    const who = (p && p.persona) || 'prof';
    if (f.report) { me(who, `${min} Min an „${f.task}“ gearbeitet.`); post(who, say(who, 'focus', { m: min })); state.moods[who] = 'good'; }
  }
  save();
  if (st && completed) {
    if (confirm(`Ist der Schritt „${st.title}“ erledigt?`)) toggleStep(p, st);
  }
  toast(completed ? `${min} Min Fokus gespeichert` : 'Fokus abgebrochen');
}
function toggleStep(p, st) {
  st.done = !st.done;
  if (st.done) {
    st.doneAt = Date.now();
    if (st.act) state.history.push({ est: +st.min, act: st.act, at: Date.now() });
    else state.history.push({ est: 0, act: 0, at: Date.now() });
    const who = p.persona || 'prof';
    post(who, say(who, 'done'));
    state.moods[who] = 'good';
    state.promises.filter((x) => x.stepId === st.id && x.status === 'open').forEach((x) => { x.status = 'done'; x.answeredAt = Date.now(); });
  }
  save();
}

const actions = {
  cdFilter: (el) => { cdFilter = el.dataset.v; rerender(); },
  fmt: (el) => { S().fmt = el.dataset.v; save(); rerender(); },
  depart: (el) => { state.departed = { eventId: el.dataset.id, at: Date.now() }; post('mina', 'Gute Fahrt! Sag Bescheid, wenn du im Raum bist.'); save(); rerender(); },
  arrived: (el) => {
    const e = state.events.find((x) => x.id === el.dataset.id);
    const now = Date.now();
    const late = Math.round((now - e.start) / MIN);
    if (state.departed && state.departed.eventId === e.id && e.place) {
      state.trips.push({ place: e.place, min: Math.round((now - state.departed.at) / MIN), at: now });
    }
    state.departed = null;
    state.arrivals.push({ eventId: e.id, at: now, late });
    if (late > 0) slip('mina', 'late', { m: late });
    else { post('mina', say('mina', 'ontime')); state.moods.mina = 'good'; }
    save(); rerender();
    toast(late > 0 ? `${late} Min zu spät – gespeichert` : 'Pünktlich! Gespeichert');
  },
  icsOne: (el) => { const e = state.events.find((x) => x.id === el.dataset.id); download(`los-${e.title.replace(/\W+/g, '-').toLowerCase()}.ics`, buildIcs(icsForEvent(e)), 'text/calendar'); },
  icsAll: () => {
    const items = upcomingEvents().filter((e) => e.start > Date.now()).flatMap(icsForEvent);
    openProjects().forEach((p) => { const i = projectInfo(p); if (i.ls && i.ls > Date.now()) items.push({ title: `Spätester Start: ${p.title}`, start: i.ls, alarms: [{ min: 0 }, { min: 24 * 60 }] });
      if (p.due && p.due > Date.now()) items.push({ title: `Abgabe: ${p.title}`, start: p.due, alarms: [{ min: 24 * 60 }] }); });
    if (!items.length) return toast('Keine anstehenden Termine');
    download('los-erinnerungen.ics', buildIcs(items), 'text/calendar');
  },
  delEvent: (el) => { if (!confirm('Termin löschen?')) return; state.events = state.events.filter((x) => x.id !== el.dataset.id); save(); location.hash = '#/countdowns'; },
  stepToggle: (el) => { const p = state.projects.find((x) => x.id === el.dataset.id); toggleStep(p, p.steps.find((s) => s.id === el.dataset.s)); rerender(); },
  stepDel: (el) => { const p = state.projects.find((x) => x.id === el.dataset.id); p.steps = p.steps.filter((s) => s.id !== el.dataset.s); save(); rerender(); },
  focusStep: (el) => { focusPick = { projectId: el.dataset.id, stepId: el.dataset.s }; },
  promiseStep: (el) => {
    const p = state.projects.find((x) => x.id === el.dataset.id);
    const st = p.steps.find((s) => s.id === el.dataset.s);
    const who = p.persona || 'prof';
    const due = Date.now() + Math.max(60, Math.ceil((st.min * factor()) / 30) * 30 + 30) * MIN;
    addPromise(who, st.title, due, st.id);
    location.hash = `#/chat/${who}`;
  },
  exportProject: (el) => {
    const p = state.projects.find((x) => x.id === el.dataset.id);
    download(`${p.title.replace(/\W+/g, '-').toLowerCase()}.json`, JSON.stringify({ format: 'vi-los-project', title: p.title, due: p.due ? toLocalInput(p.due) : null, persona: p.persona, steps: p.steps.map((s) => ({ title: s.title, minutes: s.min, ifThen: s.ifThen })) }, null, 2), 'application/json');
  },
  delProject: (el) => { if (!confirm('Projekt löschen?')) return; state.projects = state.projects.filter((x) => x.id !== el.dataset.id); save(); location.hash = '#/countdowns'; },
  focusMin: (el) => { S().focusMin = +el.dataset.v; save(); rerender(); },
  focusStart: () => {
    const steps = openSteps();
    const cur = focusPick && steps.find((x) => x.s.id === focusPick.stepId);
    const free = $('#freeTask');
    const task = cur ? cur.s.title : (free && free.value.trim()) || 'Freie Aufgabe';
    startFocus(task, cur && cur.s.id, cur && cur.p.id, $('#report') ? $('#report').checked : false);
    rerender();
  },
  focusStop: () => { if (confirm('Fokus abbrechen?')) { finishFocus(false); rerender(); } },
  focusFinish: () => { finishFocus(true); rerender(); },
  announce: async (el) => {
    const t = `Ich lerne jetzt bis ${el.dataset.end} Uhr. Frag mich danach, ob ich’s geschafft hab!`;
    try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast('Text kopiert'); } } catch (e) { /* abgebrochen */ }
  },
  answer: (el) => {
    const p = state.promises.find((x) => x.id === el.dataset.id);
    const v = el.dataset.v;
    p.status = v; p.answeredAt = Date.now();
    me(p.who, { done: 'Geschafft!', part: 'Teilweise.', no: 'Nicht gemacht.' }[v]);
    if (v === 'done') { post(p.who, say(p.who, 'done')); state.moods[p.who] = 'good'; }
    else if (v === 'part') { post(p.who, say(p.who, 'part', {}, S().scolder)); state.moods[p.who] = 'neutral'; post(p.who !== S().scolder ? p.who : comforter(S().scolder), restartLine(), { restart: true }); }
    else slip(p.who, 'no');
    if (v === 'done' && p.stepId) {
      state.projects.forEach((pr) => pr.steps.forEach((s) => { if (s.id === p.stepId && !s.done) { s.done = true; s.doneAt = Date.now(); state.history.push({ est: s.act ? +s.min : 0, act: s.act || 0, at: Date.now() }); } }));
    }
    save(); rerender();
  },
  restart: () => { const s = openSteps().sort((a, b) => a.s.min - b.s.min)[0]; if (s) focusPick = { projectId: s.p.id, stepId: s.s.id }; S().focusMin = 10; save(); },
  scolder: (el) => { S().scolder = el.dataset.v || null; save(); rerender(); },
  ready: (el) => { S().readyMin = +el.dataset.v; save(); rerender(); },
  onboard: () => { S().onboarded = true; save(); location.hash = '#/heute'; },
  backup: () => download(`los-backup-${dk()}.json`, JSON.stringify({ format: 'vi-los-backup', data: state }), 'application/json'),
  reset: () => { if (confirm('Wirklich alle Daten löschen?') && confirm('Sicher? Das kann man nicht rückgängig machen.')) { state = DEFAULT(); save(); location.hash = '#/willkommen'; } }
};
function addPromise(who, what, due, stepId) {
  state.promises.push({ id: uid(), who, what, due, stepId: stepId || null, status: 'open', at: Date.now() });
  me(who, `Ich mache „${what}“ bis ${dayLabel(due) === 'Heute' ? '' : dayLabel(due) + ' '}${hm(due)}.`);
  post(who, say(who, 'promise', { x: what, t: hm(due) }));
  state.moods[who] = 'neutral';
  save();
}

const changes = {
  evening: (el) => { const k = dk(); const a = new Set(state.evening[k] || []); el.checked ? a.add(+el.dataset.i) : a.delete(+el.dataset.i); state.evening = { [k]: [...a] }; save(); },
  evField: (el) => {
    const e = state.events.find((x) => x.id === el.dataset.id);
    const f = el.dataset.f;
    e[f] = f === 'start' ? new Date(el.value).getTime() : ['travel', 'traffic', 'park'].includes(f) ? +el.value || 0 : el.value.trim();
    save(); rerender();
  },
  placeFill: (el) => {
    const prev = [...state.events].reverse().find((e) => placeKey(e.place) === placeKey(el.value));
    if (!prev) return;
    const f = el.form;
    f.travel.value = prev.travel || ''; f.traffic.value = prev.traffic ?? 10; f.park.value = prev.park ?? 10;
  },
  importIcs: async (el) => {
    const file = el.files[0];
    if (!file) return;
    const list = parseIcs(await file.text()).filter((x) => x.start > Date.now() - 86400000 && !x.allDay);
    let n = 0;
    for (const x of list) {
      if (state.events.some((e) => e.start === x.start && e.title === x.title)) continue;
      const prev = [...state.events].reverse().find((e) => x.place && placeKey(e.place) === placeKey(x.place));
      state.events.push({ id: uid(), title: x.title || 'Termin', start: x.start, place: x.place || '', travel: prev ? prev.travel : 0, traffic: prev ? prev.traffic : 0, park: prev ? prev.park : 0 });
      n++;
    }
    save();
    toast(n ? `${n} Termin${n > 1 ? 'e' : ''} importiert – Fahrzeit bei Ortsterminen prüfen` : 'Keine neuen Termine gefunden');
    location.hash = '#/countdowns';
  },
  stepField: (el) => {
    const p = state.projects.find((x) => x.id === el.dataset.id);
    const s = p.steps.find((x) => x.id === el.dataset.s);
    s[el.dataset.f] = el.dataset.f === 'min' ? Math.max(5, +el.value || 5) : el.value.trim();
    save();
    if (el.dataset.f === 'min') rerender();
  },
  prDue: (el) => { const p = state.projects.find((x) => x.id === el.dataset.id); p.due = el.value ? new Date(el.value).getTime() : null; save(); rerender(); },
  prPersona: (el) => { state.projects.find((x) => x.id === el.dataset.id).persona = el.value; save(); },
  importProject: async (el) => {
    const file = el.files[0];
    if (!file) return;
    try {
      const p = parseProjectFile(JSON.parse(await file.text()));
      state.projects.push(p); save();
      toast(`„${p.title}“ importiert`);
      location.hash = `#/projekt/${p.id}`;
    } catch (e) { toast(e.message || 'Datei konnte nicht gelesen werden'); }
  },
  focusPick: (el) => { const [pid, sid] = el.value.split('|'); focusPick = el.value ? { projectId: pid, stepId: sid } : { projectId: null, stepId: null }; rerender(); },
  bundle: (el) => { S().bundle = el.value.trim(); save(); },
  name: (el) => { S().names[el.dataset.w] = el.value.trim() || { prof: 'Prof. Melzer', mina: 'Mina', celine: 'Celine' }[el.dataset.w]; save(); },
  setting: (el) => { S()[el.dataset.f] = el.type === 'number' ? +el.value || 0 : el.value; save(); },
  checklist: (el) => { state.checklist = el.value.split('\n').map((x) => x.trim()).filter(Boolean); save(); },
  restore: async (el) => {
    try {
      const o = JSON.parse(await el.files[0].text());
      if (o.format !== 'vi-los-backup') throw new Error();
      if (!confirm('Backup laden? Aktuelle Daten werden ersetzt.')) return;
      state = { ...DEFAULT(), ...o.data }; save(); toast('Backup geladen'); location.hash = '#/heute';
    } catch (e) { toast('Das ist kein Los!-Backup'); }
  }
};

const forms = {
  newEvent: (f) => {
    const d = new FormData(f);
    const e = { id: uid(), title: d.get('title').trim(), start: new Date(d.get('start')).getTime(), place: d.get('place').trim(), travel: +d.get('travel') || 0, traffic: +d.get('traffic') || 0, park: +d.get('park') || 0 };
    if (!e.place && !e.travel) { e.traffic = 0; e.park = 0; }
    state.events.push(e); save();
    location.hash = `#/termin/${e.id}`;
  },
  newProject: (f) => {
    const d = new FormData(f);
    const steps = d.get('steps').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [t, m] = l.split('|'); return { title: t.trim(), minutes: +m || 30 }; });
    const p = parseProjectFile({ format: 'vi-los-project', title: d.get('title').trim(), due: d.get('due') || null, persona: d.get('persona'), steps: steps.length ? steps : [{ title: 'Ersten kleinen Schritt festlegen', minutes: 10 }] });
    state.projects.push(p); save();
    location.hash = `#/projekt/${p.id}`;
  },
  addStep: (f) => {
    const p = state.projects.find((x) => x.id === f.dataset.id);
    p.steps.push({ id: uid(), title: f.t.value.trim(), min: +f.m.value || 30, ifThen: '', done: false, act: 0 });
    save(); rerender();
  },
  promise: (f) => {
    addPromise(f.dataset.who, f.what.value.trim(), new Date(f.due.value).getTime());
    rerender();
  }
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || !actions[el.dataset.act]) return;
  if (el.tagName === 'BUTTON') ev.preventDefault();
  actions[el.dataset.act](el, ev);
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-chg]');
  if (el && changes[el.dataset.chg]) changes[el.dataset.chg](el, ev);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]');
  if (!f) return;
  ev.preventDefault();
  forms[f.dataset.form](f);
});

// ---------- Uhr ----------
function tick() {
  const now = Date.now();
  document.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = countdown((+el.dataset.cd - now) / 1000, S().fmt); });
  const f = state.focus;
  const clock = $('#clock');
  if (f && clock) {
    const left = Math.max(0, f.start + f.min * MIN - now);
    clock.textContent = `${Math.floor(left / MIN)}:${pad(Math.floor((left % MIN) / 1000))}`;
    const arc = $('#ringArc');
    if (arc) { const C = 2 * Math.PI * 96; arc.setAttribute('stroke-dashoffset', String(C * (1 - left / (f.min * MIN)))); }
    if (left === 0 && !tick.rang) { tick.rang = true; toast('Zeit um! Tippe „Fertig“.'); }
  }
  if (!f) tick.rang = false;
}
setInterval(tick, 1000);
// Ampel-Farben regelmäßig neu berechnen (nicht während man tippt)
setInterval(() => {
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return;
  if (document.querySelector('details[open]')) return;
  rerender();
}, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) rerender(); });

window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
