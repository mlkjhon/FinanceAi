const { Pool } = require('pg');
require('dotenv').config();

const poolDirect = new Pool({
    connectionString: "postgresql://postgres:DXL41EBCGNazm2yW@db.rujnnkwwdulzbmlehweo.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

const poolPooler = new Pool({
    connectionString: "postgresql://postgres.rujnnkwwdulzbmlehweo:DXL41EBCGNazm2yW@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

async function test(name, pool) {
    console.log(`Testing ${name}...`);
    try {
        const res = await pool.query('SELECT 1');
        console.log(`${name} OK`);
    } catch (err) {
        console.error(`${name} FAILED: ${err.message}`);
    } finally {
        await pool.end();
    }
}

async function main() {
    await test('Direct', poolDirect);
    await test('Pooler', poolPooler);
}

main();
