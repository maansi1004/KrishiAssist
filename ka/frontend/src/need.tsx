// "Describe what you need": the farmer writes a sentence, we SUGGEST structured details,
// the farmer confirms or corrects them, and only then are the schemes checked.
// Nothing is checked or saved before the confirm step, and the suggestions never decide eligibility.
import React, { useEffect, useState } from 'react';
import { profileOptions } from './questions';
import { apiFetch, apiErrorMessage, exists, fieldLabel, t, useTranslation } from './i18n';
import { MatchResults, type MatchesResponse } from './matches';

type Extraction = {
  text: string; topics: { id: string; label: string }[]; notes: string[]; noteCodes?: { code: string; params: Record<string, any> }[]; usedAI: boolean;
  fields: { field: string; value: any; label: string; evidence: string; source: string }[];
};
const KEY_FIELDS = ['state', 'farmer_type', 'land_size_hectares', 'age', 'social_category', 'gender', 'primary_crop'] as const;
const SELECT_FIELDS = ['state', 'farmer_type', 'social_category', 'gender', 'primary_crop'];
const NUMBER_FIELDS = ['land_size_hectares', 'age'];

const nt = (key: string, params?: Record<string, string | number>) => t(`need.${key}`, params);

/** One warning in the selected language, built from its code; the server's English sentence is only a fallback. */
function noteText(ex: Extraction, i: number, fallback: string): string {
  const n = ex.noteCodes?.[i];
  if (!n || !exists(`need.note.${n.code}`)) return fallback;
  const params = { ...n.params } as Record<string, any>;
  if (Array.isArray(params.states)) params.states = params.states.map((s: string) => (exists(`states.${s}`) ? t(`states.${s}`) : s)).join(', ');
  return nt(`note.${n.code}`, params);
}

export function NeedPage({ api, token, profile, seed, nameOf, onOpenScheme, onApplyProfile, onOpenProfile, onLogin }: {
  api: string; token: string; profile: Record<string, any>; seed: string;
  nameOf: (code: string, fallback: string) => string;
  onOpenScheme: (code: string) => void;
  onApplyProfile: (profile: any, save: boolean) => Promise<void> | void;
  onOpenProfile: () => void; onLogin: () => void;
}) {
  const { lang } = useTranslation(); // re-render when the language changes
  const [text, setText] = useState(seed || '');
  const [stage, setStage] = useState<'input' | 'confirm' | 'results'>('input');
  const [ex, setEx] = useState<Extraction | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [save, setSave] = useState(false);
  const [results, setResults] = useState<MatchesResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const understand = async (sentence: string) => {
    const s = sentence.trim();
    if (s.length < 3) return;
    setBusy(true); setError('');
    try {
      const r = await apiFetch(`${api}/api/need/extract`, { method: 'POST', headers, body: JSON.stringify({ text: s, language: lang }) });
      const d = await r.json();
      if (!r.ok) throw new Error(apiErrorMessage(d, 'need.failed'));
      setEx(d);
      const next: Record<string, any> = {};
      for (const f of KEY_FIELDS) next[f] = d.fields.find((x: any) => x.field === f)?.value ?? profile[f] ?? '';
      setDraft(next);
      setStage('confirm');
    } catch (e: any) { setError(e instanceof TypeError ? t('errors.network') : e.message || nt('failed')); } finally { setBusy(false); }
  };
  // Arriving from the home-page search box: start reading straight away.
  useEffect(() => { if (seed && token) void understand(seed); }, []);

  const confirmed = (): Record<string, any> => {
    const out: Record<string, any> = { ...profile };
    for (const f of KEY_FIELDS) {
      const v = draft[f];
      if (v === '' || v === undefined || v === null) { delete out[f]; continue; }
      if (NUMBER_FIELDS.includes(f)) { const n = Number(v); if (Number.isNaN(n)) { delete out[f]; continue; } out[f] = n; } else out[f] = v;
    }
    return out;
  };

  const findSchemes = async () => {
    setBusy(true); setError('');
    try {
      const merged = confirmed();
      await onApplyProfile(merged, save);   // the scheme detail view must use the SAME confirmed details
      const r = await apiFetch(`${api}/api/matches/preview`, { method: 'POST', headers, body: JSON.stringify({ profile: merged, need_text: text }) });
      const d = await r.json();
      if (!r.ok) throw new Error(apiErrorMessage(d, 'need.failed'));
      setResults(d); setStage('results');
    } catch (e: any) { setError(e instanceof TypeError ? t('errors.network') : e.message || nt('failed')); } finally { setBusy(false); }
  };

  const reset = () => { setStage('input'); setEx(null); setResults(null); setError(''); };
  const head = (
    <div className="pageIntro"><div>
      <p className="eyebrow dark">{nt('eyebrow')}</p><h2>{nt('title')}</h2><p>{nt('sub')}</p>
    </div></div>
  );

  if (!token) return <section className="section page">{head}<p>{nt('signIn')}</p><button className="primary" onClick={onLogin}>{t('common.signIn')}</button></section>;

  if (stage === 'input') return (
    <section className="section page">{head}
      <textarea className="needText" rows={4} maxLength={1000} value={text} placeholder={nt('placeholder')} onChange={e => setText(e.target.value)} />
      <div className="needExamples">{(t('need.examples', undefined, { returnObjects: true }) as string[]).map(x => <button key={x} type="button" className="needChip" onClick={() => setText(x)}>{x}</button>)}</div>
      {error && <p className="matchError">{error}</p>}
      <button className="primary" disabled={busy || text.trim().length < 3} onClick={() => understand(text)}>{busy ? nt('understanding') : nt('understand')}</button>
    </section>
  );

  if (stage === 'confirm' && ex) return (
    <section className="section page">{head}
      <div className="needQuote">“{ex.text}”</div>
      <h3>{nt('understood')}</h3>
      <p className="matchGroupDesc">{nt('understoodSub')}</p>
      <p className="needTopics"><b>{nt('lookingFor')}:</b> {ex.topics.length ? ex.topics.map(x => <span key={x.id} className="matchChip eligible">{exists(`need.topic.${x.id}`) ? t(`need.topic.${x.id}`) : x.label}</span>) : <span>{nt('noTopics')}</span>}</p>
      {ex.notes.length > 0 && <ul className="needNotes">{ex.notes.map((n, i) => <li key={i}>{noteText(ex, i, n)}</li>)}</ul>}
      <h4>{nt('details')}</h4>
      <div className="needGrid">
        {KEY_FIELDS.map(f => {
          const found = ex.fields.find(x => x.field === f);
          const options = profileOptions(f);
          const value = draft[f] ?? '';
          return (
            <label key={f} className={found ? 'needField found' : 'needField'}>
              <span>{fieldLabel(f)}</span>
              {SELECT_FIELDS.includes(f) ? (
                <select value={value} onChange={e => setDraft({ ...draft, [f]: e.target.value })}>
                  <option value="">{t('common.notProvided')}</option>
                  {value && !options.some(o => o.value === value) && <option value={value}>{String(value)}</option>}
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={NUMBER_FIELDS.includes(f) ? 'number' : 'text'} min={NUMBER_FIELDS.includes(f) ? 0 : undefined} step={f === 'land_size_hectares' ? 0.01 : undefined}
                  value={value} onChange={e => setDraft({ ...draft, [f]: e.target.value })} />
              )}
              {found && <small className="needEvidence">{found.source === 'ai' ? nt('aiNote') : `${nt('fromSentence')}: “${found.evidence}”`}</small>}
            </label>
          );
        })}
      </div>
      <label className="needSave"><input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} /> {nt('saveToProfile')}</label>
      {error && <p className="matchError">{error}</p>}
      <div className="pageActions">
        <button className="primary" disabled={busy} onClick={findSchemes}>{busy ? nt('checking') : nt('confirm')}</button>
        <button className="outline" disabled={busy} onClick={reset}>{nt('startOver')}</button>
      </div>
    </section>
  );

  return (
    <section className="section page">{head}
      <div className="needQuote">{nt('resultsFor')}: “{text}”</div>
      <div className="pageActions">
        <button className="outline" onClick={() => setStage('confirm')}>{nt('back')}</button>
        <button className="outline" onClick={reset}>{nt('startOver')}</button>
      </div>
      {results && <MatchResults data={results} nameOf={nameOf} onOpen={onOpenScheme} />}
    </section>
  );
}
