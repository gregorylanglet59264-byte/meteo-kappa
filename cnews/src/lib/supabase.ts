import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ubdevaemtwbzxksjlhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_1qhA0xAnNSd3VxpoLdxYrQ_yUemEhaP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
