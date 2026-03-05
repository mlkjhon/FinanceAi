const axios = require('axios');

async function test() {
    try {
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@financeai.com', // wait, I need a valid user! Or I can just check the DB.
            password: 'TestPassword123'
        });
        console.log(login.data);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

test();
