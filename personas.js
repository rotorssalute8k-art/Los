// Die drei Figuren: Aussehen, Zuständigkeit und Sätze.
// Schimpfen darf nur die Figur, die in den Einstellungen dafür gewählt ist.

export const PERS = {
  prof: { role: 'Uni & Abgaben', bg: '#EAF0FF', ink: '#2F3A56', soft: '#3A4460' },
  mina: { role: 'Alltag & Pünktlichkeit', bg: '#FFE7CF', ink: '#6B3A0E', soft: '#7A4E00' },
  celine: { role: 'Wenn’s schwer wird', bg: '#DDF3E4', ink: '#14532D', soft: '#1F5C3A' }
};
export const ORDER = ['prof', 'mina', 'celine'];

export function avatar(who, size = 40, fill = '#FFFFFF') {
  const s = `width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"`;
  const k = '#16181D';
  if (who === 'prof') return `<svg ${s}><circle cx="20" cy="20" r="17" fill="${fill}"/><path d="M8 15 q12 -14 24 0" stroke="${k}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="14.5" cy="21" r="4" stroke="${k}" stroke-width="2" fill="none"/><circle cx="25.5" cy="21" r="4" stroke="${k}" stroke-width="2" fill="none"/><path d="M18.5 21 h3" stroke="${k}" stroke-width="2"/><path d="M16 29 h8" stroke="${k}" stroke-width="2" stroke-linecap="round"/></svg>`;
  if (who === 'mina') return `<svg ${s}><circle cx="20" cy="22" r="16" fill="${fill}"/><path d="M7 14 L10 2 L17 9 Z M33 14 L30 2 L23 9 Z" fill="${fill}"/><path d="M13 21 h4 M23 21 h4" stroke="${k}" stroke-width="2.4" stroke-linecap="round"/><path d="M17 29 q3 -2 6 0" stroke="${k}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  return `<svg ${s}><circle cx="20" cy="21" r="16" fill="${fill}"/><path d="M6 20 q2 -14 14 -14 q12 0 14 14 q-4 -6 -14 -7 q-10 1 -14 7 Z" fill="#7A4A2A"/><circle cx="15" cy="21" r="1.8" fill="${k}"/><circle cx="25" cy="21" r="1.8" fill="${k}"/><path d="M15 27 q5 4 10 0" stroke="${k}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Ton je Figur, wenn sie NICHT schimpfen darf: bestimmt, aber freundlich.
const LINES = {
  hello: {
    prof: ['Guten Tag. Was ist heute der wichtigste Schritt?', 'Was nimmst du dir heute vor? Konkret, bitte.'],
    mina: ['Na? Wann fährst du heute los? Ich will’s genau wissen.', 'Ich beobachte dich. Freundlich. Meistens.'],
    celine: ['Hey! Schön, dass du da bist. Was steht an?', 'Ein kleiner Schritt reicht heute schon.']
  },
  promise: {
    prof: ['Notiert: „{x}“ bis {t}. Ich frage nach.', 'Gut. „{x}“ bis {t}. Ich verlasse mich darauf.'],
    mina: ['„{x}“ bis {t}. Ich schreib’s mir auf. Mit Krallen.', 'Abgemacht: {t}. Ich warte.'],
    celine: ['Super, „{x}“ bis {t}. Du schaffst das!', 'Klingt machbar. Ich bin um {t} da.']
  },
  done: {
    prof: ['Ausgezeichnet. Genau so funktioniert das.', 'Sehr gut. Der nächste Schritt wird leichter.'],
    mina: ['Hm. Gut gemacht. Sag’s keinem, dass ich nett war.', 'Okay, das war stark.'],
    celine: ['Yesss! Ich freu mich so für dich.', 'Wie gut! Gönn dir kurz was.']
  },
  part: {
    prof: ['Ein Teil ist besser als nichts. Was fehlt noch genau?', 'Ehrlich berichtet, das zählt. Rest morgen früh?'],
    mina: ['Halb ist halb. Den Rest will ich auch noch sehen.', 'Na gut. Aber der Rest läuft nicht weg. Du schon.'],
    celine: ['Das ist echt Fortschritt! Den Rest machen wir klein.', 'Super, dass du angefangen hast – das ist der schwerste Teil.']
  },
  ontime: {
    prof: ['Pünktlich. Sehr erfreulich.'],
    mina: ['Pünktlich?! Ich bin sprachlos. Fast.', 'Ha. Pünktlich. Ich hab nie an dir gezweifelt. (Doch.)'],
    celine: ['Pünktlich angekommen – wie entspannt ist das bitte!']
  },
  focus: {
    prof: ['{m} Minuten konzentriert. So wird das was.'],
    mina: ['{m} Minuten durchgezogen. Ich bin… beeindruckt.'],
    celine: ['{m} Minuten! Stolz auf dich.']
  },
  firm: {
    prof: ['Das war nicht der Plan. Was hat dich abgehalten?', 'Das kostet Zeit, die dir später fehlt. Wir planen neu.'],
    mina: ['Nicht so gelaufen, hm. Merk dir, woran es lag.', 'Okay. Beim nächsten Mal fährst du früher los. Abgemacht?'],
    celine: ['Ist nicht so gelaufen – das ist okay. Was hat dich aufgehalten?']
  },
  nudgeLeave: {
    prof: ['In {m} Minuten solltest du losfahren.'],
    mina: ['{m} Minuten bis Losfahren. Schuhe. Jetzt.', 'Noch {m} Minuten. Ich zähle mit.'],
    celine: ['Noch {m} Minuten bis Losfahren – pack schon mal die Tasche.']
  },
  nudgeStart: {
    prof: ['„{x}“ sollte langsam starten. Nur der erste Schritt.'],
    mina: ['„{x}“ macht sich nicht von allein.'],
    celine: ['Wie wär’s mit 10 Minuten an „{x}“? Nur anfangen.']
  }
};

// Schimpfen – nur für die gewählte Figur.
const SCOLD = {
  late: ['{m} Minuten zu spät. Ernsthaft? Du hattest einen Plan!', 'Zu spät. Schon wieder. Der Plan stand doch da – rot, groß, unübersehbar.', 'Ich hab dich gewarnt. {m} Minuten. Das nächste Mal fährst du los, wenn ich es sage.'],
  no: ['Nicht gemacht?! Du hast es mir versprochen.', 'Wow. Einfach nicht gemacht. Ich bin enttäuscht – und ich sag’s dir ins Gesicht.', 'Nein? Dann will ich morgen früh einen besseren Plan sehen.'],
  part: ['Nur ein Teil? Das geht besser, und das weißt du.'],
  leave: ['Du solltest schon im Auto sitzen! Los jetzt!', 'Warum bist du noch nicht losgefahren?! LOS!']
};

// Neustart nach einem Ausrutscher (Selbstvergebung statt Grübeln).
const RESTART = ['Passiert. Wichtig ist der nächste Schritt – wie klein kann er sein?', 'Abhaken, nicht grübeln. Willst du 10 Minuten mit dem nächsten Schritt starten?', 'Das sagt nichts über dich. Neuer Versuch: ein kleiner Schritt, jetzt oder heute Abend.'];

export function say(who, kind, ctx = {}, scolder) {
  let text;
  if (who === scolder && SCOLD[kind === 'nudgeLeaveLate' ? 'leave' : kind]) text = pick(SCOLD[kind === 'nudgeLeaveLate' ? 'leave' : kind]);
  else {
    const map = { late: 'firm', no: 'firm', nudgeLeaveLate: 'nudgeLeave' };
    const k = map[kind] || kind;
    text = pick((LINES[k] && LINES[k][who]) || LINES.hello[who]);
  }
  return text.replace('{m}', ctx.m ?? '').replace('{x}', ctx.x ?? '').replace('{t}', ctx.t ?? '');
}
export const restartLine = () => pick(RESTART);

// Wer tröstet nach einem Ausrutscher? Celine – außer sie ist die Schimpferin.
export const comforter = (scolder) => (scolder === 'celine' ? 'prof' : 'celine');

export const MOODS = {
  good: { label: 'zufrieden', dot: '#1E7A46' },
  neutral: { label: 'gespannt', dot: '#C88A12' },
  bad: { label: 'genervt', dot: '#C8242F' },
  sad: { label: 'enttäuscht', dot: '#C8242F' }
};
