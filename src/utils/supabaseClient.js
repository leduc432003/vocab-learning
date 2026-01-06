
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL hoặc Anon Key bị thiếu. Hãy kiểm tra biến môi trường!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
