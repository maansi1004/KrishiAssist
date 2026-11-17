/**
 * Scheme content (names, benefits, documents, steps, rule texts, sources...) comes from the
 * backend in English. Its translations live in data/i18n/scheme_text.json and are served by
 * GET /api/i18n/catalog. This module loads that catalog once and gives every component the
 * same two tools:
 *
 *   getLocalizedText(value, lang?)   one string (or a {en, hi, hinglish} object) in a language
 *   localizeScheme(scheme, lang?)    a whole scheme, every user-facing field translated
 *
 * Because the catalog is in the browser, switching language updates scheme content instantly,
 * without another request. Identifiers (scheme codes, document names used as keys, field names,
 * status codes, URLs) are never translated. A string missing from the catalog is logged and shown
 * in English, never hidden.
 */
import { useSyncExternalStore } from 'react';
import { exists, getLanguage, reportMissing, subscribe, translate, type Lang } from './core';

export type LocalizedString = { en: string; hi?: string; hinglish?: string };
type Entry = { hi?: string; hinglish?: string };

let entries: Record<string, Entry> = {};
let loose: Record<string, Entry> = {};
let status: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
let version = 0;
const catalogListeners = new Set<() => void>();
const strip = (s: string) => s.trim().replace(/[ .]+$/, '');
const bump = () => { version += 1; catalogListeners.forEach((l) => l()); };

export function setCatalog(data: { entries?: Record<string, Entry> } | null): void {
  entries = data?.entries ?? {};
  loose = {};
  for (const k of Object.keys(entries)) loose[strip(k)] = entries[k];
  status = data ? 'ready' : 'failed';
  bump();
}
export function catalogStatus() { return status; }

/** Fetch the catalog once. `fetcher` lets the caller add auth/base-URL handling. */
export async function loadSchemeCatalog(fetcher: () => Promise<Response>): Promise<void> {
  if (status === 'loading' || status === 'ready') return;
  status = 'loading';
  try {
    const res = await fetcher();
    if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
    setCatalog(await res.json());
  } catch (err) {
    console.error('[i18n] could not load the scheme translation catalog; scheme text stays in English', err);
    status = 'failed';
    bump();
  }
}

/** One English scheme string in the given language (English when it has no translation). */
export function translateText(text: string | null | undefined, lang: Lang = getLanguage()): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string' || lang === 'en' || !text.trim()) return text as string;
  const entry = entries[text] ?? loose[strip(text)];
  const value = entry?.[lang];
  if (value) return value;
  if (status === 'ready') reportMissing('scheme', lang, text.slice(0, 90)); // not before the catalog arrives
  return text;
}

/** The central helper: a plain English string, or an object keyed by language. */
export function getLocalizedText(value: string | LocalizedString | null | undefined, lang: Lang = getLanguage()): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return translateText(value, lang);
  const picked = value[lang];
  if (picked && picked.trim()) return picked;
  if (lang !== 'en') reportMissing('object', lang, (value.en || '').slice(0, 90));
  return value.en ?? '';
}

// ---- whole schemes ---------------------------------------------------------------------------
type AnyScheme = Record<string, any>;
export type LocalizedScheme = {
  name: string; description: string; department: string;
  stateLabel: string; categoryLabel: string; levelLabel: string;
  benefits: string[]; conditions: string[]; exclusions: string[]; important: string[]; channels: string[]; notes: string[];
  documents: { name: string; label: string; purpose: string; note: string; required?: boolean; conditional?: boolean }[];
  steps: { step?: number; title: string; description: string; responsibleParty: string }[];
  sources: { title: string; note: string; url?: string }[];
};

const textOf = (b: any): string => (typeof b === 'string' ? b : b?.description ?? b?.benefitType ?? '');

function ruleTexts(node: any, lang: Lang, out: string[]): void {
  if (!node) return;
  if (Array.isArray(node.conditions)) { node.conditions.forEach((c: any) => ruleTexts(c, lang, out)); return; }
  if (node.criterion) out.push(translateText(node.criterion, lang));
}

/** Label for a category / state / level code in `lang`: the locale file, else a readable form of the code. */
function label(kind: string, code: string | undefined, lang: Lang, fallback: string): string {
  if (!code) return fallback;
  const key = `${kind}.${code}`;
  return exists(key, lang) ? translate(lang, key) : code.replace(/_/g, ' ');
}

export function localizeScheme(s: AnyScheme, lang: Lang = getLanguage()): LocalizedScheme {
  const own = lang === 'en' ? undefined : s.translations?.[lang];
  const list = (arr: any[] | undefined) => (arr ?? []).map((x) => translateText(textOf(x), lang)).filter(Boolean);
  const conditions: string[] = []; ruleTexts(s.eligibility, lang, conditions);
  const exclusions: string[] = []; ruleTexts(s.exclusions, lang, exclusions);
  return {
    name: own?.name || translateText(s.name, lang),
    description: own?.description || translateText(s.description, lang),
    department: translateText(s.implementingDepartment, lang),
    stateLabel: label('states', s.state, lang, translate(lang, 'states.All India')),
    categoryLabel: label('categories', s.category, lang, translate(lang, 'schemes.fallbackCategory')),
    levelLabel: label('levels', s.level, lang, ''),
    benefits: list(s.benefits),
    conditions, exclusions,
    important: [...list(s.coverageConditions), ...list(s.targetingNotes), ...list(s.geographicTargeting), ...list(s.procurementConditions), ...list(s.allocationPolicy)],
    channels: list(s.applicationChannels),
    notes: list(s.rawSourceText),
    documents: (s.documents ?? []).map((d: any) => typeof d === 'string'
      ? { name: d, label: translateText(d, lang), purpose: '', note: '' }
      : { name: d.name, label: translateText(d.name ?? d.document, lang), purpose: translateText(d.purpose, lang), note: translateText(d.verificationNote, lang), required: d.required, conditional: d.conditional }),
    steps: (s.actionSteps ?? []).map((a: any) => ({ step: a.step, title: translateText(a.title, lang), description: translateText(a.description, lang), responsibleParty: translateText(a.responsibleParty, lang) })),
    sources: (s.sources ?? []).map((x: any) => ({ title: translateText(x.title, lang), note: translateText(x.note, lang), url: x.url })),
  };
}

/** React hook: re-renders on language change AND when the catalog finishes loading. */
export function useSchemeText() {
  const lang = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  useSyncExternalStore((l) => { catalogListeners.add(l); return () => { catalogListeners.delete(l); }; }, () => version, () => version);
  return {
    lang,
    ts: (text: string | null | undefined) => translateText(text, lang),
    text: (value: string | LocalizedString | null | undefined) => getLocalizedText(value, lang),
    scheme: (s: AnyScheme) => localizeScheme(s, lang),
  };
}
