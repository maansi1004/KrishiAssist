/**
 * Every request to the backend goes through here.
 *
 * Language contract with the API (see docs/I18N.md):
 *  - The API localizes when asked: `Accept-Language` (or `?lang=`) = en | hi | hinglish.
 *  - Scheme data, eligibility results and matches are sent in CANONICAL form (English text +
 *    machine codes) and translated in the browser from the shared catalog. That is what makes a
 *    language switch instant and keeps cached results correct in every language.
 *    So data calls ask for `en` explicitly.
 *  - Output the SERVER renders for the farmer (the PDF report) is requested in the selected
 *    language: pass `{ localized: true }`.
 */
import { getLanguage, type Lang } from './core';
import { apiErrorMessage } from './format';

export function languageHeaders(extra?: HeadersInit, language: Lang = 'en'): Headers {
  const h = new Headers(extra);
  if (!h.has('Accept-Language')) h.set('Accept-Language', language);
  return h;
}

export function apiFetch(url: string, init: RequestInit & { localized?: boolean } = {}): Promise<Response> {
  const { localized, ...rest } = init;
  return fetch(url, { ...rest, headers: languageHeaders(rest.headers, localized ? getLanguage() : 'en') });
}

/** Read an error response and return text in the selected language (from the error `code`). */
export async function errorFromResponse(res: Response, fallbackKey = 'errors.generic'): Promise<string> {
  let body: unknown = null;
  try { body = await res.clone().json(); } catch { /* not JSON */ }
  return apiErrorMessage(body, fallbackKey);
}
