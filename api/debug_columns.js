const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'User'
        `);
        console.log('Columns in User table:');
        console.log(res.rows.map(r => r.column_name));
    } catch (err) {
        console.error('Error checking columns:', err.message);
    } finally {
        await pool.end();
    }
}

main();
