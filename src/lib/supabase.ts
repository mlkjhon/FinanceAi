import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Fallback manual para o seu projeto caso a Vercel não esteja enviando corretamente
const supabaseUrl = (rawUrl && rawUrl !== 'undefined' ? rawUrl : 'https://rujnnkwwdulzbmlehweo.supabase.co').trim();
const supabaseAnonKey = (rawKey && rawKey !== 'undefined' ? rawKey : '').trim();

console.log('DEBUG SUPABASE:', {
  urlLength: supabaseUrl.length,
  urlStart: supabaseUrl.substring(0, 10) + '...',
  hasKey: !!supabaseAnonKey
});

if (!supabaseUrl.startsWith('http')) {
  console.error('❌ ERRO: A URL do Supabase é inválida:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder-key', {
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
    created_at: string;
  };
};
