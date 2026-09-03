// Supabase publishable credentials are designed to be included in browser bundles.
// RLS remains the authorization boundary; no service-role or secret key belongs here.
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zxgwyvphokhhzagrtqso.supabase.co';

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ML2e2HxQo8HZDBO8b2gZwg_nZTAY8Ae';
