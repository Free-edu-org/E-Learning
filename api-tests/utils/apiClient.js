const axios = require('axios');

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    validateStatus: () => true, // Don't throw errors on 4xx/5xx responses
});

function setAuthToken(token) {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
}

module.exports = {
    apiClient,
    setAuthToken
};
