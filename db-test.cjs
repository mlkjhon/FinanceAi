const { Pool } = require('pg');
require('dotenv').config({ path: './api/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        console.log('Testing DB connection...');
        const now = await pool.query('SELECT NOW()');
        console.log('Time from DB:', now.rows[0]);

        console.log('Checking tables in public schema...');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name));

        const userTable = tables.rows.find(r => r.table_name.toLowerCase() === 'user');
        if (userTable) {
            console.log(`Checking columns for table "${userTable.table_name}"...`);
            console.log('COLUMNS_JSON:' + JSON.stringify(columns.rows));
        } else {
            console.error('ERROR: "User" table not found!');
        }

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        await pool.end();
    }
}

test();
