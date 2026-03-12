import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas. Verifique o arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  profiles: {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
    onboarding_done: boolean;
    role: string;
    twofa_enabled: boolean;
    created_at: string;
  };
};
