const db = require('./lib/db');
const { hashPassword } = require('./lib/auth');

async function createUser() {
    try {
        const hashedPassword = await hashPassword('TestPassword123'); // Matching eval.js password
        const query = `
            INSERT INTO "User" (nome, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = ['Test Admin', 'admin@financeai.com', hashedPassword, 'ADMIN'];

        const res = await db.query(query, values);
        console.log("User created:", res.rows[0]);

        // Creating jhonatan for frontend screenshot debugging
        const hashedPasswordJho = await hashPassword('jhonatan123');
        const valuesJho = ['Jhonatan', 'jhonatan.moraes957@gmail.com', hashedPasswordJho, 'USER'];
        const resJho = await db.query(query, valuesJho);
        console.log("User created:", resJho.rows[0]);

    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        process.exit(0);
    }
}

createUser();
