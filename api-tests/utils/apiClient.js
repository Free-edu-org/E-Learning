const axios = require('axios');

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    validateStatus: () => true, // Don't throw errors on 4xx/5xx responses
});

const TASK_MUTATION_ENDPOINTS = [
    /^\/lessons\/[^/]+\/tasks\/(choose|write|scatter|speak)(\/[^/]+)?$/,
    /^\/teacher\/task-bank\/tasks\/(choose|write|scatter|speak)(\/[^/]+)?$/,
];

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && value.constructor === Object;
}

function shouldDefaultPoints(config) {
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'post' && method !== 'put') {
        return false;
    }

    const urlWithoutQuery = (config.url || '').split('?')[0];
    return TASK_MUTATION_ENDPOINTS.some((pattern) => pattern.test(urlWithoutQuery));
}

apiClient.interceptors.request.use((config) => {
    if (!shouldDefaultPoints(config) || !isPlainObject(config.data)) {
        return config;
    }

    if (config.data.points == null) {
        config.data.points = 1;
    }

    return config;
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
