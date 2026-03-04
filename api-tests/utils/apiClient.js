const axios = require('axios');

const baseURL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    // We want to handle all status codes manually in tests
    validateStatus: () => true,
});

const setAuthToken = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

module.exports = {
    apiClient,
    setAuthToken,
};
