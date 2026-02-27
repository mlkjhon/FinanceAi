const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres"
});

async function test() {
    try {
        console.log('Tentando conectar ao PostgreSQL...');
        await client.connect();
        console.log('✅ Conexão bem sucedida!');
        const res = await client.query('SELECT current_database()');
        console.log('Banco atual:', res.rows[0].current_database);
        await client.end();
    } catch (err) {
        console.error('❌ Erro de conexão:', err.message);
        process.exit(1);
    }
}

test();
