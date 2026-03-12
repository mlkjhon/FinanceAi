-- ═══════════════════════════════════════════════════════════
-- FINANCE AI — SCHEMA SUPABASE COM RLS
-- Execute no SQL Editor do Supabase (supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════ PROFILES ══════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  onboarding_done BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  role TEXT DEFAULT 'USER',
  twofa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar profile ao registrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════ CATEGORIES ══════════════════
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ganho')),
  cor TEXT DEFAULT '#ef4444',
  icone TEXT DEFAULT 'tag',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (
  is_global = TRUE OR auth.uid() = user_id
);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id AND is_global = FALSE);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id AND is_global = FALSE);

-- Categorias globais padrão
INSERT INTO categories (nome, tipo, is_global, user_id) VALUES
  ('Alimentação', 'gasto', TRUE, NULL),
  ('Moradia', 'gasto', TRUE, NULL),
  ('Transporte', 'gasto', TRUE, NULL),
  ('Saúde', 'gasto', TRUE, NULL),
  ('Educação', 'gasto', TRUE, NULL),
  ('Lazer', 'gasto', TRUE, NULL),
  ('Vestuário', 'gasto', TRUE, NULL),
  ('Serviços', 'gasto', TRUE, NULL),
  ('Outros Gastos', 'gasto', TRUE, NULL),
  ('Salário', 'ganho', TRUE, NULL),
  ('Freelance', 'ganho', TRUE, NULL),
  ('Investimentos', 'ganho', TRUE, NULL),
  ('Outros Ganhos', 'ganho', TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ══════════════════ TRANSACTIONS ══════════════════
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ganho')),
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  recorrencia TEXT CHECK (recorrencia IN ('unica', 'semanal', 'mensal', 'anual')) DEFAULT 'unica',
  recorrencia_fim DATE,
  comprovante_url TEXT,
  notes TEXT,
  is_recurring_child BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_data_idx ON transactions(data DESC);
CREATE INDEX IF NOT EXISTS transactions_tipo_idx ON transactions(tipo);

-- ══════════════════ BANK ACCOUNTS ══════════════════
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT DEFAULT 'corrente' CHECK (tipo_conta IN ('corrente', 'poupança', 'investimento')),
  saldo NUMERIC(12,2) DEFAULT 0,
  saldo_anterior NUMERIC(12,2) DEFAULT 0,
  api_key_encrypted TEXT,
  conectado BOOLEAN DEFAULT FALSE,
  ultimo_sync TIMESTAMPTZ,
  cor TEXT DEFAULT '#ef4444',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_accounts_select" ON bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bank_accounts_insert" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bank_accounts_update" ON bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bank_accounts_delete" ON bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════ PAYMENT REMINDERS ══════════════════
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  recorrencia TEXT DEFAULT 'unica' CHECK (recorrencia IN ('unica', 'semanal', 'mensal', 'anual')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  notificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_select" ON payment_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert" ON payment_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update" ON payment_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete" ON payment_reminders FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════ ALERTS ══════════════════
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto_elevado', 'meta_estourada', 'cobranca_duplicada', 'variacao_atipica', 'lembrete', 'sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  dados JSONB,
  severidade TEXT DEFAULT 'info' CHECK (severidade IN ('info', 'warning', 'danger', 'success')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_select" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_delete" ON alerts FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════ CHAT HISTORY ══════════════════
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_select" ON chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_insert" ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_delete" ON chat_history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_history_user_id_idx ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS chat_history_created_at_idx ON chat_history(created_at DESC);

-- ══════════════════ USER ROLES ══════════════════
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- ══════════════════ SUPABASE STORAGE ══════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "comprovantes_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "comprovantes_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "comprovantes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);
