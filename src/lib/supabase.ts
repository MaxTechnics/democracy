import { createClient } from '@supabase/supabase-js';

const env = import.meta.env;

console.log('Initializing Supabase...');

export const supabase = createClient(env.VITE_APP_SUPABASE_URL, env.VITE_APP_SUPABASE_KEY);
