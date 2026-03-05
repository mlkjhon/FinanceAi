const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5432,
    database: 'postgres' // connect to default DB to create the new one
});

async function createDb() {
    try {
        await client.connect();

        // check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='financeai'");
        if (res.rowCount === 0) {
            console.log("Database 'financeai' does not exist. Creating...");
            await client.query('CREATE DATABASE financeai');
            console.log("Database created successfully.");
        } else {
            console.log("Database 'financeai' already exists.");
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

createDb();
