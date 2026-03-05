const { Client } = require('pg');

async function testSupabase() {
    // Testing the new Transaction Pooler string
    const connectionString = "postgresql://postgres.ojyowxwwnrwctyjnjnpu:Jhon8632149@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

    console.log("Testing connection to:", connectionString.replace(/:[^:@]+@/, ':***@'));

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log("Connection successful! Current time on server:", res.rows[0].now);

        // Let's also check if the "User" table exists!
        const tableRes = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE  table_schema = 'public'
                AND    table_name   = 'User'
            );
        `);
        console.log("Does the 'User' table exist? ", tableRes.rows[0].exists);

    } catch (err) {
        console.error("Connection error:", err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

testSupabase();
