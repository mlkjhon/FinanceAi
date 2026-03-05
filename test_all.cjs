const { Client } = require('pg');

const urls = [
    { name: 'ENV URL', url: "postgresql://postgres:DXL41EBCGNazm2yW@db.rujnnkwwdulzbmlehweo.supabase.co:5432/postgres" },
    { name: 'Pooler URL', url: "postgresql://postgres.rujnnkwwdulzbmlehweo:DXL41EBCGNazm2yW@aws-0-us-west-2.pooler.supabase.com:6543/postgres" },
    { name: 'Root Test DB URL', url: "postgresql://postgres:pesca590235@db.cbqvnnjvuqznsntadtcg.supabase.co:5432/postgres" },
    { name: 'Remote Test URL', url: "postgresql://postgres.ojyowxwwnrwctyjnjnpu:Jhon8632149@aws-1-us-east-2.pooler.supabase.com:6543/postgres" }
];

async function main() {
    for (const item of urls) {
        console.log(`Testing ${item.name}...`);
        const client = new Client({ connectionString: item.url, ssl: { rejectUnauthorized: false } });
        try {
            await client.connect();
            console.log(`✅ ${item.name} SUCCESS`);
            await client.end();
        } catch (err) {
            console.log(`❌ ${item.name} FAILED: ${err.message}`);
        }
    }
}

main();
