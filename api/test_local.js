const axios = require('axios');

async function testLocal() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test_jetski_3@test.com',
            password: 'Password123'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        console.log('Sending message to chat...');
        const chatRes = await axios.post('http://localhost:5000/api/chat',
            { message: 'ganhei 1000 reais em salario' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Chat response:', chatRes.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testLocal();
