import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sgnbylhgqnuxwsjtcqly.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uTDO_DPXhNVevuSZ3gfdLA_xprIrDol';

export const supabase = createClient(supabaseUrl, supabaseKey);
