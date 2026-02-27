const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString || connectionString.includes('localhost')) {
        console.error('❌ ERRO: Você precisa colocar o link do Supabase no seu arquivo .env primeiro!');
        console.log('O link deve começar com postgresql://');
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        console.log('🚀 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conexão estabelecida!');

        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⏳ Criando tabelas e estruturando o banco...');
        await client.query(sql);

        console.log('✨ BANCO DE DADOS CRIADO COM SUCESSO NO SUPABASE!');
        console.log('Agora você pode rodar o site normalmente.');

    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
