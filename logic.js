// Reine Rechenfunktionen für Los! (keine Oberfläche).

export const pad = (n) => String(n).padStart(2, '0');
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const MIN = 60000;

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const hm = (d) => `${new Date(d).getHours()}:${pad(new Date(d).getMinutes())}`;
export const dshort = (d) => { const x = new Date(d); return `${WD[x.getDay()]} ${x.getDate()}.${x.getMonth() + 1}.`; };
export const dlong = (d) => { const x = new Date(d); return `${WDL[x.getDay()]}, ${x.getDate()}.${x.getMonth() + 1}.`; };
export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
export function toLocalInput(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
export function dayLabel(d, now = new Date()) {
  const t = new Date(now); t.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const diff = Math.round((x - t) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  return dshort(d);
}

// ---------- Fahrzeit lernen ----------
// trips: [{place, min}] – echte Dauer von „Ich fahre los“ bis „Angekommen“.
export const placeKey = (p) => (p || '').trim().toLowerCase();
export function learnedTrip(trips, place) {
  const list = trips.filter((t) => placeKey(t.place) === placeKey(place) && t.min > 0).slice(-5);
  if (!list.length) return null;
  const avg = list.reduce((s, t) => s + t.min, 0) / list.length;
  return { min: Math.ceil(avg / 5) * 5, n: list.length };
}
export function tripTotal(ev, trips) {
  const entered = (+ev.travel || 0) + (+ev.traffic || 0) + (+ev.park || 0);
  const l = ev.place ? learnedTrip(trips, ev.place) : null;
  return { total: l ? Math.max(l.min, +ev.travel || 0) : entered, entered, learned: l };
}

// ---------- Rückwärts planen ----------
export function eventPlan(ev, s, trips) {
  const start = new Date(ev.start).getTime();
  if (!ev.place && !(+ev.travel)) {
    // Termin ohne Fahrt (z. B. online): nur Vorbereitung
    const ready = start - (+s.readyMin || 0) * MIN;
    return { leave: start, total: 0, steps: [
      { t: ready, label: 'Fertig machen', sub: `${s.readyMin} Min`, kind: 'go' },
      { t: start, label: 'Beginn', sub: ev.title, kind: 'end' }
    ] };
  }
  const { total, learned } = tripTotal(ev, trips);
  const buffer = +s.arriveEarly || 0;
  const inRoom = start - buffer * MIN;
  const park = +ev.park || 0;
  const leave = inRoom - total * MIN;
  const ready = leave - (+s.readyMin || 0) * MIN;
  const wake = ready - (+s.wakeBuffer || 0) * MIN;
  const drive = total - park;
  const steps = [
    { t: wake, label: 'Wecker', sub: `${s.wakeBuffer} Min zum Wachwerden`, kind: 'ok' },
    { t: ready, label: 'Aufstehen & fertig machen', sub: `${s.readyMin} Min`, kind: 'ok' },
    { t: leave, label: 'Losfahren', sub: learned ? `Fahrt ${drive} Min · gelernt aus ${learned.n} Fahrt${learned.n > 1 ? 'en' : ''}` : `Fahrt ${drive} Min inkl. Stau-Puffer`, kind: 'go' }
  ];
  if (park) steps.push({ t: inRoom - park * MIN, label: 'Parken & zum Raum', sub: `${park} Min`, kind: 'mid' });
  steps.push({ t: inRoom, label: 'Im Raum', sub: buffer ? `${buffer} Min vor Beginn – Zeit zum Ankommen` : 'Pünktlich', kind: 'end' });
  return { leave, total, steps, wake };
}

// ---------- Projekte / Abgaben ----------
export function factorFrom(history) {
  // history: [{est, act}] – wie viel länger Schritte wirklich dauern
  const h = history.filter((x) => x.est > 0 && x.act > 0).slice(-10);
  if (h.length < 2) return 1.5; // Planungsfehlschluss: Startwert 1,5
  const r = h.reduce((s, x) => s + x.act / x.est, 0) / h.length;
  return Math.min(3, Math.max(1, Math.round(r * 10) / 10));
}
export function remainingMin(p) {
  return p.steps.filter((x) => !x.done).reduce((s, x) => s + (+x.min || 0), 0);
}
// Pro Tag realistisch nutzbare Arbeitszeit (Minuten)
export function latestStart(p, factor, perDay) {
  if (!p.due) return null;
  const need = remainingMin(p) * factor;
  const days = Math.ceil(need / Math.max(30, perDay));
  const d = new Date(p.due);
  d.setDate(d.getDate() - days - 1); // 1 Tag Puffer
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

// ---------- Ampel ----------
// Termine: Minuten bis Losfahren. Abgaben: Zeit bis zum spätesten Start.
export function ampelEvent(leave, now = Date.now()) {
  const m = (leave - now) / MIN;
  if (m > 60) return 'gruen';
  if (m > 15) return 'gelb';
  return 'rot';
}
export function ampelProject(ls, now = Date.now()) {
  if (ls == null) return 'gruen';
  const d = (ls - now) / 86400000;
  if (d > 3) return 'gruen';
  if (d > 0) return 'gelb';
  return 'rot';
}

// ---------- Countdown-Anzeige ----------
export function countdown(secs, fmt) {
  const neg = secs < 0;
  let s = Math.abs(Math.floor(secs));
  const days = Math.floor(s / 86400);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  let out;
  if (days >= 2) {
    const rh = Math.floor((s % 86400) / 3600);
    if (fmt === 'h') out = `${days} Tage`;
    else if (fmt === 'hms') out = `${days} T ${pad(rh)}:${pad(m)}:${pad(sec)}`;
    else out = `${days} Tage ${rh} Std.`;
  } else if (fmt === 'h') out = `${Math.round(s / 3600)} Std.`;
  else if (fmt === 'hms') out = `${h}:${pad(m)}:${pad(sec)}`;
  else out = h ? `${h} Std. ${pad(m)} Min` : `${m} Min`;
  return neg ? `seit ${out}` : out;
}
export function inWords(ms) {
  const m = Math.round(ms / MIN);
  if (m < 1) return 'jetzt';
  if (m < 60) return `in ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `in ${h} Std.${m % 60 ? ' ' + pad(m % 60) + ' Min' : ''}`;
  return `in ${Math.round(h / 24)} Tagen`;
}

// ---------- Kalender (.ics) ----------
const icsEsc = (t) => String(t || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
function icsLocal(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
export function buildIcs(items) {
  // items: [{title, start, end?, desc, alarms:[minutes before start]}]
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Los//DE', 'CALSCALE:GREGORIAN'];
  for (const it of items) {
    L.push('BEGIN:VEVENT', `UID:${uid()}@los`, `DTSTAMP:${icsLocal(Date.now())}`,
      `DTSTART:${icsLocal(it.start)}`, `DTEND:${icsLocal(it.end || it.start + 15 * MIN)}`,
      `SUMMARY:${icsEsc(it.title)}`);
    if (it.desc) L.push(`DESCRIPTION:${icsEsc(it.desc)}`);
    if (it.place) L.push(`LOCATION:${icsEsc(it.place)}`);
    for (const a of it.alarms || []) {
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(a.text || it.title)}`, `TRIGGER:-PT${Math.max(0, Math.round(a.min))}M`, 'END:VALARM');
    }
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
function parseIcsDate(v, params) {
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = '9', mi = '0', s = '0', z] = m;
  if (z) return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  return new Date(+y, +mo - 1, +d, +h, +mi, +s).getTime(); // TZID oder floating: als Ortszeit
}
const icsUnesc = (t) => t.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
export function parseIcs(text) {
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {};
    else if (line === 'END:VEVENT') { if (cur && cur.start) out.push(cur); cur = null; }
    else if (cur) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      const [name, ...params] = line.slice(0, i).split(';');
      const val = line.slice(i + 1);
      if (name === 'DTSTART') { cur.start = parseIcsDate(val, params); cur.allDay = params.some((p) => p === 'VALUE=DATE'); }
      if (name === 'SUMMARY') cur.title = icsUnesc(val);
      if (name === 'LOCATION') cur.place = icsUnesc(val);
    }
  }
  return out;
}

// ---------- Projektdatei ----------
export function parseProjectFile(obj) {
  if (!obj || (obj.format !== 'vi-los-project' && !Array.isArray(obj.steps))) throw new Error('Das ist keine Los!-Projektdatei.');
  const steps = (obj.steps || []).map((s) => (typeof s === 'string' ? { title: s } : s)).filter((s) => s.title);
  if (!steps.length) throw new Error('Die Datei enthält keine Schritte.');
  let due = null;
  if (obj.due) { const d = new Date(obj.due.length <= 10 ? obj.due + 'T23:59' : obj.due); if (!isNaN(d)) due = d.getTime(); }
  return {
    id: uid(), title: String(obj.title || 'Projekt'), due, persona: obj.persona || 'prof', note: obj.note || '',
    steps: steps.map((s) => ({ id: uid(), title: String(s.title), min: +s.minutes || +s.min || 30, ifThen: s.ifThen || s.wenn || '', done: false, act: 0 })),
    created: Date.now()
  };
}
