// Helpers for the profile dropdowns and the "answer these questions" form.
// All wording comes from the central translations (src/i18n); nothing here is language-specific.
import React from 'react';
import { exists, fieldLabel, humanize, schemeSentence, t, useTranslation } from './i18n';

export type Option = { value: string; label: string };

/* ---------- Dropdown values for the profile form ---------- */
// The values below are exactly what the scheme rules compare against; labels are translated on screen.
const STATE_VALUES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const PROFILE_OPTION_VALUES: Record<string, string[]> = {
  state: STATE_VALUES,
  farmer_type: ['farmer', 'tenant_farmer', 'sharecropper', 'farmer_family_member'],
  gender: ['Male', 'Female', 'Other'],
  social_category: ['General', 'OBC', 'SC', 'ST'],
  bank_account_status: ['active', 'inactive', 'none'],
  land_ownership_type: ['owned', 'leased', 'tenant', 'shared', 'other'],
  irrigation_type: ['canal', 'tube_well', 'open_well', 'drip', 'sprinkler', 'rainfed', 'pond_river', 'other'],
  soil_type: ['alluvial', 'black', 'red', 'laterite', 'sandy', 'loamy', 'clay', 'mountain', 'other'],
  primary_crop: ['wheat', 'rice', 'maize', 'cotton', 'sugarcane', 'soybean', 'mustard', 'potato', 'tomato', 'onion', 'pulses', 'groundnut', 'millet', 'coffee', 'tea', 'banana', 'apple', 'mango', 'other'],
};

/** Label of one dropdown value in the selected language. */
export function optionLabel(field: string, value: string): string {
  const key = field === 'state' ? `states.${value}` : `options.${field}.${value}`;
  return exists(key) ? t(key) : humanize(value);
}

export function profileOptions(field: string): Option[] {
  return (PROFILE_OPTION_VALUES[field] || []).map(v => ({ value: v, label: optionLabel(field, v) }));
}

/* ---------- Answer lists for scheme-specific questions ---------- */
const ANSWER_VALUES: Record<string, string[]> = {
  groundwater_category: ['safe', 'semi_critical', 'critical', 'over_exploited'],
  project_type: ['collective_irrigation', 'individual_groundwater_irrigation', 'other'],
  aromatic_land_access: ['owned', 'lease_10_years_plus', 'lease_under_10_years', 'none'],
};
const answerLabel = (field: string, v: string) => (exists(`answers.${field}.${v}`) ? t(`answers.${field}.${v}`) : humanize(v));

/* ---------- Dropdown used on the profile page ---------- */
export function ProfileSelect({ field, label, value, onChange }: {
  field: string; label: string; value: string | undefined; onChange: (v: string | undefined) => void;
}) {
  const { t: tr } = useTranslation(); // subscribes this component to language changes
  const options = profileOptions(field);
  const known = options.some(o => o.value === value);
  return (
    <label>{label}
      <select value={value ?? ''} onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}>
        <option value="">{tr('common.notProvided')}</option>
        {/* An older saved value (for example typed by hand) stays visible instead of vanishing. */}
        {value && !known && <option value={value}>{value}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/* ---------- The questions form ---------- */
type Criterion = { field: string; source?: string; operator?: string; expected?: any; result: string; criterion?: string };

export function QuestionsForm({ result, extra, onAnswer, onRecheck, busy, onOpenProfile }: {
  result: { criteria?: Criterion[]; exclusions?: Criterion[]; verificationCriteria?: Criterion[]; unverifiedScheme?: boolean };
  extra: Record<string, unknown>;
  onAnswer: (field: string, value: unknown) => void;
  onRecheck: () => void;
  busy: boolean;
  onOpenProfile: () => void;
}) {
  const { t: tr } = useTranslation();
  const all = [...(result.criteria || []), ...(result.exclusions || []), ...(result.verificationCriteria || [])];
  const unknown = all.filter(c => c.result === 'UNKNOWN');
  const seen = new Set<string>();
  const questions = unknown.filter(c => c.source === 'extra_attributes' && !seen.has(c.field) && seen.add(c.field));
  const profileFields = [...new Set(unknown.filter(c => c.source !== 'extra_attributes').map(c => c.field))];

  if (!questions.length && !profileFields.length) return null;

  const numeric = (c: Criterion) => ['gt', 'gte', 'lt', 'lte'].includes(c.operator || '');
  const input = (c: Criterion) => {
    const current = extra[c.field];
    if (typeof c.expected === 'boolean') {
      return (
        <select value={current === undefined ? '' : String(current)}
          onChange={e => onAnswer(c.field, e.target.value === '' ? undefined : e.target.value === 'true')}>
          <option value="">{tr('common.choose')}</option>
          <option value="true">{tr('common.yes')}</option>
          <option value="false">{tr('common.no')}</option>
        </select>
      );
    }
    if (numeric(c)) {
      return (
        <input type="number" min="0" value={current === undefined ? '' : String(current)}
          onChange={e => onAnswer(c.field, e.target.value === '' ? undefined : Number(e.target.value))} />
      );
    }
    const values = ANSWER_VALUES[c.field] || (Array.isArray(c.expected) ? c.expected.map((v: any) => String(v)) : []);
    const options: Option[] = values.map(v => ({ value: v, label: answerLabel(c.field, v) }));
    if (options.length) {
      return (
        <select value={current === undefined ? '' : String(current)}
          onChange={e => onAnswer(c.field, e.target.value === '' ? undefined : e.target.value)}>
          <option value="">{tr('common.choose')}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return <input type="text" value={current === undefined ? '' : String(current)}
      onChange={e => onAnswer(c.field, e.target.value === '' ? undefined : e.target.value)} />;
  };

  return (
    <div className="questionsPanel">
      {questions.length > 0 && <>
        <h4>{tr('questions.title')}</h4>
        <p className="questionsSub">{tr('questions.sub')}</p>
        <div className="questionsList">
          {questions.map(c => (
            <label key={c.field}>
              <span>{c.criterion ? schemeSentence(c.criterion) : fieldLabel(c.field)}</span>
              {input(c)}
            </label>
          ))}
        </div>
        <button type="button" className="primary small" onClick={onRecheck} disabled={busy}>
          {busy ? tr('common.checking') : tr('questions.recheck')}
        </button>
      </>}
      {profileFields.length > 0 && (
        <p className="questionsProfile">
          {tr('questions.profileMissing')} <b>{profileFields.map(f => fieldLabel(f)).join(', ')}</b>{' '}
          <button type="button" className="textBtn" onClick={onOpenProfile}>{tr('common.openMyFarm')} →</button>
        </p>
      )}
    </div>
  );
}
