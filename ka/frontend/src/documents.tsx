// Documents: upload once, reuse for every scheme.
//   DocumentsPage      the full vault (upload, view, download, change type, delete)
//   ProfileDocuments   "upload the documents most schemes ask for", shown under the farm profile
//   DocumentPlan       inside "Plan application": what this scheme asks for, what is already uploaded,
//                      and next steps for anything the farmer does not have
//   DocumentSummary    one line on the scheme details ("3 of 5 documents ready")
import React, { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage, apiFetch, dateLocale, getLanguage, t as t0, useSchemeText, useTranslation, type Lang } from './i18n';

type DocType = { id: string; label: Record<Lang, string>; usedBySchemes: number };
type Doc = { id: number; docType: string; name: string; contentType: string; sizeBytes: number; note: string | null; uploadedAt: string };
type Limits = { maxFileBytes: number; maxDocuments: number; maxTotalBytes: number };
type HowTo = { title: Record<Lang, string>; steps: Record<Lang, string[]>; links: { label: string; url: string }[] };
type PlanItem = { name: string; purpose?: string | null; requiredType: string; suggestedType: string; matchable: boolean; status: string; choice: string | null; documentIds: number[]; howToGet: HowTo | null };
type Plan = { schemeCode: string; items: PlanItem[]; nextSteps: { name: string; suggestedType: string; requiredType: string; howToGet: HowTo }[]; summary: Record<string, number> };

/** Wording lives in locales/*.json under "documents" (plus shared "common" and "errors"). */
const dt = (key: string, v?: Record<string, string | number>) => {
  if (key === 'loading') return t0('common.loading');
  if (key === 'signInBtn') return t0('common.signIn');
  return t0(`documents.${key}`, v);
};
const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const asUtc = (s: string) => (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const day = (s: string, lang: Lang = getLanguage()) => { try { return new Date(asUtc(s)).toLocaleDateString(dateLocale(lang), { dateStyle: 'medium' }); } catch { return s; } };
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const looksAllowed = (f: File) => /\.(pdf|jpe?g|png)$/i.test(f.name) || ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type);

type Common = { api: string; token: string; notify: (m: string) => void };

/** Everything the vault pages share: the document types, the farmer's files, and the actions on them. */
function useVault({ api, token, notify }: Common) {
  const [types, setTypes] = useState<DocType[]>([]);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [usage, setUsage] = useState({ count: 0, bytes: 0 });
  const [limits, setLimits] = useState<Limits>({ maxFileBytes: 5242880, maxDocuments: 25, maxTotalBytes: 52428800 });
  const [busy, setBusy] = useState('');
  const auth = { Authorization: `Bearer ${token}` };

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const [ty, d] = await Promise.all([apiFetch(`${api}/api/documents/types`), apiFetch(`${api}/api/documents`, { headers: auth })]);
      if (ty.ok) setTypes(await ty.json());
      if (d.ok) { const j = await d.json(); setDocs(j.documents); setUsage(j.usage); setLimits(j.limits); }
    } catch { notify(dt('failed')); }
  }, [api, token]);
  useEffect(() => { void reload(); }, [reload]);

  /** Send one file. The file is the request body; the details travel in the address. Returns true when saved. */
  const send = async (file: File, docType: string, note = ''): Promise<boolean> => {
    if (!looksAllowed(file)) { notify(dt('badType')); return false; }
    if (file.size > limits.maxFileBytes) { notify(dt('tooBig', { mb: Math.round(limits.maxFileBytes / 1048576) })); return false; }
    setBusy('upload');
    try {
      const q = new URLSearchParams({ doc_type: docType, filename: file.name });
      if (note.trim()) q.set('note', note.trim());
      const r = await apiFetch(`${api}/api/documents?${q}`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/octet-stream' }, body: await file.arrayBuffer() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { notify(apiErrorMessage(d, 'documents.failed')); return false; }
      notify(dt('okUp'));
      await reload();
      return true;
    } catch { notify(dt('failed')); return false; } finally { setBusy(''); }
  };

  /** View in a new tab, or download. Files need the sign-in token, so they are fetched and shown from memory. */
  const openFile = async (doc: { id: number; name: string }, download = false) => {
    const tab = download ? null : window.open('', '_blank');
    try {
      const r = await apiFetch(`${api}/api/documents/${doc.id}/file${download ? '?download=1' : ''}`, { headers: auth });
      if (!r.ok) { tab?.close(); const d = await r.json().catch(() => ({})); notify(apiErrorMessage(d, 'documents.failed')); return; }
      const url = URL.createObjectURL(await r.blob());
      if (download) { const a = document.createElement('a'); a.href = url; a.download = doc.name; document.body.appendChild(a); a.click(); a.remove(); }
      else if (tab) tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { tab?.close(); notify(dt('failed')); }
  };

  const remove = async (doc: Doc) => {
    if (!window.confirm(dt('confirmDelete'))) return;
    const r = await apiFetch(`${api}/api/documents/${doc.id}`, { method: 'DELETE', headers: auth });
    if (r.ok) { notify(dt('okDel')); await reload(); }
  };
  const retype = async (doc: Doc, docType: string) => {
    const r = await apiFetch(`${api}/api/documents/${doc.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ doc_type: docType }) });
    if (r.ok) await reload();
  };
  return { types, docs, usage, limits, busy, send, openFile, remove, retype, reload };
}

/** A button that opens the file picker. The real input stays in the page so keyboards and screen readers can use it. */
function PickFile({ label, onFile, disabled, className = 'outline' }: { label: string; onFile: (f: File) => void; disabled?: boolean; className?: string }) {
  return (
    <label className={`dv-pick ${className}${disabled ? ' disabled' : ''}`}>
      {label}
      <input type="file" accept={ACCEPT} disabled={disabled} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}

/* ---------------- starter documents (profile page and top of the vault) ---------------- */
function StarterDocuments(p: Common & { vault: ReturnType<typeof useVault>; onManage?: () => void }) {
  const { lang } = useTranslation();
  const { vault: v } = p;
  const starters = [...v.types].filter(t => t.id !== 'other' && t.usedBySchemes > 0).sort((a, b) => b.usedBySchemes - a.usedBySchemes).slice(0, 5);
  if (!starters.length) return null;
  return (
    <div className="dv-card dv-starter">
      <h3>{dt('starterTitle')}</h3>
      <p>{dt('starterSub')}</p>
      <ul className="dv-list">
        {starters.map(t => {
          const have = (v.docs || []).filter(d => d.docType === t.id);
          return (
            <li key={t.id} className="dv-row">
              <div className="dv-main"><b>{t.label[lang]}</b><small>{dt('askedBy', { n: t.usedBySchemes })}</small></div>
              <div className="dv-actions">
                {have.length > 0 && <span className="dv-chip ok">✓ {dt('uploaded')}</span>}
                {have.length > 0 && <button type="button" className="outline" onClick={() => v.openFile(have[0])}>{dt('view')}</button>}
                {have.length === 0 && <PickFile label={v.busy === 'upload' ? dt('uploading') : dt('upload')} disabled={v.busy === 'upload'} onFile={f => v.send(f, t.id)} className="primary" />}
              </div>
            </li>
          );
        })}
      </ul>
      {p.onManage && <button type="button" className="dv-link" onClick={p.onManage}>{dt('manageAll')}</button>}
    </div>
  );
}

/* ---------------- the full page ---------------- */
export function DocumentsPage(p: Common & { onLogin: () => void }) {
  const { lang } = useTranslation();
  const v = useVault(p);
  const [docType, setDocType] = useState('land_record');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const head = (
    <div className="pageIntro"><div><p className="eyebrow dark">{dt('eyebrow')}</p><h2>{dt('title')}</h2><p>{dt('sub')}</p></div></div>
  );
  if (!p.token) return <section className="section page">{head}<p>{dt('signIn')}</p><button className="primary" onClick={p.onLogin}>{dt('signInBtn')}</button></section>;

  const submit = async () => {
    if (!file) { p.notify(dt('chooseFile')); return; }
    if (await v.send(file, docType, note)) { setFile(null); setNote(''); }
  };
  const mb = Math.round(v.limits.maxFileBytes / 1048576);

  return (
    <section className="section page documentsPage">
      {head}
      <p className="dv-privacy">🔒 {dt('privacy', { mb })}</p>
      <StarterDocuments {...p} vault={v} />

      <div className="dv-card">
        <h3>{dt('uploadBtn')}</h3>
        <div className="dv-form">
          <label>{dt('kind')}
            <select value={docType} onChange={e => setDocType(e.target.value)}>{v.types.map(t => <option key={t.id} value={t.id}>{t.label[lang]}</option>)}</select>
          </label>
          <label>{dt('note')}
            <input value={note} maxLength={300} onChange={e => setNote(e.target.value)} />
          </label>
          <div className="dv-formfile">
            <PickFile label={file ? file.name : dt('file')} onFile={setFile} />
            <button type="button" className="primary" disabled={v.busy === 'upload'} onClick={submit}>{v.busy === 'upload' ? dt('uploading') : dt('uploadBtn')}</button>
          </div>
        </div>
      </div>

      <div className="dv-card dv-vault">
        <h3>{dt('yourDocs')}</h3>
        <p className="dv-usage">{dt('usage', { count: v.usage.count, max: v.limits.maxDocuments, used: size(v.usage.bytes), total: size(v.limits.maxTotalBytes) })}</p>
        {v.docs === null ? <p>{dt('loading')}</p> : v.docs.length === 0 ? <p>{dt('empty')}</p> : (
          <ul className="dv-list">
            {v.docs.map(d => (
              <li key={d.id} className="dv-row">
                <div className="dv-main">
                  <b>{d.name}</b>
                  <small>{size(d.sizeBytes)} · {day(d.uploadedAt, lang)}{d.note ? ` · ${d.note}` : ''}</small>
                  <label className="dv-type">{dt('changeType')}
                    <select value={d.docType} onChange={e => v.retype(d, e.target.value)}>{v.types.map(t => <option key={t.id} value={t.id}>{t.label[lang]}</option>)}</select>
                  </label>
                </div>
                <div className="dv-actions">
                  <button type="button" className="outline" onClick={() => v.openFile(d)}>{dt('view')}</button>
                  <button type="button" className="outline" onClick={() => v.openFile(d, true)}>{dt('download')}</button>
                  <button type="button" className="dv-danger" onClick={() => v.remove(d)}>{dt('del')}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Shown under the farm profile: upload the documents most schemes ask for. */
export function ProfileDocuments(p: Common & { onManage: () => void }) {
  useTranslation();
  const v = useVault(p);
  return (
    <section className="section page dv-profile">
      <p className="dv-privacy">🔒 {dt('privacy', { mb: Math.round(v.limits.maxFileBytes / 1048576) })}</p>
      <StarterDocuments {...p} vault={v} />
    </section>
  );
}

/* ---------------- the plan for one scheme ---------------- */
export function DocumentPlan(p: Common & { schemeCode: string; onManage: () => void }) {
  const { lang } = useTranslation();
  const { ts } = useSchemeText();
  const v = useVault(p);
  const [plan, setPlan] = useState<Plan | null>(null);
  const auth = { Authorization: `Bearer ${p.token}` };

  const load = useCallback(async () => {
    const r = await apiFetch(`${p.api}/api/documents/plan/${encodeURIComponent(p.schemeCode)}`, { headers: auth });
    if (r.ok) setPlan(await r.json());
  }, [p.api, p.token, p.schemeCode]);
  useEffect(() => { void load(); }, [load]);

  const choose = async (name: string, choice: string | null) => {
    const r = await apiFetch(`${p.api}/api/documents/plan/${encodeURIComponent(p.schemeCode)}`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ document_name: name, choice }) });
    if (r.ok) setPlan(await r.json()); else p.notify(dt('failed'));
  };
  const uploadFor = async (item: PlanItem, file: File) => { if (await v.send(file, item.suggestedType)) await load(); };

  if (!plan) return <div className="plannerSection"><h3>1. {dt('planTitle')}</h3><p>{dt('loading')}</p></div>;
  const s = plan.summary;
  const groups: [string, PlanItem[]][] = (['required', 'conditional', 'verification'] as const).map(g => [g, plan.items.filter(i => i.requiredType === g)] as [string, PlanItem[]]).filter(([, items]) => items.length);
  const chip = (i: PlanItem) => {
    const map: Record<string, [string, string]> = { ready: ['ok', 'ready'], ready_self: ['ok', 'readySelf'], not_applicable: ['mute', 'notApplicable'], to_arrange: ['warn', 'toArrange'], undecided: ['ask', 'undecided'] };
    const [tone, key] = map[i.status] || ['mute', 'undecided'];
    return <span className={`dv-chip ${tone}`}>{i.status === 'ready' ? '✓ ' : ''}{dt(key)}</span>;
  };

  return (
    <div className="plannerSection documentPlan">
      <h3>1. {dt('planTitle')}</h3>
      <p>{dt('planSub')}</p>
      <p className="dv-summary"><b>{dt('planSummary', { ready: s.ready, total: s.total, arrange: s.toArrange, undecided: s.undecided })}</b>{s.requiredOpen > 0 && <span> · {dt('open', { n: s.requiredOpen })}</span>}</p>

      {groups.map(([g, items]) => (
        <div key={g} className="dv-group">
          <h4>{dt(g)}</h4>
          <ul className="dv-list">
            {items.map(i => (
              <li key={i.name} className={`dv-row dv-item ${i.status}`}>
                <div className="dv-main">
                  <b>{ts(i.name)}</b>{i.purpose && <small>{ts(i.purpose)}</small>}
                  <div className="dv-chips">{chip(i)}</div>
                  {i.status === 'undecided' && i.howToGet && (
                    <details className="dv-how"><summary>{dt('howTo')}</summary>
                      <ol>{i.howToGet.steps[lang].map((st, n) => <li key={n}>{st}</li>)}</ol>
                    </details>
                  )}
                </div>
                <div className="dv-actions">
                  {i.status === 'ready' && i.documentIds[0] && <button type="button" className="outline" onClick={() => v.openFile({ id: i.documentIds[0], name: ts(i.name) })}>{dt('view')}</button>}
                  {(i.status === 'undecided' || i.status === 'to_arrange') && (<>
                    {i.matchable && <PickFile label={dt('uploadNow')} disabled={v.busy === 'upload'} onFile={f => uploadFor(i, f)} className="primary" />}
                    {i.status === 'undecided' && <button type="button" className="outline" onClick={() => choose(i.name, 'have_it')}>{dt('haveIt')}</button>}
                    {i.status === 'undecided' && <button type="button" className="outline" onClick={() => choose(i.name, 'dont_have')}>{dt('dontHave')}</button>}
                    {i.status === 'undecided' && <button type="button" className="outline" onClick={() => choose(i.name, 'not_applicable')}>{dt('notApp')}</button>}
                    {i.status === 'to_arrange' && <button type="button" className="dv-link" onClick={() => choose(i.name, null)}>{dt('changeAnswer')}</button>}
                  </>)}
                  {(i.status === 'ready_self' || i.status === 'not_applicable') && <button type="button" className="dv-link" onClick={() => choose(i.name, null)}>{dt('changeAnswer')}</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="dv-next">
        <h4>{dt('nextTitle')}</h4>
        {plan.nextSteps.length === 0 ? <p>{dt('nextEmpty')}</p> : (
          <>
            {plan.nextSteps.map((n, idx) => (
              <article key={n.name} className="dv-step">
                <h5><span className="dv-num">{idx + 1}</span>{ts(n.name)}<small>{n.howToGet.title[lang]}</small></h5>
                <ol>{n.howToGet.steps[lang].map((st, k) => <li key={k}>{st}</li>)}</ol>
                {n.howToGet.links.length > 0 && <p className="dv-links">{n.howToGet.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</p>}
              </article>
            ))}
            <p className="dv-statenote">{dt('stateNote')}</p>
          </>
        )}
      </div>
      <button type="button" className="dv-link" onClick={p.onManage}>{dt('manageAll')}</button>
    </div>
  );
}

/* ---------------- one line on the scheme details and on each application ---------------- */
export function DocumentSummary(p: Common & { schemeCode: string; onPrepare: () => void }) {
  useTranslation();
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    apiFetch(`${p.api}/api/documents/plan/${encodeURIComponent(p.schemeCode)}`, { headers: { Authorization: `Bearer ${p.token}` } })
      .then(r => (r.ok ? r.json() : null)).then(setPlan).catch(() => setPlan(null));
  }, [p.api, p.token, p.schemeCode]);
  if (!plan || !plan.summary.total) return null;
  const s = plan.summary;
  return (
    <div className="dv-summaryline">
      <span>📄 {dt('sumLine', { ready: s.ready, total: s.total })}</span>
      <div className="dv-bar"><span style={{ width: `${Math.round((100 * s.ready) / s.total)}%` }} /></div>
      <button type="button" className="outline" onClick={p.onPrepare}>{dt('prepare')}</button>
    </div>
  );
}
