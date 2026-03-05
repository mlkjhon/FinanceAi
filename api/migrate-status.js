require('dotenv').config();
const db = require('./lib/db');

async function main() {
    try {
        await db.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'ACTIVE\'');
        console.log('Added status column to User table');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
