import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsjgkrqlxtlcmbvpambz.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ldx3ZsgJCub1tzLo2xAbNw_vgN0goK3';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("Missing Supabase environment variables, operating with local database layer.");
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

export default supabase;
