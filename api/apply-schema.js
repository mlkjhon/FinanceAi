const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:DXL41EBCGNazm2yW@db.rujnnkwwdulzbmlehweo.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Conectando ao Supabase...');
    try {
        await pool.query(sql);
        console.log('✅ Schema aplicado com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao aplicar schema:', err.message);
    } finally {
        await pool.end();
    }
}

main();
