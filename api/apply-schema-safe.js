const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const schema = `
-- Tabela de Usuários (CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    "avatarUrl" TEXT,
    "onboardingDone" BOOLEAN DEFAULT FALSE,
    "onboardingData" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS "Category" (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS "Transaction" (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    descricao TEXT,
    data TEXT NOT NULL,
    "categoriaId" INTEGER REFERENCES "Category"(id) ON DELETE CASCADE,
    "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Metas
CREATE TABLE IF NOT EXISTS "Goal" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    target DOUBLE PRECISION NOT NULL,
    current DOUBLE PRECISION DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'Target',
    "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS "Notification" (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Rede Social (Seguidores)
CREATE TABLE IF NOT EXISTS "Follow" (
    id SERIAL PRIMARY KEY,
    "followerId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "followingId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE("followerId", "followingId")
);

-- Tabela de Chat
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    sender TEXT NOT NULL,
    "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias globais (só insere se não existirem)
INSERT INTO "Category" (nome, tipo) 
SELECT nome, tipo FROM (VALUES
    ('Alimentação', 'gasto'), ('Moradia', 'gasto'), ('Transporte', 'gasto'),
    ('Saúde', 'gasto'), ('Educação', 'gasto'), ('Lazer', 'gasto'),
    ('Roupas', 'gasto'), ('Tecnologia', 'gasto'), ('Assinatura', 'gasto'),
    ('Rendas', 'ganho'), ('Investimento', 'ganho'), ('Outros', 'gasto')
) AS v(nome, tipo)
WHERE NOT EXISTS (
    SELECT 1 FROM "Category" WHERE "userId" IS NULL AND nome = v.nome
);
`;

async function main() {
    console.log('Conectando ao Supabase via pooler...');
    try {
        await pool.query(schema);
        console.log('✅ Schema aplicado com sucesso! Tabelas criadas sem apagar dados.');
    } catch (err) {
        console.error('❌ Erro ao aplicar schema:', err.message);
    } finally {
        await pool.end();
    }
}

main();
