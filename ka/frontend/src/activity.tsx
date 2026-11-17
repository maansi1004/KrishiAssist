// "Activity": the farmer's past eligibility results (each can be re-opened exactly as it was
// decided) and a plain-language log of what they did in the app.
import React, { useEffect, useState } from 'react';
import { apiFetch, dateLocale, errorFromResponse, exists, fieldLabel, getLanguage, ruleMessage, schemeSentence, t, useTranslation, valueLabel, type Lang } from './i18n';

const at = (key: string, params?: Record<string, string | number>) => t(`activity.${key}`, params);

const asUtc = (s: string) => (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const when = (s: string, lang: Lang = getLanguage()) => { try { return new Date(asUtc(s)).toLocaleString(dateLocale(lang), { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; } };

/** One sentence for one logged event, in the selected language. */
export function describeEvent(e: { event: string; payload: any }, nameOf: (c: string, f: string) => string): string {
  const key = `activity.events.${e.event}`;
  if (!exists(key)) return at('events.unknown');
  const p = e.payload || {};
  const code = p.scheme_code ? nameOf(p.scheme_code, p.scheme_code) : '';
  const vars: Record<string, string> = {
    a: code || (p.fields_changed ? (p.fields_changed as string[]).map(f => fieldLabel(f)).join(', ') || '—' : ''),
    b: p.status ? (exists(`status.${p.status}`) ? t(`status.${p.status}`) : p.status) : (p.from ?? ''),
    c: p.to ?? '',
  };
  if (e.event === 'application_status_changed') {
    const st = (v: string) => (exists(`applicationStatus.${v}`) ? t(`applicationStatus.${v}`) : v);
    vars.b = st(p.from); vars.c = st(p.to);
  }
  return t(key, vars);
}

export function ActivityPage({ api, token, nameOf, onLogin }: {
  api: string; token: string; nameOf: (code: string, fallback: string) => string; onLogin: () => void;
}) {
  const { lang } = useTranslation(); // re-render on language change
  const [tab, setTab] = useState<'results' | 'log'>('results');
  const [history, setHistory] = useState<any[] | null>(null);
  const [log, setLog] = useState<any[] | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState('');
  const headers = { Authorization: `Bearer ${token}` };
  const failed = () => setError('x'); // the text itself is looked up at render time, so it follows the language

  useEffect(() => {
    if (!token) return;
    setError('');
    apiFetch(`${api}/api/eligibility/history`, { headers }).then(async r => { if (!r.ok) throw new Error(); setHistory(await r.json()); }).catch(failed);
    apiFetch(`${api}/api/audit?limit=100`, { headers }).then(async r => { if (!r.ok) throw new Error(); setLog(await r.json()); }).catch(failed);
  }, [token]);

  const open = (id: number) => {
    apiFetch(`${api}/api/eligibility/history/${id}`, { headers }).then(async r => { if (!r.ok) { setError(await errorFromResponse(r, 'activity.error')); return; } setDetail(await r.json()); }).catch(failed);
  };

  const head = (
    <div className="pageIntro"><div>
      <p className="eyebrow dark">{at('eyebrow')}</p><h2>{at('title')}</h2><p>{at('sub')}</p>
    </div></div>
  );
  if (!token) return <section className="section page">{head}<p>{at('signIn')}</p><button className="primary" onClick={onLogin}>{t('common.signIn')}</button></section>;

  const snapshot = detail ? Object.entries(detail.profileSnapshot || {}).filter(([k, v]) => k !== 'extra_attributes' && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) : [];
  const answers = detail ? Object.entries(detail.profileSnapshot?.extra_attributes || {}) : [];
  const errorText = error === 'x' ? at('error') : error;

  return (
    <section className="section page">{head}
      <div className="activityTabs">
        <button type="button" className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>{at('tabResults')}</button>
        <button type="button" className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>{at('tabLog')}</button>
      </div>
      {errorText && <p className="matchError">{errorText}</p>}

      {tab === 'results' && (history === null ? <p>{t('common.loading')}</p> : history.length === 0 ? <p>{at('emptyResults')}</p> : (
        <ul className="historyList">
          {history.map(h => (
            <li key={h.id} className="historyRow">
              <div>
                <b>{nameOf(h.schemeCode, h.schemeCode)}</b>
                <small>{at('checkedOn')} {when(h.createdAt, lang)} · {at('rules')} {h.ruleVersion || '—'} · {at('data')} {h.schemeVersion === 'unverified' ? at('unverified') : h.schemeVersion || '—'}</small>
              </div>
              <span className={`matchChip ${String(h.status).toLowerCase()}`}>{t(`status.${h.status}`)}</span>
              <button type="button" className="textBtn" onClick={() => open(h.id)}>{at('open')} →</button>
            </li>
          ))}
        </ul>
      ))}

      {tab === 'results' && detail && (
        <div className="historyDetail">
          <div className="historyDetailHead">
            <h3>{nameOf(detail.schemeCode, detail.schemeCode)} <span className={`matchChip ${String(detail.status).toLowerCase()}`}>{t(`status.${detail.status}`)}</span></h3>
            <button type="button" className="outline" onClick={() => setDetail(null)}>{t('common.close')}</button>
          </div>
          <p className="matchGroupDesc">{at('checkedOn')} {when(detail.createdAt, lang)}</p>
          {detail.rulesChangedSince && <p className="unverifiedNote">{at('changed')}</p>}
          <h4>{at('criteria')}</h4>
          <ul className="criteriaList">
            {(detail.criteria || []).map((c: any, i: number) => (
              <li key={i}><span className={`criterionDot ${String(c.result).toLowerCase()}`}></span><div><b>{schemeSentence(c.criterion)}</b><small>{ruleMessage(c)}</small></div></li>
            ))}
          </ul>
          <h4>{at('profileUsed')}</h4>
          <dl className="snapshot">
            {snapshot.map(([k, v]) => <React.Fragment key={k}><dt>{fieldLabel(k)}</dt><dd>{valueLabel(k, v)}</dd></React.Fragment>)}
          </dl>
          {answers.length > 0 && <>
            <h4>{at('answers')}</h4>
            <dl className="snapshot">
              {answers.map(([k, v]) => <React.Fragment key={k}><dt>{fieldLabel(k)}</dt><dd>{valueLabel(k, v)}</dd></React.Fragment>)}
            </dl>
          </>}
          {(detail.missingRequirements || []).length > 0 && <p className="matchGroupDesc"><b>{at('missing')}:</b> {detail.missingRequirements.map((m: string) => fieldLabel(m)).join(', ')}</p>}
        </div>
      )}

      {tab === 'log' && (log === null ? <p>{t('common.loading')}</p> : log.length === 0 ? <p>{at('emptyLog')}</p> : (
        <>
          <ul className="logList">
            {log.map(e => <li key={e.id}><span>{describeEvent(e, nameOf)}</span><small>{when(e.createdAt, lang)}</small></li>)}
          </ul>
          <p className="sourceNote">{at('privacy')}</p>
        </>
      ))}
    </section>
  );
}
