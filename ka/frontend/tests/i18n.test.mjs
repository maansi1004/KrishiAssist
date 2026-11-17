// Runs against the REAL code: the compiled TypeScript (npm run test:i18n compiles it first), the real
// translation catalog and scheme data, and results from the REAL Python eligibility engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repo = path.resolve(root, '..');
const build = path.join(root, '.test-build');
const require = createRequire(import.meta.url);

// A browser-like localStorage, installed before the modules load.
const storage = { data: {}, getItem(k) { return k in this.data ? this.data[k] : null; }, setItem(k, v) { this.data[k] = String(v); }, removeItem(k) { delete this.data[k]; } };
globalThis.localStorage = storage;

function fresh() { // like a page refresh: forget every loaded module
  for (const k of Object.keys(require.cache)) if (k.startsWith(build)) delete require.cache[k];
  return require(path.join(build, 'i18n/index.js'));
}
let i18n = fresh();
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const components = () => require(path.join(build, 'components.tsx'.replace('.tsx', '.js')));

const catalog = JSON.parse(fs.readFileSync(path.join(repo, 'data/i18n/scheme_text.json'), 'utf8'));
const schemes = JSON.parse(fs.readFileSync(path.join(repo, 'data/schemes.json'), 'utf8'));
const keep = catalog._meta.keep_as_is;
const DEV = /[\u0900-\u097F]/;
const LANGS = ['en', 'hi', 'hinglish'];
i18n.setCatalog(catalog);

/** Runs of 3+ English words in a row: what an untranslated sentence looks like inside Hindi text. */
function englishRuns(text) {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\b[A-Z][A-Z0-9-]{1,}\b/g, ' ')                     // acronyms and scheme codes (PM-KISAN, DBT, AGR-2)
    .replace(/\b(?:KrishiAssist|I-Khedut|Antyodaya|Aadhaar|Krishimela|Gujarat|Haryana|Assam|Goa|Maharashtra|Uttarakhand|Sikkim|Tamil|Nadu|Punjab|Kisan|Samman|Nidhi|Pradhan|Mantri)\b/g, ' ');
  return clean.match(/(?:\b[A-Za-z][a-z]{2,}\b[\s,.;:()/–-]*){3,}/g) || [];
}

const setLang = (l) => i18n.changeLanguage(l);
const evaluations = JSON.parse(execFileSync('python3', ['-c', `
import json, sys
sys.path.insert(0, 'backend')
from app.engines.eligibility_engine import evaluate_scheme
schemes = json.load(open('data/schemes.json', encoding='utf-8'))
profiles = [
  {"state": "Punjab", "farmer_type": "farmer", "land_size_hectares": 1.5, "age": 34, "social_category": "OBC", "gender": "Female", "primary_crop": "wheat", "bank_account_status": "active", "kcc_holder": True},
  {"state": "Gujarat", "farmer_type": "tenant_farmer", "land_size_hectares": 0.5, "age": 61, "social_category": "ST", "gender": "Male"},
  {},
]
print(json.dumps([[evaluate_scheme(s, p) for p in profiles] for s in schemes]))
`], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28 }));

test('language selection is one shared state, persisted, and notifies everyone', () => {
  const seen = [];
  const off = i18n.subscribe(() => seen.push(i18n.getLanguage()));
  setLang('hi'); setLang('hinglish'); setLang('en');
  off();
  assert.deepEqual(seen, ['hi', 'hinglish', 'en']);
  setLang('hi');
  assert.equal(storage.getItem('ka_lang'), 'hi');
  i18n = fresh(); // refresh
  assert.equal(i18n.getLanguage(), 'hi', 'language must survive a refresh');
  i18n.setCatalog(catalog);
  i18n.changeLanguage('xx'); // unsupported: ignored
  assert.equal(i18n.getLanguage(), 'hi');
  setLang('en');
});

test('t() translates, interpolates and returns arrays', () => {
  for (const [l, word] of [['en', 'Land ownership'], ['hi', 'भूमि का स्वामित्व'], ['hinglish', 'Zameen ka malikana haq']]) { setLang(l); assert.equal(i18n.t('fields.land_ownership_type'), word); }
  setLang('hi');
  assert.match(i18n.t('matches.rulesMet', { a: 3, b: 5 }), /5 में से 3/);
  assert.ok(Array.isArray(i18n.t('need.examples', undefined, { returnObjects: true })));
  setLang('en');
});

test('a missing translation is logged, recorded and shown in English; a key missing everywhere is shown as the key', () => {
  i18n.configure({ warnOnMissing: false });
  i18n.clearMissing();
  const res = i18n.__resources || require(path.join(build, 'i18n/core.js')).__resources;
  const saved = res.hi.app.hero; delete res.hi.app.hero;
  setLang('hi');
  assert.equal(i18n.t('app.hero'), res.en.app.hero);
  assert.ok(i18n.getMissing().includes('ui:hi:app.hero'));
  res.hi.app.hero = saved;
  assert.equal(i18n.t('no.such.key'), 'no.such.key');
  assert.ok(i18n.getMissing().includes('ui:en:no.such.key'));
  setLang('en'); i18n.clearMissing();
});

test('getLocalizedText handles plain scheme text and {en, hi, hinglish} objects', () => {
  const o = { en: 'Tractor Purchase Assistance', hi: 'ट्रैक्टर खरीदने के लिए सहायता', hinglish: 'Tractor kharidne ke liye sahayata' };
  for (const l of LANGS) assert.equal(i18n.getLocalizedText(o, l), o[l]);
  assert.equal(i18n.getLocalizedText('Applicant must be a permanent Gujarat resident', 'hi'), 'आवेदक गुजरात का स्थायी निवासी होना चाहिए');
  assert.equal(i18n.getLocalizedText('Applicant must be a permanent Gujarat resident', 'en'), 'Applicant must be a permanent Gujarat resident');
  assert.equal(i18n.getLocalizedText('Applicant must be a permanent Gujarat resident.', 'hinglish'), 'Applicant Gujarat ka sthayi niwasi hona chahiye', 'trailing full stop must not defeat the lookup');
});

test('every scheme is fully localized in Hindi and Hinglish (all fields, all 36 schemes)', () => {
  i18n.clearMissing();
  for (const lang of ['hi', 'hinglish']) {
    for (const s of schemes) {
      const x = i18n.localizeScheme(s, lang);
      const strings = [x.name, x.description, x.department, x.stateLabel, x.categoryLabel, x.levelLabel, ...x.benefits, ...x.conditions, ...x.exclusions, ...x.important, ...x.channels,
        ...x.documents.flatMap((d) => [d.label, d.purpose, d.note]), ...x.steps.flatMap((a) => [a.title, a.description, a.responsibleParty]), ...x.sources.flatMap((r) => [r.title, r.note])].filter(Boolean);
      assert.ok(strings.length > 8, `${s.schemeCode} produced too little content`);
      for (const text of strings) {
        if (lang === 'hi' && !DEV.test(text)) assert.ok(!/[a-z]{4,}/.test(text) || keep.hi.includes(text) || /^[A-Za-z0-9 .\-/&()%₹]+$/.test(text) && !/[a-z]{4,} [a-z]{4,}/.test(text), `${s.schemeCode} [hi] not translated: ${text}`);
        if (lang === 'hinglish') assert.ok(!DEV.test(text), `${s.schemeCode} [hinglish] has Devanagari: ${text}`);
      }
    }
  }
  assert.deepEqual(i18n.getMissing().filter((m) => m.startsWith('scheme:')), [], 'no scheme text may fall back to English');
});

test('previously reported untranslated examples are translated', () => {
  const byCode = Object.fromEntries(schemes.map((s) => [s.schemeCode, s]));
  assert.match(i18n.localizeScheme(byCode['HR-AGRI-PWD-001'], 'hi').name, /दिव्यांगजनों/);
  assert.match(i18n.localizeScheme(byCode['GA-MANURE-001'], 'hi').name, /खाद/);
  assert.equal(i18n.localizeScheme(byCode['AGR-2'], 'hi').conditions[0], 'आवेदक गुजरात का स्थायी निवासी होना चाहिए');
  assert.equal(i18n.localizeScheme(byCode['AGR-2'], 'hi').categoryLabel, 'कृषि मशीनीकरण');
  assert.equal(i18n.localizeScheme(byCode['GA-MANURE-001'], 'hinglish').categoryLabel, 'Organic Farming');
});

test('eligibility sentences come from rule codes in the selected language (real engine output)', () => {
  let n = 0;
  for (const lang of LANGS) {
    setLang(lang);
    for (const perScheme of evaluations) for (const result of perScheme) {
      for (const c of [...result.criteria, ...result.exclusions, ...result.verificationCriteria]) {
        const msg = i18n.ruleMessage(c); n++;
        assert.ok(msg && !/\{\{|^eligibility\./.test(msg), `bad message for ${c.field}: ${msg}`);
        if (lang === 'hi') assert.deepEqual(englishRuns(msg), [], `English in Hindi message: ${msg}`);
      }
    }
  }
  assert.ok(n > 500, `expected many criteria, got ${n}`);
  const mismatch = evaluations.flat().flatMap((r) => r.criteria).find((c) => c.ruleCode === 'RESIDENCY_MISMATCH');
  assert.ok(mismatch, 'a residency mismatch must exist in the fixture');
  setLang('hi'); assert.match(i18n.ruleMessage(mismatch), /यह योजना .* के लिए है, लेकिन आपकी प्रोफाइल में .* दर्ज है/);
  setLang('hinglish'); assert.match(i18n.ruleMessage(mismatch), /Ye scheme .* ke liye hai/);
  setLang('en'); assert.equal(i18n.ruleMessage(mismatch), `This scheme is for ${mismatch.params.requiredState}, but your profile says Punjab.`);
});

test('results saved before ruleCode existed still render (code derived from stored fields)', () => {
  const old = { field: 'state', operator: 'equals', expected: 'Gujarat', actual: 'Punjab', result: 'FAIL' };
  setLang('hi'); assert.match(i18n.ruleMessage(old), /गुजरात.*पंजाब/);
  assert.equal(i18n.deriveRuleCode({ field: 'age', operator: 'gte', result: 'FAIL' }), 'RULE_FAILED_GTE');
  setLang('en');
});

test('API errors are shown from their code, in the selected language', () => {
  setLang('hi');
  assert.match(i18n.apiErrorMessage({ code: 'RATE_LIMITED', params: { what: 'sign-in', minutes: '2' } }), /साइन-इन.*2 मिनट/);
  assert.equal(i18n.apiErrorMessage({ code: 'SCHEME_NOT_FOUND' }), 'योजना नहीं मिली।');
  assert.equal(i18n.apiErrorMessage({ detail: 'English only text' }), i18n.t('errors.generic'));
  setLang('hinglish'); assert.match(i18n.apiErrorMessage({ code: 'FILE_TOO_LARGE', params: { mb: '5' } }), /5 MB/);
  setLang('en');
});

test('switching language re-renders real components immediately (static + dynamic content)', () => {
  const C = components();
  const ph = {};
  const render = () => renderToStaticMarkup(React.createElement(C.ProfilePage, { profile: { land_ownership_type: 'leased' }, setProfile() {}, onSave() {}, saving: false, user: null, onLogout() {}, completeness: null, onOpenMatches() {} }));
  setLang('en'); const en = render();
  setLang('hi'); const hi = render();
  setLang('hinglish'); const hl = render();
  assert.match(en, /Land ownership/); assert.match(en, />Leased</);
  assert.match(hi, /भूमि का स्वामित्व/); assert.match(hi, /मुख्य फसल/); assert.match(hi, /पट्टे पर/); assert.match(hi, /व्यक्तिगत जानकारी/);
  assert.match(hl, /Zameen ka malikana haq/); assert.match(hl, /Main fasal/);
  assert.deepEqual(englishRuns(hi), [], 'profile page must have no English sentences in Hindi: ' + englishRuns(hi));
  setLang('en');
});

test('scheme modal, evaluation panel and application planner: no English sentences in Hindi (all schemes)', () => {
  const C = components();
  const noop = () => {};
  setLang('hi');
  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i]; const ev = evaluations[i][0];
    const modal = renderToStaticMarkup(React.createElement(C.SchemeModal, { scheme: s, saved: false, onClose: noop, onSave: noop, onEvaluate: noop, onPlan: noop, onReport: noop, reportBusy: false, evalBusy: false, evaluation: ev, extra: {}, onAnswer: noop, onRecheck: noop, onOpenProfile: noop }));
    const plan = renderToStaticMarkup(React.createElement(C.ApplicationModal, { scheme: s, evaluation: ev, onClose: noop, onCreate: noop }));
    for (const html of [modal, plan]) {
      const runs = englishRuns(html);
      assert.deepEqual(runs, [], `${s.schemeCode}: English text in Hindi page: ${JSON.stringify(runs)}`);
    }
    assert.match(modal, /पात्रता की शर्तें/); // "Eligibility conditions" heading is present for every scheme
  }
  setLang('en');
});

test('Hinglish scheme modal is Roman-script Hindi, not English and not Devanagari', () => {
  const C = components(); const noop = () => {};
  const s = schemes.find((x) => x.schemeCode === 'AGR-2'); const ev = evaluations[schemes.indexOf(s)][0];
  setLang('hinglish');
  const html = renderToStaticMarkup(React.createElement(C.SchemeModal, { scheme: s, saved: false, onClose: noop, onSave: noop, onEvaluate: noop, onPlan: noop, onReport: noop, reportBusy: false, evalBusy: false, evaluation: ev, extra: {}, onAnswer: noop, onRecheck: noop, onOpenProfile: noop }));
  assert.match(html, /Applicant Gujarat ka sthayi niwasi hona chahiye/);
  assert.match(html, /Eligibility ki sharten/);
  assert.ok(!DEV.test(html.replace(/हिंदी/g, '')), 'no Devanagari in Hinglish mode');
  setLang('en');
});

test('questions form: option labels and questions follow the language', () => {
  const C = require(path.join(build, 'questions.js'));
  const result = { criteria: [{ field: 'groundwater_category', source: 'extra_attributes', operator: 'in', expected: ['safe'], result: 'UNKNOWN', criterion: 'Collective project groundwater category must be safe' }] };
  const render = () => renderToStaticMarkup(React.createElement(C.QuestionsForm, { result, extra: {}, onAnswer() {}, onRecheck() {}, busy: false, onOpenProfile() {} }));
  setLang('hi'); const hi = render();
  assert.match(hi, /साफ़ नतीजे के लिए ये सवाल भरें/); assert.match(hi, /सुरक्षित/); assert.match(hi, /सामूहिक परियोजना की भूजल श्रेणी सुरक्षित/);
  setLang('en');
});

test('there is exactly one language state in the source', () => {
  const src = path.join(root, 'src');
  const files = fs.readdirSync(src, { recursive: true }).filter((f) => /\.tsx?$/.test(f) && !f.startsWith('i18n'));
  for (const f of files) {
    const code = fs.readFileSync(path.join(src, f), 'utf8');
    assert.ok(!/useState<Lang>/.test(code) && !/getItem\('ka_lang'\)/.test(code) && !/setItem\('ka_lang'/.test(code), `${f} keeps its own language state`);
    assert.ok(!/lang === 'hi' \?/.test(code) && !/lang==='hi'/.test(code), `${f} contains an inline language ternary`);
  }
});

test('locale files and source pass the translation audit', () => {
  execFileSync('node', [path.join(root, 'scripts/i18n-audit.mjs')], { cwd: root, stdio: 'pipe' }); // throws on a non-zero exit
});

// ---- every remaining screen, in every language ------------------------------------------------
const rawKey = /(?:^|>)\s*(?:[a-z][A-Za-z]*\.){1,3}[A-Za-z_-]+\s*(?:<|$)/;   // e.g. >matches.title<
const noop = () => {};
const sampleMatches = {
  profileUsed: true, schemeCount: 3, counts: { ELIGIBLE: 1, ALMOST_ELIGIBLE: 0, VERIFICATION_REQUIRED: 1, NOT_ELIGIBLE: 1 },
  profileCompleteness: { total: 10, filled: 6, percent: 60, complete: false, missing: [{ field: 'primary_crop', label: 'Main crop' }, { field: 'soil_type', label: 'Soil' }] },
  bestForNeed: [],
  groups: {
    ELIGIBLE: [{ schemeCode: 'PM-KISAN', name: 'Pradhan Mantri Kisan Samman Nidhi', state: 'All India', status: 'ELIGIBLE', unverifiedScheme: false, passed: 3, total: 3, questionsToAnswer: 0, profileFieldsMissing: [], otherState: false }],
    VERIFICATION_REQUIRED: [{ schemeCode: 'PMFBY', name: 'PMFBY', state: 'All India', status: 'VERIFICATION_REQUIRED', unverifiedScheme: false, passed: 1, total: 4, questionsToAnswer: 3, profileFieldsMissing: [], otherState: false }],
    NOT_ELIGIBLE: [{ schemeCode: 'AGR-2', name: 'AGR-2', state: 'Gujarat', status: 'NOT_ELIGIBLE', unverifiedScheme: false, passed: 1, total: 4, questionsToAnswer: 0, profileFieldsMissing: [], otherState: true, reason: 'Applicant must be a permanent Gujarat resident', reasonCriterion: 'Applicant must be a permanent Gujarat resident.' }],
  },
};

test('every screen renders in all three languages with no raw keys and (Hindi) no English sentences', () => {
  const C = components();
  const M = require(path.join(build, 'matches.js')), N = require(path.join(build, 'need.js')), A = require(path.join(build, 'activity.js')), D = require(path.join(build, 'documents.js')), AD = require(path.join(build, 'admin.js'));
  const nameOf = (c, f) => f;
  const pages = {
    matchesResults: () => React.createElement(M.MatchResults, { data: sampleMatches, nameOf, onOpen: noop }),
    completeness: () => React.createElement(M.CompletenessBanner, { completeness: sampleMatches.profileCompleteness, onOpenProfile: noop }),
    matchesPage: () => React.createElement(M.MatchesPage, { api: '', token: '', savedTick: 0, nameOf, onOpenScheme: noop, onOpenProfile: noop, onLogin: noop }),
    needPage: () => React.createElement(N.NeedPage, { api: '', token: '', profile: {}, seed: '', nameOf, onOpenScheme: noop, onApplyProfile: noop, onOpenProfile: noop, onLogin: noop }),
    activityPage: () => React.createElement(A.ActivityPage, { api: '', token: '', nameOf, onLogin: noop }),
    documentsPage: () => React.createElement(D.DocumentsPage, { api: '', token: '', notify: noop, onLogin: noop }),
    adminPage: () => React.createElement(AD.AdminPage, { api: '', token: '', onLogin: noop }),
    auth: () => React.createElement(C.AuthModal, { mode: 'register', setMode: noop, form: { name: '', email: '', password: '' }, setForm: noop, onSubmit: noop, onClose: noop }),
    saved: () => React.createElement(C.SavedPage, { saved: [], schemes, onRemove: noop, onSelect: noop, onFind: noop }),
    applications: () => React.createElement(C.ApplicationsPage, { applications: [{ id: 1, schemeCode: 'PM-KISAN', status: 'Planning' }], schemes, onUpdate: noop, onFind: noop, onPlan: noop }),
    assistant: () => React.createElement(C.AssistantPage, { messages: [{ from: 'bot', key: 'errors.network' }, { from: 'bot', error: { code: 'AUTH_REQUIRED' }, fallback: 'errors.assistantFailed' }], text: '', setText: noop, onSend: noop, busy: true }),
    info: () => ['resources', 'about', 'contact'].map((k) => React.createElement(C.InfoPage, { key: k, kind: k, onBack: noop })),
    grid: () => React.createElement(C.SchemeGrid, { schemes, loading: false, onSelect: noop, saved: [], onSave: noop }),
  };
  const outputs = {};
  for (const lang of LANGS) {
    setLang(lang); outputs[lang] = {};
    for (const [name, make] of Object.entries(pages)) {
      const html = [].concat(make()).map((el) => renderToStaticMarkup(el)).join('');
      outputs[lang][name] = html;
      assert.ok(html.length > 40, `${name} rendered nothing in ${lang}`);
      assert.ok(!rawKey.test(html), `${name} [${lang}] shows a raw translation key: ${html.match(rawKey)?.[0]}`);
      if (lang === 'hi') assert.deepEqual(englishRuns(html), [], `${name} [hi]: ${JSON.stringify(englishRuns(html))}`);
    }
  }
  for (const name of Object.keys(pages)) { assert.notEqual(outputs.en[name], outputs.hi[name], `${name}: Hindi equals English`); assert.notEqual(outputs.en[name], outputs.hinglish[name], `${name}: Hinglish equals English`); }
  // dynamic content inside those screens
  assert.match(outputs.hi.matchesResults, /आवेदक गुजरात का स्थायी निवासी होना चाहिए/);       // match reason: scheme text translated
  assert.match(outputs.hinglish.matchesResults, /Applicant Gujarat ka sthayi niwasi hona chahiye/);
  assert.match(outputs.hi.completeness, /मुख्य फसल/);                                           // missing profile fields named in Hindi
  assert.match(outputs.hi.assistant, /कनेक्शन|जारी रखने के लिए कृपया साइन इन/);                 // chat error bubbles from codes
  assert.match(outputs.hi.applications, /योजना बना रहे हैं/);                                   // application status labels
  assert.match(outputs.hi.grid, /कृषि मशीनीकरण/);                                                // category labels on scheme cards
  assert.match(outputs.hi.info, /संपर्क/); assert.match(outputs.hinglish.info, /Hamare|Sampark|ke baare mein/);
  setLang('en');
});

test('activity log events read naturally in every language', () => {
  const A = require(path.join(build, 'activity.js'));
  const names = (c, f) => (c === 'PM-KISAN' ? { en: 'PM-KISAN', hi: 'PM-KISAN', hinglish: 'PM-KISAN' }.en : f);
  const events = [
    ['user_registered', {}], ['login_succeeded', {}], ['login_failed', {}], ['profile_created', { fields_changed: ['state', 'primary_crop'] }], ['profile_updated', { fields_changed: ['soil_type'] }],
    ['evaluation_run', { scheme_code: 'PM-KISAN', status: 'ELIGIBLE' }], ['application_created', { scheme_code: 'PMFBY', status: 'Planning' }],
    ['application_status_changed', { scheme_code: 'PMFBY', from: 'Planning', to: 'Applied' }], ['scheme_saved', { scheme_code: 'PM-KISAN' }], ['scheme_unsaved', { scheme_code: 'PM-KISAN' }],
    ['need_extracted', {}], ['document_uploaded', {}], ['document_downloaded', {}], ['document_deleted', {}], ['document_plan_updated', { scheme_code: 'PMFBY' }], ['something_new', {}],
  ];
  for (const lang of LANGS) {
    setLang(lang);
    for (const [event, payload] of events) {
      const text = A.describeEvent({ event, payload }, names);
      assert.ok(text && !/\{\{|^activity\.events\./.test(text), `${event} [${lang}] -> ${text}`);
      if (lang === 'hi') assert.deepEqual(englishRuns(text), [], `${event} [hi]: ${text}`);
    }
  }
  setLang('hi'); assert.match(A.describeEvent({ event: 'evaluation_run', payload: { scheme_code: 'PM-KISAN', status: 'ELIGIBLE' } }, names), /पात्र/);
  setLang('en');
});
