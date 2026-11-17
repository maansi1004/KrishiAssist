#!/usr/bin/env node
/**
 * Translation audit for the web app. Dependency-free.
 *   node scripts/i18n-audit.mjs           print the report; exit 1 if anything needs fixing
 *   node scripts/i18n-audit.mjs --write   also write docs/translation-audit-report.md (frontend section)
 *
 * Checks
 *   1. every key exists in en, hi and hinglish (no missing keys, no extra keys)
 *   2. no empty values
 *   3. {{placeholders}} are identical in all three languages
 *   4. Hindi is written in Devanagari, Hinglish is not (reviewed exceptions: i18n-allowlist.json)
 *   5. Hindi / Hinglish text identical to English is reported unless reviewed (i18n-allowlist.json)
 *   6. keys used in the code but not defined; keys defined but never used
 *   7. English text hardcoded in components (JSX text, placeholder/title/aria-label/alt)
 *   8. categories/states in the locale files match the backend vocabulary; eligibility rule codes match the backend
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const src = path.join(root, 'src');
const LANGS = ['en', 'hi', 'hinglish'];
const DEV = /[\u0900-\u097F]/;

const load = (l) => JSON.parse(fs.readFileSync(path.join(src, 'i18n/locales', `${l}.json`), 'utf8'));
const flatten = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const key = p ? `${p}.${k}` : k; if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = v; } return out; };
const res = Object.fromEntries(LANGS.map((l) => [l, flatten(load(l))]));
const allow = fs.existsSync(path.join(root, 'i18n-allowlist.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'i18n-allowlist.json'), 'utf8')) : { hi: [], hinglish: [], devanagariInHinglish: [] };
const problems = []; const notes = [];
const add = (kind, where, detail, lang) => problems.push({ kind, where, lang, detail });
const flat = (v) => (Array.isArray(v) ? v.join(' | ') : String(v));

// 1-5
const enKeys = new Set(Object.keys(res.en));
for (const l of ['hi', 'hinglish']) {
  for (const k of enKeys) if (!(k in res[l])) add('missing_key', k, flat(res.en[k]), l);
  for (const k of Object.keys(res[l])) if (!enKeys.has(k)) add('extra_key', k, flat(res[l][k]), l);
}
for (const l of LANGS) for (const [k, v] of Object.entries(res[l])) {
  const parts = Array.isArray(v) ? v : [v];
  if (parts.some((p) => typeof p !== 'string' || !p.trim())) add('empty_value', k, '', l);
}
const ph = (s) => [...String(s).matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');
for (const k of enKeys) for (const l of ['hi', 'hinglish']) {
  if (!(k in res[l])) continue;
  const a = Array.isArray(res.en[k]) ? res.en[k].map(ph).join(';') : ph(res.en[k]);
  const b = Array.isArray(res[l][k]) ? res[l][k].map(ph).join(';') : ph(res[l][k]);
  if (a !== b) add('placeholder_mismatch', k, `en {${a}} vs ${l} {${b}}`, l);
}
for (const [k, v] of Object.entries(res.hi)) {
  const text = flat(v);
  if (!DEV.test(text) && !allow.hi.includes(k) && /[A-Za-z]{3,}/.test(text)) add('hindi_not_devanagari', k, text.slice(0, 80), 'hi');
  if (text === flat(res.en[k]) && !allow.hi.includes(k) && /[A-Za-z]{3,}/.test(text)) add('identical_to_english', k, text.slice(0, 80), 'hi');
}
for (const [k, v] of Object.entries(res.hinglish)) {
  const text = flat(v);
  if (DEV.test(text) && !allow.devanagariInHinglish.includes(k)) add('hinglish_has_devanagari', k, text.slice(0, 80), 'hinglish');
  if (text === flat(res.en[k]) && !allow.hinglish.includes(k) && /[A-Za-z]{3,}/.test(text)) add('identical_to_english', k, text.slice(0, 80), 'hinglish');
}

// 6 usage
const allFiles = fs.readdirSync(src, { recursive: true }).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(src, f));
const files = allFiles.filter((f) => !path.relative(src, f).startsWith('i18n'));
const prefixFns = { mx: 'matches.', nt: 'need.', dt: 'documents.', at: 'activity.' };
const used = new Set(); const dynamicPrefixes = new Set();
for (const f of allFiles) {
  const code = fs.readFileSync(f, 'utf8');
  for (const m of code.matchAll(/\b(t|t0|tNow|tr|exists|mx|nt|dt|at|fieldLabel)\(\s*([`'"])([^`'"]+)\2/g)) {
    const [, fn, , key] = m; if (fn === 'fieldLabel') continue;
    if (m[2] === '`' && key.includes('${')) { dynamicPrefixes.add((prefixFns[fn] || '') + key.split('${')[0]); continue; }
    used.add((prefixFns[fn] || '') + key);
  }
  for (const m of code.matchAll(/\b(?:key|fallbackKey|fallback|placeholderKey)\s*[:=]\s*'([a-zA-Z]+\.[\w.-]+)'/g)) used.add(m[1]);
  for (const m of code.matchAll(/'((?:errors|notices|need|matches|app|common|activity|documents|questions|admin|home|schemes|profile|planner|assistant|header|nav|footer|workspace|info|status|levels)\.[\w.-]+)'/g)) used.add(m[1]);
  for (const m of code.matchAll(/`((?:[a-z]+\.)+)\$\{/g)) dynamicPrefixes.add(m[1]);
}
// aliases resolved at run time inside the components (documents 'loading'/'signInBtn' -> common.*, matches 'd'+status)
const runtimeAliases = new Set(['documents.signInBtn', 'documents.loading', 'matches.d']);
for (const k of used) if (!runtimeAliases.has(k) && !enKeys.has(k) && ![...enKeys].some((e) => e.startsWith(k + '.'))) add('key_used_but_not_defined', k, 'referenced in code', 'en');
const prefixes = [...dynamicPrefixes];
const unused = [...enKeys].filter((k) => !used.has(k) && !prefixes.some((p) => k.startsWith(p)) && ![...used].some((u) => k.startsWith(u + '.')));
const coreDynamic = ['eligibility.rules.', 'eligibility.result.', 'errors.', 'status.', 'categories.', 'states.', 'levels.', 'options.', 'answers.', 'fields.', 'applicationStatus.', 'activity.events.', 'need.note.', 'need.topic.', 'admin.gap.', 'admin.status.', 'languages.', 'home.'];
const reallyUnused = unused.filter((k) => !coreDynamic.some((p) => k.startsWith(p)));
for (const k of reallyUnused) notes.push(`unused key: ${k}`);

// 7 hardcoded text
const SKIP = /^(KrishiAssist|KRISHIASSIST|Admin)$/;
const hard = [];
for (const f of files) {
  const rel = path.relative(src, f); const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line) || /^import /.test(line)) return;
    for (const m of line.matchAll(/(?:placeholder|title|aria-label|alt)="([^"{]*[A-Za-z]{3,}[^"{]*)"/g)) if (!SKIP.test(m[1])) hard.push(`${rel}:${i + 1} attribute "${m[1]}"`);
    for (const m of line.matchAll(/(?<![=\-])>\s*([A-Za-z][A-Za-z ,.'’!?:;&()\/-]{2,})\s*</g)) {
      const text = m[1].trim(); if (!SKIP.test(text) && /[a-z]{3,}/.test(text)) hard.push(`${rel}:${i + 1} text "${text}"`);
    }
  });
}
for (const h of hard) add('hardcoded_text', h, '', 'ui');

// 8 backend agreement
const vocabFile = path.join(repo, 'data/i18n/scheme_text.json');
if (fs.existsSync(vocabFile)) {
  const vocab = JSON.parse(fs.readFileSync(vocabFile, 'utf8')).vocabulary || {};
  for (const kind of ['categories', 'states', 'levels']) for (const [k, item] of Object.entries(vocab[kind] || {})) for (const l of LANGS) {
    if (res[l][`${kind}.${k}`] !== item[l]) add('backend_vocabulary_mismatch', `${kind}.${k}`, `${l}: "${res[l][`${kind}.${k}`]}" vs backend "${item[l]}"`, l);
  }
}
// every scheme-specific question field and every enum answer in schemes.json needs a label
const schemesFile = path.join(repo, 'data/schemes.json');
if (fs.existsSync(schemesFile)) {
  const rules = [];
  const walk = (n) => { if (!n) return; if (n.conditions) n.conditions.forEach(walk); else rules.push(n); };
  for (const s of JSON.parse(fs.readFileSync(schemesFile, 'utf8'))) { walk(s.eligibility); walk(s.exclusions); (s.verificationConditions || []).forEach(walk); (s.benefitLimits || []).forEach((b) => walk(b.condition)); }
  for (const r of rules) {
    if (r.fieldSource !== 'extra_attributes') continue;
    for (const l of LANGS) if (!res[l][`fields.${r.fieldName}`]) add('field_without_label', r.fieldName, 'scheme question field has no label', l);
    const values = Array.isArray(r.expectedValue) ? r.expectedValue : [r.expectedValue];
    for (const v of values) if (typeof v === 'string' && !res.en[`answers.${r.fieldName}.${v}`]) add('answer_option_without_label', `${r.fieldName}.${v}`, 'enum answer has no label', 'en');
  }
}
const rulesPy = path.join(repo, 'backend/app/i18n/rules.py');
if (fs.existsSync(rulesPy)) {
  const py = fs.readFileSync(rulesPy, 'utf8');
  const block = py.slice(py.indexOf('RULE_CODES = ('), py.indexOf(')', py.indexOf('RULE_CODES = (')));
  const codes = [...block.matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
  for (const c of codes) for (const l of LANGS) if (!res[l][`eligibility.rules.${c}`]) add('rule_code_without_text', c, 'backend rule code has no sentence', l);
  for (const k of enKeys) if (k.startsWith('eligibility.rules.') && !codes.includes(k.slice(18))) add('rule_text_without_code', k, 'no such backend rule code', 'en');
  // the sentences themselves must agree (backend uses {name}, web uses {{name}})
  const table = py.slice(py.indexOf('RULE_TEXT'));
  for (const c of codes) for (const l of LANGS) {
    const m = new RegExp(`"${c}": \\{[\\s\\S]*?"${l}": "([^"]+)"`).exec(table);
    if (m && m[1] !== String(res[l][`eligibility.rules.${c}`]).replace(/\{\{\s*(\w+)\s*\}\}/g, '{$1}')) add('rule_text_differs_from_backend', c, l, l);
  }
}

// report
const counts = {}; for (const p of problems) counts[p.kind] = (counts[p.kind] || 0) + 1;
const lines = ['## Web app translation audit', '',
  `* Languages: ${LANGS.join(', ')}`, `* Keys per language: **${enKeys.size}** (hi: ${Object.keys(res.hi).length}, hinglish: ${Object.keys(res.hinglish).length})`,
  `* Source files scanned: ${files.length}`, `* Problems: **${problems.length}**`, ''];
if (!problems.length) lines.push('No missing, empty, untranslated or hardcoded user-facing text was found.', '');
for (const [kind, n] of Object.entries(counts)) {
  lines.push(`### ${kind} (${n})`, '');
  for (const p of problems.filter((x) => x.kind === kind).slice(0, 80)) lines.push(`* \`${p.where}\`${p.lang && p.lang !== 'ui' ? ` [${p.lang}]` : ''}${p.detail ? `: ${p.detail}` : ''}`);
  lines.push('');
}
if (notes.length) lines.push(`### Notes (${notes.length})`, '', ...notes.slice(0, 60).map((n) => `* ${n}`), '');
const report = lines.join('\n');
console.log(report);
if (process.argv.includes('--write')) {
  const out = path.join(repo, 'docs/translation-audit-report.md');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const existing = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  const marker = '\n<!-- FRONTEND-AUDIT -->\n';
  const head = existing.includes(marker) ? existing.slice(0, existing.indexOf(marker)) : existing.replace(/\s+$/, '') + '\n';
  fs.writeFileSync(out, head + marker + `\n_Generated ${new Date().toISOString().slice(0, 10)} by \`npm run i18n:audit -- --write\`._\n\n` + report);
}
process.exit(problems.length ? 1 : 0);
