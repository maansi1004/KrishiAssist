// Presentational screens and dialogs. They hold no language-specific text: wording comes from t(),
// scheme data from useSchemeText(), eligibility sentences from ruleMessage().
import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ProfileSelect, QuestionsForm } from './questions';
import { CompletenessBanner, type Completeness } from './matches';
import { exists, fieldLabel, ruleMessage, schemeSentence, t as tNow, useSchemeText, useTranslation, apiErrorMessage } from './i18n';
import type { Application, ChatMessage, Evaluation, Profile, Saved, Scheme } from './types';
import { RESOURCE_GUIDES, type GuideLanguage } from './data/resourceGuides';

export const APPLICATION_STATUSES = ['Planning', 'Documents Pending', 'Applied', 'Under Verification', 'Approved', 'Rejected', 'Completed'];

const KNOWN_STATUS = ['ELIGIBLE', 'ALMOST_ELIGIBLE', 'NOT_ELIGIBLE', 'VERIFICATION_REQUIRED'];
export const statusText = (s: string) => tNow(`status.${KNOWN_STATUS.includes(s) ? s : 'VERIFICATION_REQUIRED'}`);


export function SchemeGrid({ schemes, loading, onSelect, saved, onSave }: { schemes: Scheme[]; loading: boolean; onSelect: (s: Scheme) => void; saved: Saved[]; onSave: (s: Scheme) => void }) {
  const { t } = useTranslation(); const { scheme: localize } = useSchemeText();
  return <div className="schemeGrid">
    {loading ? <div className="loading">{t('app.searching')}</div> : schemes.map(s => {
      const x = localize(s);
      return <article className="schemeCard" key={s.schemeCode}>
        <div className="schemeTop"><span className="schemeCode">{s.schemeCode}</span><span className="level">{x.levelLabel || t('levels.central')}</span></div>
        <h3>{x.name}</h3><p>{x.description || t('schemes.fallbackDescription')}</p>
        <div className="schemeMeta"><span>{x.stateLabel}</span><span>{x.categoryLabel}</span></div>
        <div className="cardActions"><button className="textBtn" onClick={() => onSelect(s)}>{t('app.viewScheme')} →</button><button className="saveMini" onClick={() => onSave(s)}>{saved.some(v => v.schemeCode === s.schemeCode) ? '✓' : '♡'}</button></div>
      </article>;
    })}
    {!loading && !schemes.length && <div className="empty">{t('app.noMatches')}</div>}
  </div>;
}

export function SchemeModal({ scheme, onClose, onSave, onEvaluate, onPlan, onReport, reportBusy, evalBusy, evaluation, saved, extra, onAnswer, onRecheck, onOpenProfile, docSummary }: {
  docSummary?: React.ReactNode; extra: Record<string, unknown>; onAnswer: (f: string, v: unknown) => void; onRecheck: () => void; onOpenProfile: () => void;
  scheme: Scheme; onClose: () => void; onSave: () => void; onEvaluate: () => void; onPlan: () => void; onReport: () => void; reportBusy: boolean; evalBusy: boolean; evaluation: Evaluation | null; saved: boolean;
}) {
  const { t } = useTranslation(); const { scheme: localize } = useSchemeText();
  const x = localize(scheme);
  const list = (items: string[], ordered = false) => (ordered ? <ol>{items.map((v, i) => <li key={i}>{v}</li>)}</ol> : <ul>{items.map((v, i) => <li key={i}>{v}</li>)}</ul>);
  return <div className="modalBackdrop" onMouseDown={onClose}><div className="modal schemeModal" onMouseDown={e => e.stopPropagation()}>
    <button type="button" className="modalClose" onClick={onClose}>×</button>
    <p className="eyebrow dark">{scheme.schemeCode}</p><h2>{x.name}</h2><p className="modalDesc">{x.description}</p>
    <div className="detailGrid"><div><span>{t('app.location')}</span><b>{x.stateLabel}</b></div><div><span>{t('app.category')}</span><b>{x.categoryLabel}</b></div>
      {x.department && <div><span>{t('schemes.department')}</span><b>{x.department}</b></div>}</div>
    <h3>{t('app.benefit')}</h3>{x.benefits.length ? list(x.benefits) : <p>{t('common.dash')}</p>}
    {x.conditions.length > 0 && <><h3>{t('schemes.eligibilityConditions')}</h3>{list(x.conditions)}</>}
    {x.exclusions.length > 0 && <><h3>{t('schemes.exclusionConditions')}</h3>{list(x.exclusions)}</>}
    {x.important.length > 0 && <><h3>{t('schemes.importantConditions')}</h3>{list(x.important)}</>}
    <div className="modalActions">
      <button type="button" className="outline" onClick={onSave}>{saved ? `✓ ${t('app.saved')}` : t('app.saveScheme')}</button>
      <button type="button" className="outline" onClick={onEvaluate} disabled={evalBusy}>{evalBusy ? t('common.checking') : t('app.checkEligibility')}</button>
      <button type="button" className="primary" onClick={onPlan}>{t('app.planApplication')}</button>
      <button type="button" className="outline" onClick={onReport} disabled={reportBusy}>{reportBusy ? t('common.generating') : t('app.report')}</button>
    </div>
    {evaluation && <><EvaluationPanel result={evaluation} /><QuestionsForm result={evaluation} extra={extra} onAnswer={onAnswer} onRecheck={onRecheck} busy={evalBusy} onOpenProfile={onOpenProfile} /></>}
    {docSummary}
    <h3>{t('app.documents')}</h3>{x.documents.length ? list(x.documents.map(d => d.label)) : <p>{t('common.dash')}</p>}
    <h3>{t('app.applicationSteps')}</h3>{x.steps.length ? <ol>{x.steps.slice(0, 12).map((a, i) => <li key={i}><b>{a.title}</b> — {a.description}</li>)}</ol> : <p>{t('common.dash')}</p>}
    {x.channels.length > 0 && <><h3>{t('schemes.channels')}</h3>{list(x.channels)}</>}
    <h3>{t('app.official')}</h3>
    {x.sources.length > 0 && <ul>{x.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : <b>{s.title}</b>}{s.note && <small> — {s.note}</small>}</li>)}</ul>}
    {scheme.officialPortals?.length ? <div className="sourceList">{scheme.officialPortals.map((u: string) => <a key={u} href={u} target="_blank" rel="noreferrer">{t('schemes.openPortal')}</a>)}</div> : <p>{t('schemes.sourceUnverified')}</p>}
  </div></div>;
}

export function EvaluationPanel({ result }: { result: Evaluation }) {
  const { t } = useTranslation();
  return <div className={`evaluationPanel ${result.status.toLowerCase()}`}>
    <div className="resultHeader"><span className="resultBadge">{statusText(result.status)}</span></div>
    {result.unverifiedScheme && <p className="unverifiedNote">{t('questions.unverified')}</p>}
    <h3>{t('app.whyResult')}</h3>
    <ul className="criteriaList">{result.criteria.map((c: any, i: number) => <li key={i}><span className={`criterionDot ${c.result.toLowerCase()}`}></span><div><b>{schemeSentence(c.criterion)}</b><small>{ruleMessage(c)}</small></div></li>)}</ul>
    {result.remediation.length > 0 && <><h4>{t('app.next')}</h4><ul>{result.remediation.map((x: string, i: number) => <li key={i}>{schemeSentence(x)}</li>)}</ul></>}
    <p className="sourceNote">{t('app.sourceNote')}</p>
  </div>;
}

export function AuthModal({ mode, setMode, form, setForm, onSubmit, onClose }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; form: any; setForm: (f: any) => void; onSubmit: (e: FormEvent) => void; onClose: () => void }) {
  const { t } = useTranslation();
  return <div className="modalBackdrop" onMouseDown={onClose}><form className="modal authModal" onSubmit={onSubmit} onMouseDown={e => e.stopPropagation()}>
    <button type="button" className="modalClose" onClick={onClose}>×</button>
    <p className="eyebrow dark">KRISHIASSIST</p><h2>{t('app.loginTitle')}</h2><p>{t('app.loginSub')}</p>
    {mode === 'register' && <label>{t('app.name')}<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} /></label>}
    <label>{t('app.email')}<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
    <label>{t('app.password')}<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} /></label>
    <button type="submit" className="primary wide">{mode === 'login' ? t('app.signIn') : t('app.register')}</button>
    <button type="button" className="switchAuth" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? `${t('app.newAccount')} ${t('app.register')}` : `${t('app.existing')} ${t('app.signIn')}`}</button>
  </form></div>;
}

export function ProfilePage({ profile, setProfile, onSave, saving, user, onLogout, completeness, onOpenMatches }: {
  completeness: Completeness | null; onOpenMatches: () => void; profile: Profile; setProfile: (p: Profile) => void; onSave: (e: FormEvent) => void; saving: boolean; user: any; onLogout: () => void;
}) {
  const { t } = useTranslation();
  const field = (key: keyof Profile, type = 'text', placeholderKey?: string) => (
    <label>{fieldLabel(key)}<input type={type} placeholder={placeholderKey ? t(placeholderKey) : undefined} value={(profile[key] as any) ?? ''}
      onChange={e => setProfile({ ...profile, [key]: type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value })} /></label>
  );
  const select = (key: keyof Profile) => <ProfileSelect field={key} label={fieldLabel(key)} value={profile[key] as string | undefined} onChange={v => setProfile({ ...profile, [key]: v })} />;
  return <section className="section page">
    <div className="pageIntro"><div><p className="eyebrow dark">{t('workspace.eyebrow')}</p><h2>{t('app.profileTitle')}</h2><p>{t('app.profileSub')}</p></div><button className="outline" onClick={onLogout}>{t('app.signOut')}</button></div>
    <CompletenessBanner completeness={completeness} showDone onOpenMatches={onOpenMatches} />
    <form className="profileForm" onSubmit={onSave}>
      <div className="formSection"><h3>{t('profile.personal')}</h3><div className="formGrid">
        <label>{t('app.name')}<input type="text" value={profile.farmer_name ?? ''} onChange={e => setProfile({ ...profile, farmer_name: e.target.value })} /></label>
        {field('age', 'number')}{select('gender')}{select('farmer_type')}</div></div>
      <div className="formSection"><h3>{t('profile.farmLocation')}</h3><div className="formGrid">
        {select('state')}{field('district', 'text', 'profile.placeholder.district')}{field('block', 'text', 'profile.placeholder.block')}{field('village', 'text', 'profile.placeholder.village')}
        {field('land_size_hectares', 'number')}{select('land_ownership_type')}{select('primary_crop')}{select('irrigation_type')}{select('soil_type')}</div></div>
      <div className="formSection"><h3>{t('profile.financial')}</h3><div className="formGrid">
        {select('bank_account_status')}{select('social_category')}{field('income_category', 'text', 'profile.placeholder.income_category')}{field('years_of_cultivation', 'number')}
        <label>{fieldLabel('kcc_holder')}<select value={profile.kcc_holder === undefined ? '' : String(profile.kcc_holder)} onChange={e => setProfile({ ...profile, kcc_holder: e.target.value === '' ? undefined : e.target.value === 'true' })}>
          <option value="">{t('common.notProvided')}</option><option value="true">{t('common.yes')}</option><option value="false">{t('common.no')}</option></select></label></div></div>
      <button className="primary" disabled={saving}>{saving ? t('common.saving') : t('app.saveChanges')}</button>
    </form>
    {user && <p className="signedInAs">{t('app.signedIn')} {user.email}</p>}
  </section>;
}

export function SavedPage({ saved, schemes, onRemove, onSelect, onFind }: { saved: Saved[]; schemes: Scheme[]; onRemove: (code: string) => void; onSelect: (s: Scheme) => void; onFind: () => void }) {
  const { t } = useTranslation(); const { scheme: localize } = useSchemeText();
  const items = saved.map(v => schemes.find(s => s.schemeCode === v.schemeCode)).filter(Boolean) as Scheme[];
  return <section className="section page"><div className="pageIntro"><div><p className="eyebrow dark">{t('workspace.eyebrow')}</p><h2>{t('app.saved')}</h2><p>{t('app.schemesSub')}</p></div></div>
    {items.length === 0 ? <div className="emptyPanel"><h3>{t('app.noSaved')}</h3><button className="primary" onClick={onFind}>{t('app.find')}</button></div>
      : <div className="schemeGrid">{items.map(s => { const x = localize(s); return <article className="schemeCard" key={s.schemeCode}><span className="schemeCode">{s.schemeCode}</span><h3>{x.name}</h3><p>{x.description}</p>
        <div className="cardActions"><button className="textBtn" onClick={() => onSelect(s)}>{t('app.viewScheme')} →</button><button className="outline" onClick={() => onRemove(s.schemeCode)}>{t('app.remove')}</button></div></article>; })}</div>}
  </section>;
}

export function ApplicationsPage({ applications, schemes, onUpdate, onFind, onPlan, docSummary }: {
  docSummary?: (code: string) => React.ReactNode; applications: Application[]; schemes: Scheme[]; onUpdate: (a: Application, s: string) => void; onFind: () => void; onPlan: (code: string) => void;
}) {
  const { t } = useTranslation(); const { scheme: localize } = useSchemeText();
  return <section className="section page"><div className="pageIntro"><div><p className="eyebrow dark">{t('workspace.eyebrow')}</p><h2>{t('app.applicationsTitle')}</h2><p>{t('app.applicationsSub')}</p></div></div>
    {applications.length === 0 ? <div className="emptyPanel"><h3>{t('app.emptyApps')}</h3><button className="primary" onClick={onFind}>{t('app.find')}</button></div>
      : <div className="applicationList">{applications.map(a => {
        const s = schemes.find(x => x.schemeCode === a.schemeCode); const x = s ? localize(s) : null; const firstStep = x?.steps[0];
        return <article className="applicationCard" key={a.id}><div className="applicationMain"><span className="schemeCode">{a.schemeCode}</span><h3>{x?.name || a.schemeCode}</h3>
          {firstStep && <p className="applicationNext"><b>{t('app.next')}:</b> {firstStep.title} — {firstStep.description}</p>}{docSummary && docSummary(a.schemeCode)}</div>
          <div className="applicationControls"><label>{t('app.status')}<select value={a.status} onChange={e => onUpdate(a, e.target.value)}>
            {APPLICATION_STATUSES.map(v => <option key={v} value={v}>{exists(`applicationStatus.${v}`) ? t(`applicationStatus.${v}`) : v}</option>)}</select></label>
            {s && <button type="button" className="outline" onClick={() => onPlan(a.schemeCode)}>{t('app.viewPlan')}</button>}</div></article>;
      })}</div>}
  </section>;
}

export function ApplicationModal({ scheme, onClose, onCreate, evaluation, docPlan }: { docPlan?: React.ReactNode; scheme: Scheme; onClose: () => void; onCreate: () => void; evaluation: Evaluation | null }) {
  const { t } = useTranslation(); const { scheme: localize } = useSchemeText();
  const x = localize(scheme); const portals = scheme.officialPortals || [];
  const gaps = evaluation ? [...(evaluation.missingRequirements || []), ...(evaluation.verificationRequired || [])] : [];
  const docKind = (d: any) => (d?.requiredType === 'required' ? t('documents.required') : d?.requiredType === 'conditional' ? t('documents.conditional') : d?.requiredType ? t('documents.verification') : '');
  return <div className="modalBackdrop" onMouseDown={onClose}><div className="modal applicationPlanner" onMouseDown={e => e.stopPropagation()}>
    <button type="button" className="modalClose" onClick={onClose}>×</button>
    <p className="eyebrow dark">{t('planner.eyebrow')}</p><h2>{x.name}</h2><p className="plannerIntro">{t('planner.intro')}</p>
    {evaluation && <div className="plannerSection plannerStatus"><h3>{t('planner.eligibilityStatus')}</h3><span className={`resultBadge ${evaluation.status.toLowerCase()}`}>{statusText(evaluation.status)}</span>
      {gaps.length > 0 && <p>{t('app.missing')}: {gaps.map(g => fieldLabel(g)).join(', ')}</p>}</div>}
    {docPlan ? docPlan : <div className="plannerSection"><h3>1. {t('app.documents')}</h3>{x.documents.length ? <ul className="plannerDocuments">{x.documents.map((d, i) => <li className="plannerDocument" key={i}><span className="plannerCheck">☐</span>
      <div><b>{d.label}</b>{docKind(d) && <small>{docKind(d)}</small>}{d.purpose && <small>{d.purpose}</small>}</div></li>)}</ul> : <p>{t('planner.docsVerify')}</p>}</div>}
    <div className="plannerSection"><h3>2. {t('app.next')}</h3>{x.steps.length ? <ol className="plannerSteps">{x.steps.map((a, i) => <li className="plannerStep" key={i}><span className="plannerStepNumber">{a.step || i + 1}</span>
      <div><b>{a.title}</b><p>{a.description}</p>{a.responsibleParty && <small>{a.responsibleParty}</small>}</div></li>)}</ol> : <p>{t('planner.stepsVerify')}</p>}</div>
    <div className="plannerSection"><h3>3. {t('planner.official')}</h3>{portals.length ? <div className="plannerOfficial">{portals.map((u: string) => <a key={u} href={u} target="_blank" rel="noreferrer" className="outline">{t('schemes.openPortal')}</a>)}</div> : <p>{t('planner.channelVerify')}</p>}</div>
    <div className="plannerSection plannerNote"><b>{t('planner.noteTitle')}</b><p>{t('planner.note')}</p></div>
    <div className="plannerActions"><button type="button" className="outline" onClick={onClose}>{t('common.close')}</button><button type="button" className="primary" onClick={onCreate}>{t('app.saveApp')}</button></div>
  </div></div>;
}

const RESOURCE_CATEGORIES = ['crop', 'soil', 'water', 'pest', 'seeds', 'insurance'] as const;
const RESOURCE_ITEMS = [
  { id: 'crop', icon: '🌱', category: 'crop', title: 'cropTitle', text: 'cropText', tags: ['crop', 'planning'] },
  { id: 'soil', icon: '🧪', category: 'soil', title: 'soilTitle', text: 'soilText', tags: ['soil', 'fertilizer'] },
  { id: 'water', icon: '💧', category: 'water', title: 'waterTitle', text: 'waterText', tags: ['water', 'irrigation'] },
  { id: 'pest', icon: '🐛', category: 'pest', title: 'pestTitle', text: 'pestText', tags: ['pest', 'disease'] },
  { id: 'seeds', icon: '🌾', category: 'seeds', title: 'seedsTitle', text: 'seedsText', tags: ['seed', 'machinery'] },
  { id: 'insurance', icon: '🛡️', category: 'insurance', title: 'insuranceTitle', text: 'insuranceText', tags: ['insurance', 'risk'] },
] as const;
const OFFICIAL_RESOURCES = [
  { key: 'pmkisan', url: 'https://pmkisan.gov.in/' },
  { key: 'pmfby', url: 'https://pmfby.gov.in/' },
  { key: 'soil', url: 'https://soilhealth.dac.gov.in/' },
  { key: 'agricoop', url: 'https://agriwelfare.gov.in/' },
];

export function InfoPage({ kind, onBack }: { kind: 'resources' | 'about' | 'contact'; onBack: () => void }) {
  const { t, lang } = useTranslation();
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const resources = useMemo(() => RESOURCE_ITEMS.filter(item => {
    const categoryMatch = category === 'all' || item.category === category;
    const q = search.trim().toLowerCase();
    const text = `${t(`info.resources.${item.title}`)} ${t(`info.resources.${item.text}`)} ${item.tags.join(' ')}`.toLowerCase();
    return categoryMatch && (!q || text.includes(q));
  }), [category, search, t]);
  const copyContactDraft = async (e: FormEvent) => {
    e.preventDefault();
    const draft = `${t('info.contact.formTitle')}\n${t('info.contact.name')}: ${name}\n${t('info.contact.email')}: ${email}\n${t('info.contact.topic')}: ${t(`info.contact.topics.${topic}`)}\n\n${message}`;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyState('copied');
    } catch { setCopyState('error'); }
  };

  if (kind === 'resources') return <section className="infoPage resourcesPage">
    <div className="resourceHero"><div className="resourceHeroInner"><p className="eyebrow">{t('info.resources.eyebrow')}</p><h1>{t('info.resources.title')}</h1><p>{t('info.resources.text')}</p>
      <label className="resourceSearch"><span aria-hidden="true">⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('info.resources.searchPlaceholder')} aria-label={t('info.resources.searchPlaceholder')} /><span className="resourceSearchHint">{t('info.resources.searchHint')}</span></label>
    </div><div className="resourceHeroArt" aria-hidden="true"><span>🌿</span><span>🌾</span><span>☀️</span></div></div>
    <div className="infoContent"><div className="resourceSectionHead"><div><p className="eyebrow dark">{t('info.resources.libraryEyebrow')}</p><h2>{t('info.resources.libraryTitle')}</h2><p>{t('info.resources.libraryText')}</p></div><span className="resourceCount">{resources.length} {t('info.resources.results')}</span></div>
      <div className="resourceFilters"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>{t('info.resources.all')}</button>{RESOURCE_CATEGORIES.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{t(`info.resources.categories.${c}`)}</button>)}</div>
      <div className="resourceCards">{resources.map(item => <button type="button" className="resourceCard resourceCardButton" key={item.id} onClick={() => setActiveGuide(item.id)} aria-haspopup="dialog">
          <div className="resourceIcon">{item.icon}</div><span className="resourceCategory">{t(`info.resources.categories.${item.category}`)}</span><h3>{t(`info.resources.${item.title}`)}</h3><p>{t(`info.resources.${item.text}`)}</p><span className="resourceReadMore">{t('info.resources.practicalTip')} →</span>
        </button>)}
        {!resources.length && <div className="resourceEmpty"><b>{t('info.resources.noResults')}</b><p>{t('info.resources.noResultsText')}</p><button className="outline" onClick={() => { setSearch(''); setCategory('all'); }}>{t('info.resources.clearFilters')}</button></div>}
      </div>
      {activeGuide && RESOURCE_GUIDES[activeGuide] && (() => {
        const guide = RESOURCE_GUIDES[activeGuide][lang as GuideLanguage];
        return <div className="resourceGuideOverlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setActiveGuide(null); }}>
          <section className="resourceGuideDialog" role="dialog" aria-modal="true" aria-labelledby="resource-guide-title">
            <div className="resourceGuideHeader"><div><p className="eyebrow dark">{t('info.resources.guideEyebrow')}</p><h2 id="resource-guide-title">{guide.title}</h2><p>{guide.summary}</p></div>
              <button type="button" className="resourceGuideClose" onClick={() => setActiveGuide(null)} aria-label={t('common.close')}>×</button></div>
            <nav className="resourceGuideToc" aria-label={t('info.resources.guideContents')}>{guide.sections.map((section, index) => <a key={section.title} href={`#resource-guide-${activeGuide}-${index}`}>{section.title}</a>)}</nav>
            <div className="resourceGuideSections">{guide.sections.map((section, index) => <article id={`resource-guide-${activeGuide}-${index}`} key={section.title}>
              <h3>{section.title}</h3><p>{section.intro}</p><ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>
            </article>)}</div>
            <div className="resourceGuideNotice"><b>{t('info.resources.guideSafetyTitle')}</b><p>{t('info.resources.guideSafety')}</p></div>
            <div className="resourceGuideFooter"><span>{t('info.resources.guideSourceNote')}</span><button type="button" className="primary" onClick={() => setActiveGuide(null)}>{t('common.close')}</button></div>
          </section>
        </div>;
      })()}
      <div className="officialSection"><div><p className="eyebrow dark">{t('info.resources.officialEyebrow')}</p><h2>{t('info.resources.officialTitle')}</h2><p>{t('info.resources.officialText')}</p></div><div className="officialLinks">{OFFICIAL_RESOURCES.map(item => <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer"><span><b>{t(`info.resources.official.${item.key}`)}</b><small>{t(`info.resources.official.${item.key}Text`)}</small></span><strong aria-hidden="true">↗</strong></a>)}</div></div>
      <div className="resourceDisclaimer">ⓘ {t('info.resources.disclaimer')}</div>
      <button className="outline infoBack" onClick={onBack}>{t('common.backHome')}</button>
    </div>
  </section>;

  if (kind === 'about') return <section className="infoPage aboutPage">
    <div className="aboutHero"><p className="eyebrow">{t('info.about.eyebrow')}</p><h1>{t('info.about.title')}</h1><p>{t('info.about.text')}</p><div className="aboutHeroFoot"><span>01 — {t('info.about.heroTag')}</span><span>KRISHIASSIST · INDIA</span></div></div>
    <div className="infoContent aboutContent"><div className="aboutProblem"><div><p className="eyebrow dark">{t('info.about.whyEyebrow')}</p><h2>{t('info.about.whyTitle')}</h2></div><p>{t('info.about.whyText')}</p></div>
      <div className="aboutSolution"><div className="aboutSolutionMark">◒</div><div><p className="eyebrow">{t('info.about.solutionEyebrow')}</p><h2>{t('info.about.solutionTitle')}</h2><p>{t('info.about.solutionText')}</p></div></div>
      <div className="aboutWorkflow"><p className="eyebrow dark">{t('info.about.workflowEyebrow')}</p><h2>{t('info.about.workflowTitle')}</h2><div className="workflowSteps">{['profile','discover','check','prepare'].map((step, i) => <article key={step}><span>0{i + 1}</span><h3>{t(`info.about.steps.${step}Title`)}</h3><p>{t(`info.about.steps.${step}Text`)}</p></article>)}</div></div>
      <div className="aboutPrinciples"><p className="eyebrow dark">{t('info.about.principlesEyebrow')}</p><h2>{t('info.about.principlesTitle')}</h2><div className="principleGrid">{['accessible','transparent','privacy','farmerFirst'].map((item, i) => <article key={item}><span>{['◎','◈','⌑','✳'][i]}</span><h3>{t(`info.about.principles.${item}Title`)}</h3><p>{t(`info.about.principles.${item}Text`)}</p></article>)}</div></div>
      <div className="aboutCaution"><b>{t('info.about.importantTitle')}</b><p>{t('info.about.importantText')}</p></div><button className="outline infoBack" onClick={onBack}>{t('common.backHome')}</button>
    </div>
  </section>;

  return <section className="infoPage contactPage">
    <div className="contactHero"><p className="eyebrow">{t('info.contact.eyebrow')}</p><h1>{t('info.contact.title')}</h1><p>{t('info.contact.text')}</p></div>
    <div className="infoContent contactLayout"><div className="contactAside"><p className="eyebrow dark">{t('info.contact.helpEyebrow')}</p><h2>{t('info.contact.helpTitle')}</h2><p>{t('info.contact.helpText')}</p>
      <article><span>01</span><div><b>{t('info.contact.schemeHelpTitle')}</b><p>{t('info.contact.schemeHelpText')}</p><a href="https://agriwelfare.gov.in/" target="_blank" rel="noopener noreferrer">{t('info.contact.departmentLink')} ↗</a></div></article>
      <article><span>02</span><div><b>{t('info.contact.portalHelpTitle')}</b><p>{t('info.contact.portalHelpText')}</p><a href="https://pgportal.gov.in/" target="_blank" rel="noopener noreferrer">{t('info.contact.grievanceLink')} ↗</a></div></article>
      <div className="contactPrivacy"><b>{t('info.contact.privacyTitle')}</b><p>{t('info.contact.privacyText')}</p></div>
    </div>
    <form className="contactForm" onSubmit={copyContactDraft}><p className="eyebrow dark">{t('info.contact.formEyebrow')}</p><h2>{t('info.contact.formTitle')}</h2><p>{t('info.contact.formText')}</p>
      <label>{t('info.contact.name')}<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder={t('info.contact.namePlaceholder')} /></label>
      <label>{t('info.contact.email')}<input required type="email" maxLength={120} value={email} onChange={e => setEmail(e.target.value)} placeholder={t('info.contact.emailPlaceholder')} /></label>
      <label>{t('info.contact.topic')}<select value={topic} onChange={e => setTopic(e.target.value)}>{['general','scheme','eligibility','technical','incorrect'].map(x => <option key={x} value={x}>{t(`info.contact.topics.${x}`)}</option>)}</select></label>
      <label>{t('info.contact.message')}<textarea required minLength={10} maxLength={2000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('info.contact.messagePlaceholder')} /></label>
      <button className="primary" type="submit">{t('info.contact.copyButton')}</button>
      {copyState !== 'idle' && <p className={`contactFeedback ${copyState}`}>{t(`info.contact.${copyState}`)}</p>}
      <small>{t('info.contact.formDisclaimer')}</small>
    </form><button className="outline infoBack" onClick={onBack}>{t('common.backHome')}</button></div>
  </section>;
}

export function AssistantPage({ messages, text, setText, onSend, busy }: { messages: ChatMessage[]; text: string; setText: (s: string) => void; onSend: (e: FormEvent) => void; busy: boolean }) {
  const { t } = useTranslation();
  const bubble = (m: ChatMessage) => (m.error !== undefined ? apiErrorMessage(m.error, m.fallback || 'errors.assistantFailed') : m.key ? t(m.key) : m.text);
  return <section className="section page assistantPage">
    <div className="assistantIntro"><p className="eyebrow dark">{t('workspace.assistantEyebrow')}</p><h2>{t('app.assistant')}</h2><p>{t('app.assistantSub')}</p></div>
    <div className="chatBox"><div className="chatMessages">
      {!messages.length && <div className="welcomeMessage"><b>{t('assistant.welcomeTitle')}</b><p>{t('assistant.welcomeText')}</p></div>}
      {messages.map((m, i) => <div key={i} className={`bubble ${m.from}`}>{bubble(m)}</div>)}
      {busy && <div className="bubble bot typing">{t('assistant.thinking')}</div>}
    </div>
    <div className="assistantHint">{t('app.sourceNote')}</div>
    <form onSubmit={onSend} className="chatInput"><input value={text} onChange={e => setText(e.target.value)} placeholder={t('app.askPlaceholder')} /><button className="primary" disabled={busy}>{busy ? '…' : t('app.send')}</button></form></div>
  </section>;
}
