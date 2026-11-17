// Administrator page: coverage report, scheme switches and verification dates, and a checker
// for new scheme files. The server enforces every rule here; this page only shows the controls.
// All wording comes from the central translations ("admin" namespace), like every other screen.
import React, { useEffect, useState } from 'react';
import { apiErrorMessage, apiFetch, exists, humanize, t, useTranslation } from './i18n';

type Row = {
  schemeCode: string; name: string; state: string | null; category: string | null; status: string; fileStatus: string;
  lastVerifiedAt: string | null; overridden: boolean; criteriaCount: number; sourceCount: number; sourcesWithUrl: number;
};
type Edit = { status: string; date: string; ack: boolean };
const STATUSES = ['active', 'verification_required', 'inactive'];
const statusLabel = (s: string) => (exists(`admin.status.${s}`) ? t(`admin.status.${s}`) : humanize(s));
const today = () => new Date().toISOString().slice(0, 10);

export function AdminPage({ api, token, onLogin }: { api: string; token: string; onLogin: () => void }) {
  useTranslation(); // re-render when the language changes
  const [rows, setRows] = useState<Row[] | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [needsAck, setNeedsAck] = useState<Record<string, boolean>>({});
  const [json, setJson] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [filter, setFilter] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    setError(''); setErrorKey('');
    try {
      const [a, b] = await Promise.all([apiFetch(`${api}/api/admin/schemes`, { headers }), apiFetch(`${api}/api/admin/coverage`, { headers })]);
      if (a.status === 403 || b.status === 403) { setDenied(true); return; }
      if (!a.ok || !b.ok) throw new Error('load');
      setRows(await a.json()); setReport(await b.json()); setEdits({});
    } catch (e: any) { setErrorKey(e instanceof TypeError ? 'errors.network' : 'admin.loadFailed'); setError('x'); }
  };
  useEffect(() => { if (token) void load(); }, [token]);

  const current = (r: Row): Edit => edits[r.schemeCode] || { status: r.status, date: r.lastVerifiedAt || '', ack: false };
  const change = (r: Row, patch: Partial<Edit>) => setEdits({ ...edits, [r.schemeCode]: { ...current(r), ...patch } });

  const save = async (r: Row, override?: Partial<Edit>) => {
    const e = { ...current(r), ...override };
    setMessages({ ...messages, [r.schemeCode]: '' });
    const res = await apiFetch(`${api}/api/admin/schemes/${encodeURIComponent(r.schemeCode)}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ status: e.status, last_verified_at: e.date || null, acknowledge_single_rule: e.ack }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessages({ ...messages, [r.schemeCode]: apiErrorMessage(d, 'admin.saveFailed') });
      if (res.status === 409) setNeedsAck({ ...needsAck, [r.schemeCode]: true });
      return;
    }
    setNeedsAck({ ...needsAck, [r.schemeCode]: false });
    await load();
  };

  const revert = async (r: Row) => {
    const res = await apiFetch(`${api}/api/admin/schemes/${encodeURIComponent(r.schemeCode)}/override`, { method: 'DELETE', headers });
    if (res.ok) await load();
  };

  const validate = async () => {
    let scheme: unknown;
    try { scheme = JSON.parse(json); } catch { setValidation({ valid: false, errors: [t('admin.invalidJson')], warnings: [] }); return; }
    const res = await apiFetch(`${api}/api/admin/schemes/validate`, { method: 'POST', headers, body: JSON.stringify({ scheme }) });
    const d = await res.json();
    setValidation(res.ok ? d : { valid: false, errors: [apiErrorMessage(d, 'admin.notObject')], warnings: [] });
  };

  const head = <div className="pageIntro"><div><p className="eyebrow dark">{t('admin.eyebrow')}</p><h2>{t('admin.title')}</h2><p>{t('admin.intro')}</p></div></div>;
  if (!token) return <section className="section page">{head}<button className="primary" onClick={onLogin}>{t('common.signIn')}</button></section>;
  if (denied) return <section className="section page">{head}<p className="matchError">{t('admin.denied')}</p></section>;
  if (error) return <section className="section page">{head}<p className="matchError">{errorKey ? t(errorKey) : error}</p></section>;
  if (!rows || !report) return <section className="section page">{head}<p>{t('common.loading')}</p></section>;

  const visible = rows.filter(r => !filter || `${r.schemeCode} ${r.name} ${r.state}`.toLowerCase().includes(filter.toLowerCase()));
  const gaps = report.gaps as Record<string, string[]>;
  const gapLabel = (k: string) => (exists(`admin.gap.${k}`) ? t(`admin.gap.${k}`, { days: report.staleAfterDays }) : humanize(k));

  return (
    <section className="section page">{head}
      <div className="adminCards">
        {Object.entries(report.totals).map(([k, v]) => <div key={k} className="adminCard"><b>{String(v)}</b><span>{k === 'schemes' ? t('admin.total.schemes') : statusLabel(k)}</span></div>)}
        {Object.entries(report.usage).map(([k, v]) => <div key={k} className="adminCard muted"><b>{String(v)}</b><span>{humanize(k)}</span></div>)}
      </div>

      <h3>{t('admin.gapsTitle')}</h3>
      <div className="adminGaps">
        {Object.entries(gaps).map(([k, codes]) => (
          <details key={k}><summary>{gapLabel(k)} <b>({codes.length})</b></summary><p>{codes.length ? codes.join(', ') : t('admin.none')}</p></details>
        ))}
        <details><summary>{t('admin.statesWithout')} <b>({report.statesWithoutSchemes.length})</b></summary><p>{report.statesWithoutSchemes.join(', ')}</p></details>
      </div>

      <h3>{t('admin.schemes')}</h3>
      <input className="adminFilter" placeholder={t('admin.filter')} value={filter} onChange={e => setFilter(e.target.value)} />
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead><tr><th>{t('admin.col.scheme')}</th><th>{t('admin.col.status')}</th><th>{t('admin.col.verified')}</th><th>{t('admin.col.rules')}</th><th>{t('admin.col.actions')}</th></tr></thead>
          <tbody>
            {visible.map(r => {
              const e = current(r);
              return (
                <tr key={r.schemeCode} className={r.overridden ? 'overridden' : ''}>
                  <td><b>{r.schemeCode}</b><small>{r.name}</small><small>{r.state}{r.overridden ? ` · ${t('admin.changedByAdmin', { file: statusLabel(r.fileStatus) })}` : ''}</small></td>
                  <td><select aria-label={t('admin.statusOf', { code: r.schemeCode })} value={e.status} onChange={ev => change(r, { status: ev.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></td>
                  <td><input type="date" aria-label={t('admin.verifiedDateOf', { code: r.schemeCode })} max={today()} value={e.date} onChange={ev => change(r, { date: ev.target.value })} /></td>
                  <td>{r.criteriaCount}</td>
                  <td className="adminActions">
                    <button type="button" className="primary small" onClick={() => save(r)}>{t('admin.save')}</button>
                    <button type="button" className="outline small" onClick={() => save(r, { status: 'active', date: today() })}>{t('admin.verifiedToday')}</button>
                    {r.overridden && <button type="button" className="textBtn" onClick={() => revert(r)}>{t('admin.revert')}</button>}
                    {messages[r.schemeCode] && <p className="matchError">{messages[r.schemeCode]}</p>}
                    {needsAck[r.schemeCode] && <label className="needSave"><input type="checkbox" checked={e.ack} onChange={ev => change(r, { ack: ev.target.checked })} /> {t('admin.ack')}</label>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>{t('admin.checkTitle')}</h3>
      <p className="matchGroupDesc">{t('admin.checkHelp')}</p>
      <textarea className="needText" rows={6} value={json} placeholder='{ "schemeCode": "NEW-001", ... }' onChange={e => setJson(e.target.value)} />
      <button className="primary" onClick={validate} disabled={!json.trim()}>{t('admin.checkButton')}</button>
      {validation && (
        <div className={validation.valid ? 'adminResult ok' : 'adminResult bad'}>
          <b>{validation.valid ? t('admin.valid') : t('admin.problems')}</b>
          <ul>{[...validation.errors, ...validation.warnings.map(w => t('admin.note', { text: w }))].map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
