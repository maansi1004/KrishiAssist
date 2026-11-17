/** Turning machine values (field names, codes, API errors) into text in the selected language. */
import { exists, getLanguage, t, type Lang, type Params } from './core';
import { translateText } from './schemeText';

/** Locale for dates and numbers: Hindi uses Indian-Hindi; English and Hinglish (Roman script) use Indian-English. */
export const dateLocale = (lang: Lang = getLanguage()) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

export function humanize(value: string): string {
  return String(value).replace(/_/g, ' ').trim();
}

/** "land_ownership_type" -> "भूमि का स्वामित्व" (or the humanized name if no label exists). */
export function fieldLabel(field: string, lang: Lang = getLanguage()): string {
  return exists(`fields.${field}`, lang) ? t(`fields.${field}`) : humanize(field);
}

/** A stored value as the farmer should read it: Yes/No, state names, dropdown options, lists. */
export function valueLabel(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return t('common.notProvided');
  if (Array.isArray(value)) return value.map((v) => valueLabel(field, v)).join(', ');
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no');
  const v = String(value);
  if (field === 'state' && exists(`states.${v}`)) return t(`states.${v}`);
  for (const ns of ['options', 'answers']) if (exists(`${ns}.${field}.${v}`)) return t(`${ns}.${field}.${v}`);
  return translateText(v) === v ? v : translateText(v);
}

// ---- eligibility results ---------------------------------------------------------------------
type Criterion = { ruleCode?: string; params?: Record<string, unknown>; field?: string; operator?: string; result?: string; expected?: unknown; actual?: unknown };

const FAIL_CODE: Record<string, string> = {
  equals: 'RULE_FAILED_EQUALS', not_equals: 'RULE_FAILED_NOT_EQUALS', gt: 'RULE_FAILED_GT', gte: 'RULE_FAILED_GTE',
  lt: 'RULE_FAILED_LT', lte: 'RULE_FAILED_LTE', in: 'RULE_FAILED_IN', not_in: 'RULE_FAILED_NOT_IN',
};

/** Same mapping as backend app/i18n/rules.py. Used for results saved before ruleCode existed. */
export function deriveRuleCode(c: Criterion): string {
  if (c.field === 'state' && c.operator === 'equals' && (c.result === 'PASS' || c.result === 'FAIL')) {
    return c.result === 'PASS' ? 'RESIDENCY_MATCH' : 'RESIDENCY_MISMATCH';
  }
  if (c.result === 'PASS') return 'RULE_PASSED';
  if (c.result === 'FAIL') return FAIL_CODE[c.operator ?? ''] ?? 'RULE_FAILED_EQUALS';
  return 'RULE_UNKNOWN';
}

/** The sentence explaining one criterion's result, built in the selected language from its code. */
export function ruleMessage(c: Criterion): string {
  const code = c.ruleCode ?? deriveRuleCode(c);
  const field = c.field ?? (c.params?.field as string) ?? '';
  const p = (c.params ?? {}) as Record<string, unknown>;
  const actual = 'actual' in p ? p.actual : c.actual;
  const expected = 'expected' in p ? p.expected : c.expected;
  const params: Params = {
    actual: valueLabel(field, actual),
    expected: valueLabel(field, expected),
    field: fieldLabel(field),
    requiredState: valueLabel('state', p.requiredState ?? expected),
    providedState: valueLabel('state', p.providedState ?? actual),
  };
  const key = `eligibility.rules.${code}`;
  return exists(key) ? t(key, params) : t('eligibility.rules.RULE_UNKNOWN');
}

/** A criterion/remediation sentence written in the scheme data (English) -> selected language. */
export const schemeSentence = (text: string | undefined | null) => translateText(text);

// ---- API errors ------------------------------------------------------------------------------
/** Message for a failed API call. Uses the server's error `code`; never shows English `detail`. */
export function apiErrorMessage(body: any, fallbackKey = 'errors.generic'): string {
  const code = body && typeof body === 'object' ? body.code : undefined;
  if (typeof code === 'string' && exists(`errors.${code}`)) {
    const raw = (body.params ?? {}) as Record<string, unknown>;
    const params: Params = {};
    for (const [k, v] of Object.entries(raw)) {
      params[k] = k === 'what' && exists(`errors.what.${v}`) ? t(`errors.what.${v}`) : (v as string | number);
    }
    return t(`errors.${code}`, params);
  }
  return t(fallbackKey);
}
