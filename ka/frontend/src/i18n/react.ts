import { useCallback, useSyncExternalStore } from 'react';
import { changeLanguage, getLanguage, subscribe, translate, type Lang, type Params } from './core';

/**
 * react-i18next-style hook. Every component that calls it re-renders the moment the language
 * changes, because they all subscribe to the single store in core.ts.
 */
export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  const t = useCallback(
    (key: string, params?: Params, options?: { returnObjects?: boolean }): any =>
      translate(lang, key, params, options as { returnObjects: true }),
    [lang],
  );
  return { t, lang, i18n: { language: lang, changeLanguage } };
}

export function useLanguage(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  return [lang, changeLanguage];
}
