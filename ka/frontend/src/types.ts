
// Shapes of the data the API returns, shared by the screens.

export type View =
  | 'home'
  | 'schemes'
  | 'support'
  | 'assistant'
  | 'profile'
  | 'saved'
  | 'applications'
  | 'resources'
  | 'about'
  | 'contact'
  | 'matches'
  | 'need'
  | 'activity'
  | 'admin'
  | 'documents';

export const VIEWS: View[] = [
  'home',
  'schemes',
  'support',
  'assistant',
  'profile',
  'saved',
  'applications',
  'resources',
  'about',
  'contact',
  'matches',
  'need',
  'activity',
  'admin',
  'documents',
];

// Official source information associated with a scheme.
export type SchemeSource = {
  title: string;
  url?: string;
  note?: string;
};

export type Scheme = {
  schemeCode: string;
  name: string;
  shortName?: string;
  level?: string;
  state?: string;
  category?: string;

  description?: string;
  benefits?: any[];
  eligibility?: any;
  documents?: any[];
  actionSteps?: any[];

  officialPortals?: string[];
  sources?: SchemeSource[];
  status?: string;

  translations?: Record<
    string,
    {
      name?: string;
      description?: string;
    }
  >;

  [key: string]: any;
};

export type Profile = {
  farmer_name?: string;
  age?: number;
  gender?: string;
  farmer_type?: string;
  social_category?: string;

  state?: string;
  district?: string;
  block?: string;
  village?: string;

  land_size_hectares?: number;
  land_ownership_type?: string;
  cultivable_land_hectares?: number;

  crop_types?: string[];
  primary_crop?: string;

  irrigation_type?: string;
  soil_type?: string;
  income_category?: string;
  bank_account_status?: string;

  kcc_holder?: boolean;
  years_of_cultivation?: number;
  farming_type?: string;
  livestock_owned?: boolean;
  equipment_owned?: string[];

  extra_attributes?: Record<string, unknown>;
};

export type Evaluation = {
  schemeCode: string;
  status: string;
  unverifiedScheme?: boolean;

  exclusions?: any[];
  verificationCriteria?: any[];
  criteria: any[];

  missingRequirements: string[];
  failedRequirements: string[];
  remediation: string[];
  verificationRequired: string[];
  benefits: any[];

  [key: string]: any;
};

export type Saved = {
  id: number;
  schemeCode: string;
  applicationStatus: string;
};

export type Application = {
  id: number;
  schemeCode: string;
  status: string;
  notes?: string;
};

export type ChatMessage = {
  from: 'user' | 'bot';
  text?: string;
  key?: string;
  error?: unknown;
  fallback?: string;
};
