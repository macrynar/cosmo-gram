// Listy od Astrei — kontrakt typów (model danych z migracji 20260623_listy_od_astrei).
// Kolumny snake_case — Supabase zwraca je tak jak w bazie.

export type LetterTier = "free" | "premium" | "one_time";
export type LetterKind = "letter" | "report";
export type WellbeingLevel = "standard" | "delikatny";
export type TriggerType = "time" | "event";
export type LetterStatus = "scheduled" | "generated" | "delivered" | "read";
export type LetterSource = "drip" | "one_time_purchase";
export type InboxType = "letter" | "report" | "announcement" | "system" | "forecast";

// Które deterministyczne punkty kosmogramu zasilają prompt listu.
// Kod (resolver, Faza 2) liczy te punkty z natalu; AI ich nie zgaduje.
export interface PlacementInputs {
  planets?: string[];       // np. ["Słońce","Wenus"] — znak, stopień, dom
  points?: string[];        // np. ["MC","Węzeł Północny","Węzeł Południowy","Ascendent"]
  houses?: number[];        // np. [5,7] — znak na kuspidzie + planety w domu
  aspects_of?: string[];    // główne aspekty z udziałem tych ciał
  element_balance?: boolean; // dołącz dominujący żywioł
}

// trigger_value: dla 'time' { days_from_natal }, dla 'event' { condition }
export interface LetterTriggerValue {
  days_from_natal?: number;
  condition?: string;
}

export interface LetterTemplate {
  id: string;
  slug: string;
  title: string;
  theme: string;
  placement_inputs: PlacementInputs;
  trigger_type: TriggerType;
  trigger_value: LetterTriggerValue;
  tier: LetterTier;
  kind: LetterKind;
  wellbeing_level: WellbeingLevel;
  prompt_slug: string;
  subject_phrase: string | null;  // część „Oto …" tematu maila
  word_min: number;
  word_max: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserLetter {
  id: string;
  user_id: string;
  letter_slug: string;
  status: LetterStatus;
  content_md: string | null;
  placement_snapshot: unknown | null;
  prompt_version_id: string | null;
  ai_prompt_version: string | null;
  model: string | null;
  source: LetterSource;
  deliver_at: string | null;
  generated_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  type: InboxType;
  ref_id: string | null;
  title: string;
  preview: string | null;
  read_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface LetterPurchase {
  id: string;
  user_id: string;
  report_slug: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  user_letter_id: string | null;
  created_at: string;
}
