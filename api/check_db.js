const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres.rujnnkwwdulzbmlehweo:DXL41EBCGNazm2yW@aws-0-us-west-2.pooler.supabase.com:5432/postgres'
});
async function run() {
    try {
        await client.connect();
        const users = await client.query('SELECT count(*) FROM "User"');
        const profiles = await client.query('SELECT count(*) FROM "profiles"');
        console.log('User table count:', users.rows[0].count);
        console.log('profiles table count:', profiles.rows[0].count);
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}
run();
