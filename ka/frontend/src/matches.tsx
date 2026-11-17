// "My Matches": every scheme checked against the saved farm profile, grouped by result,
// plus the "profile complete?" banner. The decisions come from the backend rule engine;
// this file only shows them.
import React, { useEffect, useState } from 'react';
import { apiFetch, errorFromResponse, exists, fieldLabel, schemeSentence, t, useTranslation } from './i18n';

export type Completeness = { total: number; filled: number; percent: number; complete: boolean; missing: { field: string; label: string }[] };
export type Match = {
  schemeCode: string; name: string; state?: string | null; category?: string | null; status: string;
  unverifiedScheme: boolean; passed: number; total: number; reason?: string | null;
  reasonCriterion?: string | null; reasonField?: string | null;
  questionsToAnswer: number; profileFieldsMissing: string[]; otherState: boolean; needScore?: number;
};
export type MatchesResponse = { bestForNeed?: Match[]; profileUsed: boolean; profileCompleteness: Completeness; schemeCount: number; counts: Record<string, number>; groups: Record<string, Match[]> };

/** Shared wording for this screen lives in locales/*.json under "matches", "status" and "common". */
export const mx = (key: string, params?: Record<string, string | number>) => t(`matches.${key}`, params);
const stateLabel = (s?: string | null) => (s && exists(`states.${s}`) ? t(`states.${s}`) : s || t('states.All India'));

/* ---------- Profile complete? banner ---------- */
export function CompletenessBanner({ completeness, onOpenProfile, onOpenMatches, showDone = false }: {
  completeness: Completeness | null; onOpenProfile?: () => void; onOpenMatches?: () => void; showDone?: boolean;
}) {
  useTranslation();
  if (!completeness) return null;
  if (completeness.complete) {
    if (!showDone) return null;
    return (
      <div className="completeBanner done">
        <b>✓ {mx('completeDone')}</b>
        {onOpenMatches && <button type="button" className="textBtn" onClick={onOpenMatches}>{mx('seeMatches')}</button>}
      </div>
    );
  }
  const labels = completeness.missing.map(m => fieldLabel(m.field)).join(', ');
  return (
    <div className="completeBanner">
      <b>{mx('completeTitle', { p: completeness.percent })}</b>
      <div className="completeBar"><span style={{ width: `${completeness.percent}%` }} /></div>
      <p>{mx('completeHint')} <b>{labels}</b></p>
      {onOpenProfile && <button type="button" className="textBtn" onClick={onOpenProfile}>{t('common.openMyFarm')} →</button>}
    </div>
  );
}

/* ---------- One scheme card ---------- */
function MatchCard({ m, nameOf, onOpen }: { m: Match; nameOf: (code: string, fallback: string) => string; onOpen: (code: string) => void }) {
  // The failed rule arrives as its exact scheme text; it is translated here, in the selected language.
  const reason = m.reasonCriterion ? schemeSentence(m.reasonCriterion) : m.reason;
  return (
    <div className="matchCard">
      <div className="matchTop">
        <div>
          <b className="matchName">{nameOf(m.schemeCode, m.name)}</b>
          <small>{m.schemeCode} · {stateLabel(m.state)}</small>
        </div>
        <span className={`matchChip ${m.status.toLowerCase()}`}>{t(`status.${m.status}`)}</span>
      </div>
      <p className="matchMeta">
        {m.total > 0 && <span>{mx('rulesMet', { a: m.passed, b: m.total })}</span>}
        {m.questionsToAnswer > 0 && <span>{mx('answers', { n: m.questionsToAnswer })}</span>}
        {m.unverifiedScheme && <span className="tagWarn">{mx('unverified')}</span>}
        {m.otherState && <span className="tagMuted">{mx('otherState')}</span>}
      </p>
      {reason && <p className="matchReason">{reason}</p>}
      <button type="button" className="textBtn" onClick={() => onOpen(m.schemeCode)}>{mx('view')}</button>
    </div>
  );
}

/* ---------- The grouped results (used by My Matches and by the need flow) ---------- */
export function MatchResults({ data, nameOf, onOpen }: {
  data: MatchesResponse; nameOf: (code: string, fallback: string) => string; onOpen: (code: string) => void;
}) {
  useTranslation();
  const card = (m: Match) => <MatchCard key={m.schemeCode} m={m} nameOf={nameOf} onOpen={onOpen} />;
  const order = ['ELIGIBLE', 'ALMOST_ELIGIBLE', 'VERIFICATION_REQUIRED', 'NOT_ELIGIBLE'];
  return (
    <>
      <div className="matchCounts">
        {order.map(s => <span key={s} className={`matchChip ${s.toLowerCase()}`}>{t(`status.${s}`)}: {data.counts[s] ?? 0}</span>)}
      </div>

      {(data.bestForNeed || []).length > 0 && (
        <div className="matchGroup bestGroup">
          <h3>{mx('bestTitle')}</h3>
          <p className="matchGroupDesc">{mx('bestDesc')}</p>
          <div className="matchGrid">{(data.bestForNeed || []).map(card)}</div>
        </div>
      )}

      {order.map(status => {
        const items = data.groups[status] || [];
        if (!items.length) return null;
        // "Not eligible" and schemes whose own data is unverified are tucked away so the
        // useful results stay on top.
        const shown = status === 'VERIFICATION_REQUIRED' ? items.filter(i => !i.unverifiedScheme) : status === 'NOT_ELIGIBLE' ? [] : items;
        const tucked = status === 'VERIFICATION_REQUIRED' ? items.filter(i => i.unverifiedScheme) : status === 'NOT_ELIGIBLE' ? items : [];
        return (
          <div key={status} className="matchGroup">
            <h3>{t(`status.${status}`)} <small>({items.length})</small></h3>
            <p className="matchGroupDesc">{mx('d' + status)}</p>
            {shown.length > 0 && <div className="matchGrid">{shown.map(card)}</div>}
            {tucked.length > 0 && (
              <details className="matchMore">
                <summary>{mx(status === 'NOT_ELIGIBLE' ? 'notEligibleSection' : 'unverifiedSection', { n: tucked.length })}</summary>
                <div className="matchGrid">{tucked.map(card)}</div>
              </details>
            )}
          </div>
        );
      })}
      <p className="sourceNote">{mx('note')}</p>
    </>
  );
}

/* ---------- The page ---------- */
export function MatchesPage({ api, token, savedTick, nameOf, onOpenScheme, onOpenProfile, onLogin, onOpenNeed }: {
  api: string; token: string; savedTick: number;
  nameOf: (code: string, fallback: string) => string;
  onOpenScheme: (code: string) => void; onOpenProfile: () => void; onLogin: () => void; onOpenNeed?: () => void;
}) {
  useTranslation(); // re-render on language change
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const load = () => {
    if (!token) return;
    setBusy(true); setErrorKey(null); setErrorText('');
    apiFetch(`${api}/api/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { if (!r.ok) { setErrorText(await errorFromResponse(r, 'matches.error')); return; } setData(await r.json()); })
      .catch(() => setErrorKey('errors.network'))
      .finally(() => setBusy(false));
  };
  useEffect(load, [token, savedTick]);
  // The data itself is language-neutral (codes + exact scheme text), so a language change needs no reload.

  const error = errorKey ? t(errorKey) : errorText;
  const head = (
    <div className="pageIntro">
      <div>
        <p className="eyebrow dark">{mx('navLabel').toUpperCase()}</p>
        <h2>{mx('title')}</h2>
        <p>{mx('sub')}</p>
      </div>
      {token && (
        <div className="pageActions">
          {onOpenNeed && <button type="button" className="primary" onClick={onOpenNeed}>{mx('describeNeed')}</button>}
          <button type="button" className="outline" onClick={load} disabled={busy}>{busy ? mx('loading') : mx('refresh')}</button>
        </div>
      )}
    </div>
  );

  if (!token) return <section className="section page">{head}<p>{mx('signIn')}</p><button className="primary" onClick={onLogin}>{t('common.signIn')}</button></section>;
  if (error) return <section className="section page">{head}<p className="matchError">{error}</p></section>;
  if (!data) return <section className="section page">{head}<p>{mx('loading')}</p></section>;
  if (!data.profileUsed) return (
    <section className="section page">{head}
      <p>{mx('noProfile')}</p>
      <button className="primary" onClick={onOpenProfile}>{t('common.openMyFarm')}</button>
    </section>
  );

  return (
    <section className="section page">
      {head}
      <CompletenessBanner completeness={data.profileCompleteness} onOpenProfile={onOpenProfile} />
      <MatchResults data={data} nameOf={nameOf} onOpen={onOpenScheme} />
    </section>
  );
}
