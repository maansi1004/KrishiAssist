// KrishiAssist web app: every screen. All user-facing wording comes from the central translations
// (src/i18n): static text via t(), scheme data via useSchemeText(), eligibility sentences via
// ruleMessage(), API errors via their `code`. There is no language-specific text in this file.
import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { MatchesPage, type Completeness } from './matches';
import { NeedPage } from './need';
import { ActivityPage } from './activity';
import { AdminPage } from './admin';
import { DocumentsPage, ProfileDocuments, DocumentPlan, DocumentSummary } from './documents';
import {
  apiFetch, exists, fieldLabel, getLanguage, changeLanguage, LANGUAGES, loadSchemeCatalog, localizeScheme, ruleMessage,
  schemeSentence, t as tNow, useSchemeText, useTranslation, apiErrorMessage, type Lang, type Params,
} from './i18n';
import { AssistantPage, ApplicationModal, ApplicationsPage, AuthModal, InfoPage, ProfilePage, SavedPage, SchemeGrid, SchemeModal } from './components';
import { VIEWS, type Application, type ChatMessage, type Evaluation, type Profile, type Saved, type Scheme, type View } from './types';

type ViteImportMeta = ImportMeta & { env?: { VITE_API_URL?: string } };
export const API = (((import.meta as ViteImportMeta).env?.VITE_API_URL) || 'http://127.0.0.1:8000').replace(/\/$/, '');

const heroImages = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1523742817523-68e3e8c9c7c8?auto=format&fit=crop&w=2200&q=85',
];
// `query` is what the search looks for (always English, which the search understands best);
// the words shown on screen come from home.chip.* / home.service.*.
const SERVICES = [
  { id: 'equipment', query: 'Farm Equipment Support', image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80' },
  { id: 'crop', query: 'Crop & Insurance Support', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1000&q=80' },
  { id: 'irrigation', query: 'Irrigation & Water Management', image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1000&q=80' },
  { id: 'training', query: 'Training & Skill Development', image: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=1000&q=80' },
];
const CHIPS = [
  { id: 'tractor', query: 'Tractor subsidy' }, { id: 'insurance', query: 'Crop insurance' },
  { id: 'irrigation', query: 'Irrigation support' }, { id: 'seed', query: 'Seed assistance' },
];

// Words used only to guess a category for the search; not shown to anyone.
const categoryWords: Record<string, string[]> = {
  farm_mechanization: ['tractor', 'machinery', 'mechanization', 'equipment', 'ट्रैक्टर', 'मशीनरी', 'मशीनीकरण', 'उपकरण'],
  crop_insurance: ['insurance', 'crop insurance', 'bima', 'बीमा', 'फसल बीमा'],
  irrigation: ['irrigation', 'water', 'सिंचाई', 'पानी'],
  seeds_crops: ['seed', 'seeds', 'crop', 'बीज', 'फसल'],
  training: ['training', 'skill', 'प्रशिक्षण', 'कौशल'],
  financial: ['financial', 'money', 'income', 'grant', 'assistance', 'वित्तीय', 'पैसा', 'अनुदान', 'सहायता'],
  horticulture: ['aromatic', 'horticulture', 'plant', 'बागवानी', 'पौधे', 'सुगंधित'],
};
function inferCategory(q: string) {
  const x = q.toLowerCase();
  for (const [cat, words] of Object.entries(categoryWords)) if (words.some(w => x.includes(w.toLowerCase()))) return cat;
  return undefined;
}

/** A failed API call. The body carries the server's error `code`, which is shown in the selected language. */
class ApiError extends Error {
  constructor(public body: unknown, public fallback: string) { super('api error'); }
}
const readBody = (r: Response) => r.json().catch(() => ({}));

/** Notices are kept as keys / codes and turned into text when drawn, so a toast follows a language change. */
type Notice = { key: string; params?: Params } | { error: unknown; fallback: string } | { text: string };
const noticeText = (n: Notice) => ('key' in n ? tNow(n.key, n.params) : 'text' in n ? n.text : apiErrorMessage(n.error, n.fallback));

export function App() {
  const { t, lang } = useTranslation();
  const { scheme: localize } = useSchemeText();
  const hash = window.location.hash.replace('#', '') as View;
  const [view, setView] = useState<View>(VIEWS.includes(hash) ? hash : 'home');
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searchResults, setSearchResults] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState(localStorage.getItem('ka_token') || '');
  const [user, setUser] = useState<any>(() => { try { return JSON.parse(localStorage.getItem('ka_user') || 'null'); } catch { return null; } });
  const [profile, setProfile] = useState<Profile>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [lastAssistantSchemeCode, setLastAssistantSchemeCode] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [saved, setSaved] = useState<Saved[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evalBusy, setEvalBusy] = useState(false);
  const [applicationScheme, setApplicationScheme] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [needSeed, setNeedSeed] = useState('');
  const [savedTick, setSavedTick] = useState(0);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);

  const say = (key: string, params?: Params) => setNotice({ key, params });
  /** The documents screens report with a sentence they translated at the moment of the event. */
  const setNoticeText = (text: string) => setNotice({ text });
  const sayError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) setNotice({ error: err.body, fallback: err.fallback });
    else if (err instanceof TypeError) say('errors.network');
    else say(fallback);
  };
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonAuth = { 'Content-Type': 'application/json', ...authHeaders };

  // The scheme translation catalog is loaded once; scheme text switches language instantly afterwards.
  useEffect(() => { void loadSchemeCatalog(() => fetch(`${API}/api/i18n/catalog`)); }, []);
  useEffect(() => {
    if (!token) { setCompleteness(null); return; }
    apiFetch(`${API}/api/matches/completeness`, { headers: authHeaders }).then(r => r.ok ? r.json() : null).then(d => setCompleteness(d)).catch(() => setCompleteness(null));
  }, [token, savedTick]);
  useEffect(() => { const id = setInterval(() => setSlide(s => (s + 1) % heroImages.length), 6500); return () => clearInterval(id); }, []);
  useEffect(() => {
    apiFetch(`${API}/api/schemes`).then(r => r.ok ? r.json() : []).then(d => setSchemes(Array.isArray(d) ? d : [])).catch(() => say('errors.loadSchemes')).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!token) { setProfile({}); setProfileLoaded(false); setSaved([]); setApplications([]); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([apiFetch(`${API}/api/profile`, { headers }), apiFetch(`${API}/api/saved-schemes`, { headers }), apiFetch(`${API}/api/applications`, { headers })]).then(async ([p, s, a]) => {
      const pd = await p.json(); const sd = await s.json(); const ad = await a.json();
      if (pd?.profile) setProfile(pd.profile);
      setProfileLoaded(Boolean(pd?.profile)); setSaved(Array.isArray(sd) ? sd : []); setApplications(Array.isArray(ad) ? ad : []);
    }).catch(() => {});
  }, [token]);

  const go = (v: View) => { setView(v); setSelected(null); setEvaluation(null); window.history.replaceState(null, '', `#${v}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const requireLogin = () => { if (!token) { say('app.noticeLogin'); setAuthMode('login'); setAuthOpen(true); return false; } return true; };

  const runSearch = async (raw: string) => {
    const q = raw.trim();
    if (!q) { say('notices.needSearch'); return; }
    if (token) { setNeedSeed(q); go('need'); return; }
    setSearching(true); setSearchActive(true); go('schemes');
    try {
      const r = await apiFetch(`${API}/api/schemes/discover`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ need: q, category: inferCategory(q), profile }) });
      const d = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.searchFailed');
      setSearchResults((d as any[]).map(x => x.scheme));
      if (!(d as any[]).length) say('app.noMatches');
    } catch (err) { sayError(err, 'errors.searchFailed'); } finally { setSearching(false); }
  };
  const submitSearch = (e?: FormEvent) => { e?.preventDefault(); void runSearch(query); };
  const resetSearch = () => { setSearchActive(false); setSearchResults([]); setQuery(''); setNotice(null); };

  const submitAuth = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password } : { name: authForm.name, email: authForm.email, password: authForm.password };
      const r = await apiFetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d: any = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.authFailed');
      localStorage.setItem('ka_token', d.access_token); localStorage.setItem('ka_user', JSON.stringify(d.user));
      setToken(d.access_token); setUser(d.user); setAuthOpen(false);
      say(authMode === 'login' ? 'notices.signedIn' : 'notices.accountCreated'); go('profile');
    } catch (err) { sayError(err, 'errors.authFailed'); }
  };
  const saveProfileTo = async (p: Profile, thenNotice = true) => {
    const r = await apiFetch(`${API}/api/profile`, { method: profileLoaded ? 'PUT' : 'POST', headers: jsonAuth, body: JSON.stringify(p) });
    const d: any = await readBody(r);
    if (!r.ok) throw new ApiError(d, 'errors.profileSaveFailed');
    setProfileLoaded(true); setSavedTick(n => n + 1);
    if (thenNotice) say('app.profileSaved');
    return d;
  };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault(); if (!requireLogin()) return;
    setProfileLoading(true);
    try { const d = await saveProfileTo(profile); setProfile(d.profile || profile); } catch (err) { sayError(err, 'errors.profileSaveFailed'); } finally { setProfileLoading(false); }
  };
  const logout = () => { localStorage.removeItem('ka_token'); localStorage.removeItem('ka_user'); setToken(''); setUser(null); setProfile({}); say('notices.signedOut'); go('home'); };

  const saveScheme = async (s: Scheme) => {
    if (!requireLogin()) return;
    try {
      const r = await apiFetch(`${API}/api/saved-schemes`, { method: 'POST', headers: jsonAuth, body: JSON.stringify({ scheme_code: s.schemeCode }) });
      const d: any = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.saveSchemeFailed');
      setSaved(v => v.some(x => x.schemeCode === s.schemeCode) ? v : [...v, { id: d.id, schemeCode: s.schemeCode, applicationStatus: 'Not Started' }]);
      say('notices.schemeSaved');
    } catch (err) { sayError(err, 'errors.saveSchemeFailed'); }
  };
  const removeSaved = async (code: string) => {
    try { await apiFetch(`${API}/api/saved-schemes/${encodeURIComponent(code)}`, { method: 'DELETE', headers: authHeaders }); setSaved(v => v.filter(x => x.schemeCode !== code)); } catch { /* ignore */ }
  };
  const evaluate = async (s: Scheme) => {
    if (!requireLogin()) return;
    setEvalBusy(true);
    try {
      const r = await apiFetch(`${API}/api/eligibility/evaluate`, { method: 'POST', headers: jsonAuth, body: JSON.stringify({ scheme_code: s.schemeCode, profile }) });
      const d = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.evalFailed');
      setEvaluation(d as Evaluation);
    } catch (err) { sayError(err, 'errors.evalFailed'); } finally { setEvalBusy(false); }
  };
  const answerExtra = (field: string, value: unknown) => setProfile(p => {
    const next = { ...(p.extra_attributes || {}) } as Record<string, unknown>;
    if (value === undefined) delete next[field]; else next[field] = value;
    return { ...p, extra_attributes: next };
  });
  const recheck = async (s: Scheme) => {
    if (!requireLogin()) return;
    setEvalBusy(true);
    try { await saveProfileTo(profile, false); } catch (err) { sayError(err, 'errors.profileSaveFailed'); setEvalBusy(false); return; }
    setEvalBusy(false); await evaluate(s);
  };
  const openMatch = (code: string) => { const s = schemes.find(x => x.schemeCode === code); if (s) { setSelected(s); void evaluate(s); } };
  const matchName = (code: string, fallback: string) => { const s = schemes.find(x => x.schemeCode === code); return s ? localize(s).name : fallback; };
  const applyProfile = async (p: Profile, save: boolean) => {
    setProfile(p);
    if (!save) return;
    try { await saveProfileTo(p); } catch (err) { sayError(err, 'errors.profileSaveFailed'); }
  };

  const downloadReport = async (s: Scheme) => {
    if (!requireLogin()) return;
    setReportBusy(true);
    try {
      // The PDF is built by the server, so it is asked for in the selected language.
      const r = await apiFetch(`${API}/api/reports/scheme/${encodeURIComponent(s.schemeCode)}`, { headers: authHeaders, localized: true });
      if (!r.ok) throw new ApiError(await readBody(r), 'errors.reportFailed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `KrishiAssist_${s.schemeCode}_report.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      const wanted = r.headers.get('X-Report-Language-Requested'); const got = r.headers.get('X-Report-Language');
      say(wanted && got && wanted !== got ? 'notices.reportHindiFallback' : 'notices.reportReady');
    } catch (err) { sayError(err, 'errors.reportFailed'); } finally { setReportBusy(false); }
  };
  const createApplication = async (code: string) => {
    if (!requireLogin()) return;
    try {
      const r = await apiFetch(`${API}/api/applications`, { method: 'POST', headers: jsonAuth, body: JSON.stringify({ scheme_code: code, status: 'Planning' }) });
      const d: any = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.appFailed');
      setApplications(v => [d, ...v.filter(x => x.id !== d.id)]); setApplicationScheme(null); say('notices.appSaved'); go('applications');
    } catch (err) { sayError(err, 'errors.appFailed'); }
  };
  const updateApplication = async (a: Application, status: string) => {
    try {
      const r = await apiFetch(`${API}/api/applications/${a.id}`, { method: 'PUT', headers: jsonAuth, body: JSON.stringify({ status }) });
      const d: any = await readBody(r);
      if (r.ok) setApplications(v => v.map(x => x.id === a.id ? d : x));
    } catch { /* ignore */ }
  };
  const sendAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!assistantText.trim() || assistantBusy) return;
    const q = assistantText.trim();
    setAssistantMessages(m => [...m, { from: 'user', text: q }]); setAssistantText(''); setAssistantBusy(true);
    try {
      const r = await apiFetch(`${API}/api/assistant/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? authHeaders : {}) },
        body: JSON.stringify({ message: q, language: getLanguage(), context_scheme_code: lastAssistantSchemeCode, history: assistantMessages
            .filter(m => Boolean(m.text) && !m.error)
            .slice(-8)
            .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })) }),
      });
      const d: any = await readBody(r);
      if (!r.ok) throw new ApiError(d, 'errors.assistantFailed');
      setAssistantMessages(m => [...m, { from: 'bot', text: d.reply }]);
      setLastAssistantSchemeCode(d.schemes?.[0]?.schemeCode || d.eligibility?.schemeCode || lastAssistantSchemeCode || null);
      if (d.eligibility) setEvaluation(d.eligibility);
    } catch (err) {
      const key = err instanceof ApiError ? undefined : err instanceof TypeError ? 'errors.network' : 'errors.assistantFailed';
      setAssistantMessages(m => [...m, err instanceof ApiError ? { from: 'bot', error: err.body, fallback: err.fallback } : { from: 'bot', key }]);
    } finally { setAssistantBusy(false); }
  };

  const featured = useMemo(() => schemes.filter(s => ['AGR-50', 'PM-KISAN', 'PMFBY', 'NFSM'].includes(s.schemeCode)).slice(0, 4), [schemes]);
  const visibleSchemes = useMemo(() => searchActive ? searchResults : schemes, [schemes, searchResults, searchActive]);
  const navItems: { key: string; view: View }[] = [
    { key: 'nav.home', view: 'home' }, { key: 'nav.schemes', view: 'schemes' }, { key: 'nav.advice', view: 'assistant' },
    { key: 'nav.resources', view: 'resources' }, { key: 'nav.about', view: 'about' }, { key: 'nav.contact', view: 'contact' },
  ];
  const workspaceLink = (v: View, key: string) => <button type="button" className={view === v ? 'matchesLink active' : 'matchesLink'} onClick={() => go(v)}>{t(key)}</button>;
  const serviceCard = (s: typeof SERVICES[number]) => (
    <article className="serviceCard" key={s.id}><img src={s.image} alt={t(`home.service.${s.id}.title`)} />
      <div><h3>{t(`home.service.${s.id}.title`)}</h3><p>{t(`home.service.${s.id}.desc`)}</p>
        <button onClick={() => { setQuery(t(`home.service.${s.id}.title`)); void runSearch(s.query); }}>{t('app.explore')} →</button></div>
    </article>
  );

  return <div className="app">
    <header className="nav">
      <button className="brand" onClick={() => go('home')}><span className="brandMark">◒</span><span><strong>KrishiAssist</strong><small>{t('header.tagline')}</small></span></button>
      <nav>{navItems.map((n, i) => <button key={n.key} className={(i === 0 && view === 'home') || (i === 1 && view === 'schemes') || (i === 2 && view === 'assistant') ? 'active' : ''} onClick={() => go(n.view)}>{t(n.key)}</button>)}</nav>
      <div className="navActions">
        {token && workspaceLink('matches', 'matches.navLabel')}
        {token && workspaceLink('activity', 'nav.activity')}
        {token && workspaceLink('documents', 'documents.navLabel')}
        {token && user?.role === 'admin' && workspaceLink('admin', 'nav.admin')}
        <label className="language"><span>◉</span>
          <select value={lang} onChange={e => changeLanguage(e.target.value as Lang)} aria-label={t('header.language')}>
            {LANGUAGES.map(l => <option key={l} value={l}>{t(`languages.${l}`)}</option>)}
          </select>
        </label>
        {token ? <button className="accountButton" onClick={() => go('profile')}>{user?.name || t('app.profile')}</button>
          : <button className="primary small" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>{t('app.login')}</button>}
      </div>
    </header>
    <main>
      {view === 'home' && <>
        <section className="hero">
          {heroImages.map((img, i) => <div key={img} className="heroImage" style={{ backgroundImage: `url(${img})`, opacity: i === slide ? 1 : 0 }} />)}
          <button className="heroArrow left" onClick={() => setSlide((slide - 1 + heroImages.length) % heroImages.length)}>‹</button>
          <button className="heroArrow right" onClick={() => setSlide((slide + 1) % heroImages.length)}>›</button>
          <div className="heroShade" />
          <div className="heroContent">
            <p className="eyebrow">{t('home.eyebrow')}</p><h1>{t('app.hero')}</h1><p className="heroSub">{t('app.sub')}</p>
            <form className="searchBox" onSubmit={submitSearch}><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('app.search')} />
              <button className="primary" disabled={searching}>{searching ? t('app.searching') : t('app.searchBtn')}</button></form>
            <div className="examples"><span>{t('app.examples')}</span>{CHIPS.map(c => <button type="button" key={c.id} onClick={() => { setQuery(t(`home.chip.${c.id}`)); void runSearch(c.query); }}>{t(`home.chip.${c.id}`)}</button>)}</div>
          </div>
          <div className="slideDots">{heroImages.map((_, i) => <button key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} />)}</div>
        </section>
        <section className="trustStrip">{[1, 2, 3, 4, 5].map(n => <div key={n}><b>{t(`home.trust.${n}.title`)}</b><span>{t(`home.trust.${n}.text`)}</span></div>)}</section>
        <section className="section"><div className="sectionHead"><div><p className="eyebrow dark">{t('home.servicesEyebrow')}</p><h2>{t('app.services')}</h2><p>{t('app.servicesSub')}</p></div><button className="outline" onClick={() => go('schemes')}>{t('app.view')} →</button></div>
          <div className="serviceGrid">{SERVICES.map(serviceCard)}</div></section>
        <section className="section tinted"><div className="sectionHead"><div><p className="eyebrow dark">{t('home.featuredEyebrow')}</p><h2>{t('app.schemes')}</h2><p>{t('app.schemesSub')}</p></div><button className="outline" onClick={() => go('schemes')}>{t('app.find')} →</button></div>
          <SchemeGrid schemes={featured} loading={loading} onSelect={setSelected} saved={saved} onSave={saveScheme} /></section>
        <section className="section why"><div className="whyText"><p className="eyebrow dark">{t('home.whyEyebrow')}</p><h2>{t('app.why')}</h2><p>{t('app.whySub')}</p>
          <div className="whyRows">{[1, 2, 3].map(n => <div key={n}><strong>{`0${n}`}</strong><span><b>{t(`home.why.${n}.title`)}</b><small>{t(`home.why.${n}.text`)}</small></span></div>)}</div></div>
          <div className="quotePanel"><div className="leafLine">KRISHIASSIST</div><blockquote>{t('home.quote')}</blockquote><p>{t('home.quoteSub')}</p></div></section>
        <section className="cta"><div><p className="eyebrow">{t('home.ctaEyebrow')}</p><h2>{t('app.ask')}</h2><p>{t('home.ctaText')}</p></div><button className="primary" onClick={() => go('assistant')}>{t('home.ctaButton')}</button></section>
      </>}
      {view === 'schemes' && <section className="section page">
        <div className="pageIntro"><div><p className="eyebrow dark">{t('schemes.eyebrow')}</p><h2>{t('app.find')}</h2><p>{searchActive ? t('app.searchResults') : t('schemes.searchHelp')}</p>
          <p className="directoryCount"><strong>{searchActive ? searchResults.length : schemes.length}</strong> {searchActive ? t('schemes.matching') : t('schemes.available')}</p></div>
          <button className="outline" onClick={() => go('home')}>← {t('nav.home')}</button></div>
        <form className="directorySearch" onSubmit={submitSearch}><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('app.search')} />
          <button className="primary" disabled={searching}>{searching ? t('app.searching') : t('app.searchBtn')}</button>
          {searchActive && <button type="button" className="outline" onClick={resetSearch}>{t('common.clear')}</button>}</form>
        <SchemeGrid schemes={visibleSchemes} loading={loading || searching} onSelect={setSelected} saved={saved} onSave={saveScheme} />
      </section>}
      {view === 'profile' && <>
        <ProfilePage completeness={completeness} onOpenMatches={() => go('matches')} profile={profile} setProfile={setProfile} onSave={saveProfile} saving={profileLoading} user={user} onLogout={logout} />
        {token && <ProfileDocuments api={API} token={token} notify={setNoticeText} onManage={() => go('documents')} />}
      </>}
      {view === 'assistant' && <AssistantPage messages={assistantMessages} text={assistantText} setText={setAssistantText} onSend={sendAssistant} busy={assistantBusy} />}
      {view === 'matches' && <MatchesPage api={API} token={token} savedTick={savedTick} nameOf={matchName} onOpenScheme={openMatch} onOpenProfile={() => go('profile')} onLogin={() => { requireLogin(); }} onOpenNeed={() => { setNeedSeed(''); go('need'); }} />}
      {view === 'need' && <NeedPage key={needSeed || 'blank'} api={API} token={token} profile={profile as Record<string, any>} seed={needSeed} nameOf={matchName} onOpenScheme={openMatch} onApplyProfile={applyProfile} onOpenProfile={() => go('profile')} onLogin={() => { requireLogin(); }} />}
      {view === 'activity' && <ActivityPage api={API} token={token} nameOf={matchName} onLogin={() => { requireLogin(); }} />}
      {view === 'documents' && <DocumentsPage api={API} token={token} notify={setNoticeText} onLogin={() => { requireLogin(); }} />}
      {view === 'admin' && <AdminPage api={API} token={token} onLogin={() => { requireLogin(); }} />}
      {view === 'saved' && <SavedPage saved={saved} schemes={schemes} onRemove={removeSaved} onSelect={setSelected} onFind={() => go('schemes')} />}
      {view === 'applications' && <ApplicationsPage applications={applications} schemes={schemes}
        docSummary={(code: string) => <DocumentSummary key={code} api={API} token={token} notify={setNoticeText} schemeCode={code} onPrepare={() => setApplicationScheme(code)} />}
        onUpdate={updateApplication} onFind={() => go('schemes')} onPlan={code => setApplicationScheme(code)} />}
      {view === 'support' && <section className="section page"><div className="pageIntro"><div><p className="eyebrow dark">{t('workspace.supportEyebrow')}</p><h2>{t('app.services')}</h2><p>{t('app.servicesSub')}</p></div></div>
        <div className="serviceGrid">{SERVICES.map(serviceCard)}</div></section>}
      {view === 'resources' && <InfoPage kind="resources" onBack={() => go('home')} />}
      {view === 'about' && <InfoPage kind="about" onBack={() => go('home')} />}
      {view === 'contact' && <InfoPage kind="contact" onBack={() => go('home')} />}
    </main>
    <footer>
      <div className="footerBrand"><span className="brandMark">◒</span><div><strong>KrishiAssist</strong><p>{t('header.tagline')}</p></div></div>
      <div><b>{t('footer.explore')}</b><button onClick={() => go('schemes')}>{t('app.find')}</button><button onClick={() => go('assistant')}>{t('app.assistant')}</button></div>
      <div><b>{t('footer.forFarmers')}</b><button onClick={() => go('profile')}>{t('app.profile')}</button><button onClick={() => go('saved')}>{t('app.saved')}</button><button onClick={() => go('applications')}>{t('app.apps')}</button></div>
      <div><b>{t('footer.languages')}</b>{LANGUAGES.map(l => <button key={l} onClick={() => changeLanguage(l)}>{t(`languages.${l}`)}</button>)}</div>
    </footer>
    {selected && <SchemeModal scheme={selected} saved={saved.some(x => x.schemeCode === selected.schemeCode)} onClose={() => setSelected(null)} onSave={() => saveScheme(selected)} onEvaluate={() => evaluate(selected)}
      onPlan={() => { if (requireLogin()) setApplicationScheme(selected.schemeCode); }} onReport={() => downloadReport(selected)} reportBusy={reportBusy} evalBusy={evalBusy} evaluation={evaluation}
      extra={(profile.extra_attributes || {}) as Record<string, unknown>} onAnswer={answerExtra} onRecheck={() => recheck(selected)} onOpenProfile={() => go('profile')}
      docSummary={token ? <DocumentSummary api={API} token={token} notify={setNoticeText} schemeCode={selected.schemeCode} onPrepare={() => setApplicationScheme(selected.schemeCode)} /> : null} />}
    {applicationScheme && <ApplicationModal scheme={schemes.find(s => s.schemeCode === applicationScheme)!} evaluation={evaluation} onClose={() => setApplicationScheme(null)} onCreate={() => createApplication(applicationScheme)}
      docPlan={token ? <DocumentPlan api={API} token={token} notify={setNoticeText} schemeCode={applicationScheme} onManage={() => { setApplicationScheme(null); go('documents'); }} /> : null} />}
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} onSubmit={submitAuth} onClose={() => setAuthOpen(false)} />}
    {notice && <button className="toast" onClick={() => setNotice(null)}>{noticeText(notice)}<span>×</span></button>}
  </div>;
}

