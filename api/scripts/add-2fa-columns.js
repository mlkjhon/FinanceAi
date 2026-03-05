const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await pool.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS twofa_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS twofa_expires TIMESTAMP;
    `);
        console.log('2FA columns added successfully.');
    } catch (err) {
        console.error('Error adding 2FA columns:', err);
    } finally {
        pool.end();
    }
}

run();
