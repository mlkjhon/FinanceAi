const db = require('./lib/db');
const { comparePassword, signToken } = require('./lib/auth');

async function run() {
    try {
        const email = 'jhonatan.moraes957@gmail.com'; // user from screenshot
        const result = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        const user = result.rows[0];
        console.log("User fetched:", user);

        if (!user) {
            console.log("User not found!");
            return;
        }

        // Simulating the login token generation and response building
        const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
        console.log("Token generated:", token);

        const responseObj = {
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                onboardingDone: user.onboardingDone,
                onboardingData: user.onboardingData ? JSON.parse(user.onboardingData) : null,
                avatarUrl: user.avatarUrl
            }
        };
        console.log("Response object:", responseObj);

    } catch (e) {
        console.error("Caught error:", e);
    } finally {
        process.exit(0);
    }
}
run();
