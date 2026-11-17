/**
 * KrishiAssist i18n core: the ONE place that knows the selected language.
 *
 * API shape follows i18next / react-i18next on purpose (t(), {{interpolation}}, changeLanguage,
 * returnObjects, one global instance) so the locale JSON files work unchanged if the project ever
 * moves to i18next. No dependency is needed for what the app uses.
 *
 * Rules enforced here:
 *  - English, Hindi (hi) and Hinglish are the only languages; the choice is persisted in
 *    localStorage under `ka_lang` (the key the app already used).
 *  - A missing key is NEVER hidden: it is logged, recorded (getMissing()) and shown in English;
 *    if English is missing too, the key itself is shown so it is visible on screen.
 */
import en from './locales/en.json';
import hi from './locales/hi.json';
import hinglish from './locales/hinglish.json';

export type Lang = 'en' | 'hi' | 'hinglish';
export const LANGUAGES: readonly Lang[] = ['en', 'hi', 'hinglish'];
export const DEFAULT_LANGUAGE: Lang = 'en';
export const STORAGE_KEY = 'ka_lang';

export type Params = Record<string, string | number | boolean | null | undefined>;
type Tree = { [key: string]: string | string[] | Tree };
const resources: Record<Lang, Tree> = { en: en as Tree, hi: hi as Tree, hinglish: hinglish as Tree };

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

// ---- state -----------------------------------------------------------------------------------
function readStored(): Lang {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (isLang(saved)) return saved;
  } catch { /* storage blocked: fall through to the default */ }
  return DEFAULT_LANGUAGE;
}

let current: Lang = readStored();
const listeners = new Set<() => void>();
let warnOnMissing = true;
const missing = new Set<string>();
const missingListeners = new Set<(entry: string) => void>();

function applyDocumentLanguage(lang: Lang) {
  if (typeof document !== 'undefined') {
    // Hinglish is Hindi in Roman script: BCP-47 "hi-Latn" lets screen readers pick the right voice.
    document.documentElement.lang = lang === 'hinglish' ? 'hi-Latn' : lang;
  }
}
applyDocumentLanguage(current);

export function getLanguage(): Lang { return current; }

/** Change the language for the whole app (all subscribers update at once) and remember it. */
export function changeLanguage(lang: Lang): void {
  if (!isLang(lang)) return;
  if (lang === current) return;
  current = lang;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  applyDocumentLanguage(lang);
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Development switch: log each missing key once. The record (getMissing) is kept either way. */
export function configure(options: { warnOnMissing?: boolean }): void {
  if (options.warnOnMissing !== undefined) warnOnMissing = options.warnOnMissing;
}

// ---- missing-translation tracking ---------------------------------------------------------------
export function reportMissing(scope: string, lang: Lang, key: string): void {
  const entry = `${scope}:${lang}:${key}`;
  if (missing.has(entry)) return;
  missing.add(entry);
  if (warnOnMissing && typeof console !== 'undefined') console.warn(`[i18n] missing ${scope} translation (${lang}): ${key}`);
  missingListeners.forEach((l) => l(entry));
}
export function getMissing(): string[] { return Array.from(missing).sort(); }
export function clearMissing(): void { missing.clear(); }
export function onMissing(listener: (entry: string) => void): () => void {
  missingListeners.add(listener);
  return () => { missingListeners.delete(listener); };
}

// ---- lookup ----------------------------------------------------------------------------------
function resolve(lang: Lang, key: string): string | string[] | Tree | undefined {
  let node: unknown = resources[lang];
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && !Array.isArray(node) && part in (node as object)) node = (node as Tree)[part];
    else return undefined;
  }
  return node as string | string[] | Tree | undefined;
}

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? whole : String(value);
  });
}

/** Is there a real (non-empty) translation for this key in this language? No fallback, no logging. */
export function exists(key: string, lang: Lang = current): boolean {
  const v = resolve(lang, key);
  return typeof v === 'string' ? v.trim() !== '' : v !== undefined;
}

export function translate(lang: Lang, key: string, params?: Params): string;
export function translate(lang: Lang, key: string, params: Params | undefined, options: { returnObjects: true }): any;
export function translate(lang: Lang, key: string, params?: Params, options?: { returnObjects?: boolean }): any {
  let value = resolve(lang, key);
  const usable = (v: unknown) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && (options?.returnObjects ? true : false));
  if (!usable(value)) {
    if (lang !== 'en') reportMissing('ui', lang, key);
    value = resolve('en', key);
    if (!usable(value)) {
      reportMissing('ui', 'en', key);
      return key; // visible on purpose: a missing key must never look like finished content
    }
  }
  if (typeof value === 'string') return interpolate(value, params);
  return value; // arrays / objects (returnObjects)
}

/** Translate in the current language. Same call shape as i18next's t(). */
export function t(key: string, params?: Params): string;
export function t(key: string, params: Params | undefined, options: { returnObjects: true }): any;
export function t(key: string, params?: Params, options?: { returnObjects?: boolean }): any {
  return options ? translate(current, key, params, options as { returnObjects: true }) : translate(current, key, params);
}

/** i18next-style instance, for code that wants `i18n.language` / `i18n.changeLanguage()`. */
export const i18n = {
  get language(): Lang { return current; },
  changeLanguage: (lang: Lang) => { changeLanguage(lang); return Promise.resolve(t); },
  t, exists, on: subscribe,
};

// exposed for the audit tooling
export const __resources = resources;
