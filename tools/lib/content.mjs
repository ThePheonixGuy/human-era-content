// Zero-dependency content loader: frontmatter parser, markdown tree walker and validator.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

function scalar(raw) {
  const v = raw.trim();
  if (v === '') return '';
  if (v[0] === '"' || v[0] === '[' || v[0] === '{') return JSON.parse(v);
  if (v[0] === "'") return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

// Supports: key: scalar, key: (nested map), key: (list of maps / scalars). Two-space indent.
export function parseFrontmatter(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const lines = m[1].split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('#'));
  const data = {};
  let i = 0;
  const indent = (l) => l.length - l.trimStart().length;
  while (i < lines.length) {
    const line = lines[i];
    if (indent(line) !== 0) throw new Error(`unexpected indent: ${line}`);
    const km = line.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (!km) throw new Error(`bad line: ${line}`);
    const [, key, rest] = km;
    i++;
    if (rest.trim() !== '') { data[key] = scalar(rest); continue; }
    const block = [];
    while (i < lines.length && indent(lines[i]) > 0) block.push(lines[i++]);
    if (block.length && block[0].trimStart().startsWith('- ')) {
      const list = [];
      for (const bl of block) {
        const t = bl.trimStart();
        if (t.startsWith('- ')) {
          list.push({});
          const rest2 = t.slice(2);
          const im = rest2.match(/^([A-Za-z0-9_]+):(.*)$/);
          if (im) list[list.length - 1][im[1]] = scalar(im[2]);
          else list[list.length - 1] = scalar(rest2);
        } else {
          const im = t.match(/^([A-Za-z0-9_]+):(.*)$/);
          if (!im) throw new Error(`bad list line: ${bl}`);
          list[list.length - 1][im[1]] = scalar(im[2]);
        }
      }
      data[key] = list;
    } else {
      const obj = {};
      for (const bl of block) {
        const im = bl.trim().match(/^([A-Za-z0-9_]+):(.*)$/);
        if (!im) throw new Error(`bad map line: ${bl}`);
        obj[im[1]] = scalar(im[2]);
      }
      data[key] = obj;
    }
  }
  return { data, body: m[2] };
}

export function loadContent(root) {
  const dir = join(root, 'content');
  const items = [];
  for (const file of walk(dir)) {
    const rel = relative(dir, file).split(sep).join('/');
    if (rel === 'README.md') continue;
    const text = readFileSync(file, 'utf8');
    try {
      const { data, body } = parseFrontmatter(text);
      items.push({ file, rel, data, body });
    } catch (e) {
      items.push({ file, rel, error: e.message });
    }
  }
  return items;
}

export const THEMES_FALLBACK = [];

/** Fractional year for an ISO date: year + (dayOfYear - 1) / daysInYear, at the start of the day (UTC). */
export function dateToYear(iso) {
  const [Y, M, D] = iso.split('-').map(Number);
  const doy = (Date.UTC(Y, M - 1, D) - Date.UTC(Y, 0, 1)) / 864e5;
  const len = (Date.UTC(Y + 1, 0, 1) - Date.UTC(Y, 0, 1)) / 864e5;
  return Y + doy / len;
}

function checkDate(d, err) {
  if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return err('date must be YYYY-MM-DD');
  const [Y, M, D] = d.date.split('-').map(Number);
  const real = new Date(Date.UTC(Y, M - 1, D));
  if (real.getUTCFullYear() !== Y || real.getUTCMonth() !== M - 1 || real.getUTCDate() !== D) return err(`date ${d.date} is not a real calendar day`);
  if (typeof d.year === 'number' && Math.abs(d.year - dateToYear(d.date)) > 0.0003) {
    err(`year ${d.year} does not match date ${d.date} (expected ${dateToYear(d.date).toFixed(4)})`);
  }
}

/** Free licences only: no NC, no ND. */
const FREE_LICENCE = /^(CC0( 1\.0)?|Public domain|CC BY(-SA)? \d\.\d( [a-z]{2,3})?)$/;

const THEN_NOW_KEYS = ['thenCaption', 'thenSvg', 'thenSource', 'nowCaption', 'nowSvg', 'nowSource'];

/** thenNow: both sides need a non-empty caption, a cited Wikipedia article title and an existing scene file at content/scenes/<id>-then|now.svg (the site serves it as img/scenes/..., copied there by the build). */
function checkThenNow(d, err, root) {
  const t = d.thenNow;
  if (!(t && typeof t === 'object' && !Array.isArray(t))) return err('thenNow must be a map');
  for (const k of THEN_NOW_KEYS) if (typeof t[k] !== 'string' || !t[k].trim()) err(`thenNow.${k} must be a non-empty string`);
  for (const k of Object.keys(t)) if (!THEN_NOW_KEYS.includes(k)) err(`thenNow.${k} is not a known key`);
  for (const side of ['then', 'now']) {
    const svg = t[`${side}Svg`];
    if (typeof svg !== 'string' || !svg) continue;
    if (svg !== `img/scenes/${d.id}-${side}.svg`) err(`thenNow.${side}Svg must be img/scenes/${d.id}-${side}.svg`);
    else if (root && !existsSync(join(root, 'content/scenes', `${d.id}-${side}.svg`))) err(`thenNow.${side}Svg file content/scenes/${d.id}-${side}.svg does not exist`);
  }
}

/** compare-facts page: every "- earlier,later: text ;; label | url" line needs two existing events in year order and at least one https source. */
function checkCompareFacts(it, items, err) {
  const years = new Map(items.filter((x) => x.rel.startsWith('events/') && x.data).map((x) => [x.data.id, x.data.year]));
  const seen = new Set();
  for (const line of it.body.split('\n').filter((l) => l.startsWith('- '))) {
    const m = line.match(/^- ([a-z0-9-]+),([a-z0-9-]+): (.+)$/);
    if (!m) { err(`malformed compare fact line: ${line.slice(0, 60)}`); continue; }
    const [, a, b, rest] = m;
    const key = `${a},${b}`;
    if (seen.has(key)) err(`duplicate compare pair ${key}`);
    seen.add(key);
    for (const id of [a, b]) if (!years.has(id)) err(`compare pair ${key}: unknown event id ${id}`);
    if (years.has(a) && years.has(b) && years.get(a) > years.get(b)) err(`compare pair ${key}: list the earlier event first`);
    const [text, ...src] = rest.split(' ;; ');
    if (!text.trim()) err(`compare pair ${key}: missing fact text`);
    const good = src.filter((s) => { const [label, url] = s.split(' | '); return label?.trim() && /^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/.test(url?.trim() ?? ''); });
    if (src.length === 0 || good.length < src.length) err(`compare pair ${key}: every source needs "label | https://en.wikipedia.org/wiki/..." and there must be at least one`);
  }
}

const BEAT_NAMES = ['dawn', 'work', 'road', 'food', 'evening', 'night'];
const HOLO_POSES = ['cheer', 'sparkle', 'helmet', 'nap'];

/** daylife page: 4 to 5 beats, each with a caption, a scene file that exists, a fact, a Holo reaction and a Wikipedia source URL. */
function checkDayInLife(d, err, root) {
  if (typeof d.year !== 'number') err('year must be a number');
  if (typeof d.spanYears !== 'number' || d.spanYears <= 0) err('spanYears must be a positive number');
  if (typeof d.place !== 'string' || !d.place.trim()) err('place must be a non-empty string');
  if (!Array.isArray(d.beats) || d.beats.length < 4 || d.beats.length > 5) return err('beats must be a list of 4 to 5 beats');
  const seen = new Set();
  d.beats.forEach((b, i) => {
    const at = `beats[${i}]`;
    if (!b || typeof b !== 'object') return err(`${at} must be a map`);
    for (const k of ['beat', 'title', 'caption', 'scene', 'fact', 'sourceLabel', 'source', 'pose', 'line']) {
      if (typeof b[k] !== 'string' || !b[k].trim()) err(`${at}.${k} must be a non-empty string`);
    }
    if (!BEAT_NAMES.includes(b.beat)) err(`${at}.beat must be one of ${BEAT_NAMES.join(', ')}`);
    else if (seen.has(b.beat)) err(`${at}.beat ${b.beat} is repeated`);
    else seen.add(b.beat);
    if (typeof b.pose === 'string' && !HOLO_POSES.includes(b.pose)) err(`${at}.pose must be one of ${HOLO_POSES.join(', ')}`);
    if (typeof b.source === 'string' && !/^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/.test(b.source)) err(`${at}.source must be an en.wikipedia.org article URL`);
    if (typeof b.scene === 'string' && b.scene) {
      if (!/^img\/scenes\/[a-z0-9-]+\.svg$/.test(b.scene)) err(`${at}.scene must be img/scenes/<name>.svg`);
      else if (root && !existsSync(join(root, 'content/scenes', b.scene.slice('img/scenes/'.length)))) err(`${at}.scene file content/scenes/${b.scene.slice('img/scenes/'.length)} does not exist`);
    }
  });
}

export function validate(items, root) {
  const errors = [];
  const err = (rel, msg) => errors.push(`${rel}: ${msg}`);
  const ids = { events: new Set(), eras: new Set(), themes: new Set(), pages: new Set() };
  const themeIds = new Set(items.filter((x) => x.rel.startsWith('themes/') && x.data).map((x) => x.data.id));
  for (const it of items) {
    if (it.error) { err(it.rel, `parse error: ${it.error}`); continue; }
    const kind = it.rel.split('/')[0];
    const d = it.data;
    const need = (k, type) => {
      if (d[k] === undefined || d[k] === '') return err(it.rel, `missing ${k}`);
      if (type && typeof d[k] !== type) err(it.rel, `${k} must be ${type}`);
    };
    if (!['events', 'eras', 'themes', 'pages'].includes(kind)) { err(it.rel, 'file outside events/, eras/, themes/, pages/'); continue; }
    need('id', 'string');
    if (typeof d.id === 'string') {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(d.id)) err(it.rel, `id "${d.id}" must be kebab-case`);
      if (it.rel.split('/').pop() !== `${d.id}.md`) err(it.rel, `filename must be ${d.id}.md`);
      if (ids[kind].has(d.id)) err(it.rel, `duplicate id ${d.id}`);
      ids[kind].add(d.id);
    }
    if (kind === 'events') {
      need('year', 'number'); need('title', 'string'); need('theme', 'string'); need('wiki', 'string');
      if (d.date !== undefined) checkDate(d, (m) => err(it.rel, m));
      if (d.endYear !== undefined && (typeof d.endYear !== 'number' || d.endYear < d.year)) err(it.rel, 'endYear must be a number >= year');
      if (!Number.isInteger(d.level) || d.level < 1 || d.level > 6) err(it.rel, 'level must be an integer 1-6');
      if (typeof d.year === 'number' && (d.year < -10000 || d.year > 2026.99)) err(it.rel, 'year outside the Human Era');
      if (d.theme && !themeIds.has(d.theme)) err(it.rel, `unknown theme ${d.theme}`);
      if (!Array.isArray(d.sources) || d.sources.length < 1) err(it.rel, 'needs at least one source');
      else for (const s of d.sources) {
        if (!s || !['book', 'wikipedia'].includes(s.type)) err(it.rel, 'source.type must be book or wikipedia');
        else if (!s.label) err(it.rel, 'source.label required');
        else if (s.type === 'wikipedia' && !/^https:\/\/en\.wikipedia\.org\/wiki\//.test(s.url || '')) err(it.rel, 'wikipedia source needs an en.wikipedia.org url');
      }
      if (d.image !== undefined) {
        const im = d.image;
        if (!(im && typeof im === 'object' && im.url && im.credit && im.licence)) err(it.rel, 'image needs url, credit and licence');
        else {
          if (!/^https:\/\/\S+$/.test(im.url)) err(it.rel, 'image.url must be an https URL');
          if (![im.credit, im.licence].every((v) => typeof v === 'string')) err(it.rel, 'image.credit and image.licence must be strings');
          else if (!FREE_LICENCE.test(im.licence)) err(it.rel, `image.licence "${im.licence}" is not a free licence (use CC0, Public domain, CC BY or CC BY-SA)`);
          if (/^https:\/\/\S+$/.test(im.url) && !/^https:\/\/(upload|thumb|commons)\.wikimedia\.org\//.test(im.url)) err(it.rel, 'image.url must be a Wikimedia Commons URL');
        }
      }
      if (d.thenNow !== undefined) checkThenNow(d, (m) => err(it.rel, m), root);
      if (!it.body.trim()) err(it.rel, 'empty body');
    } else if (kind === 'pages') {
      need('title', 'string'); need('kind', 'string'); need('order', 'number');
      if (!['intro', 'explainer', 'tour', 'trail', 'daylife'].includes(d.kind)) err(it.rel, 'kind must be intro, explainer, tour, trail or daylife');
      if (d.kind === 'intro') {
        if (d.focusHE !== 'now' && typeof d.focusHE !== 'number') err(it.rel, 'focusHE must be a number or now');
        need('spanYears', 'number');
      }
      if (d.kind === 'tour') {
        need('eventId', 'string'); need('spanYears', 'number');
        if (typeof d.eventId === 'string' && !items.some((x) => x.rel === `events/${d.eventId}.md`)) err(it.rel, `unknown eventId ${d.eventId}`);
      }
      if (d.kind === 'daylife') checkDayInLife(d, (m) => err(it.rel, m), root);
      if (!it.body.trim()) err(it.rel, 'empty body');
      if (d.id === 'compare-facts') checkCompareFacts(it, items, (m) => err(it.rel, m));
    } else if (kind === 'eras') {
      need('label', 'string'); need('startYear', 'number'); need('endYear', 'number'); need('color', 'string');
      need('fact', 'string');
      if (typeof d.fact === 'string' && (d.fact.length > 220 || !/[.!?]$/.test(d.fact))) err(it.rel, 'fact must be one sentence of at most 220 characters');
      const fs = d.factSource;
      if (!(fs && typeof fs === 'object' && typeof fs.label === 'string' && fs.label && /^https:\/\/\S+$/.test(fs.url || ''))) err(it.rel, 'factSource needs a label and an https url');
    } else {
      need('label', 'string'); need('color', 'string');
    }
  }
  return errors;
}
