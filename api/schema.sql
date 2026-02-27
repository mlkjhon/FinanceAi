-- Esquema SQL FinanceAI
-- Rodar este script no pgAdmin ou psql

DROP TABLE IF EXISTS "ChatMessage" CASCADE;
DROP TABLE IF EXISTS "Follow" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Tabela de Usuários
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    avatarUrl TEXT,
    onboardingDone BOOLEAN DEFAULT FALSE,
    onboardingData TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE "Category" (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'gasto' ou 'ganho'
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela de Transações
CREATE TABLE "Transaction" (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    descricao TEXT,
    data TEXT NOT NULL,
    categoriaId INTEGER REFERENCES "Category"(id) ON DELETE CASCADE,
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Metas
CREATE TABLE "Goal" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    target DOUBLE PRECISION NOT NULL,
    current DOUBLE PRECISION DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'Target',
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE "Notification" (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Rede Social (Seguidores)
CREATE TABLE "Follow" (
    id SERIAL PRIMARY KEY,
    followerId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    followingId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE(followerId, followingId)
);

-- Tabela de Chat
CREATE TABLE "ChatMessage" (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'user' ou 'bot'
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias Iniciais Globais
INSERT INTO "Category" (nome, tipo) VALUES 
('Alimentação', 'gasto'), ('Moradia', 'gasto'), ('Transporte', 'gasto'),
('Saúde', 'gasto'), ('Educação', 'gasto'), ('Lazer', 'gasto'),
('Rendas', 'ganho'), ('Investimento', 'ganho'), ('Outros', 'gasto');
