import handler from './api/moments/index.js';

// Mock request and response
const req = {
    method: 'POST',
    headers: {
        authorization: 'Bearer dGVzdF91c2VyOjE4MzIzMjQ0MDAwMDA=', // test_user:1832324400000
    },
    body: {
        content: 'Test moment content'
    }
};

const res = {
    status: (code) => {
        console.log(`Status: ${code}`);
        return res;
    },
    json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        return res;
    }
};

// Run handler
(async () => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('Handler error:', error);
    }
})();
