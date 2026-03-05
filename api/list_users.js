const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres.rujnnkwwdulzbmlehweo:DXL41EBCGNazm2yW@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Consultando usuários...');
        const res = await pool.query('SELECT id, nome, email FROM "User"');
        console.log('Usuários no banco:', res.rows.length);
        console.log(res.rows);
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
