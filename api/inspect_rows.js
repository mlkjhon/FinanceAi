const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const tables = ['User', 'Category', 'Transaction', 'Goal'];
        for (const table of tables) {
            const res = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`Table "${table}": ${res.rows[0].count} rows`);
        }

        const users = await pool.query(`SELECT id, nome, email FROM "User" LIMIT 5`);
        console.log('\nSample Users:');
        console.log(users.rows);

    } catch (err) {
        console.error('Error checking DB:', err.message);
    } finally {
        await pool.end();
    }
}

main();
