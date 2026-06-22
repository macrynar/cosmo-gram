-- Pending birth data for cross-device onboarding flow
-- Saved in auth callback after email confirmation, consumed in cosmogram page
alter table user_preferences
  add column if not exists pending_birth_data jsonb;
