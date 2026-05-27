const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { logging } = require('../services/log.service');

const PUBLIC_PATHS = [
    { method: 'POST', path: '/api/login' },
    { method: 'POST', path: '/api/signup' },
    { method: 'POST', path: '/api/create/user' },
    { method: 'GET',  path: '/api/get/project' },
    { method: 'GET',  path: '/api/get/cards' },
    { method: 'GET',  path: '/api/get/classifications/default' },
    { method: 'POST', path: '/api/create/participant' },
    { method: 'POST', path: '/api/create/classification' },
    { method: 'POST', path: '/api/create/category' },
    { method: 'GET',  path: '/api/get/countries' },
    { method: 'GET',  path: '/api/get/departments' },
    { method: 'GET',  path: '/api/get/cities' },
    { method: 'GET',  path: '/api/get/areas' },
    { method: 'GET',  path: '/api/download/file' },
];

module.exports = (req, res, next) => {
    // Static frontend assets and SPA paths are not auth-checked.
    if (!req.path.startsWith('/api/')) return next();

    const isPublic = PUBLIC_PATHS.some(p => p.method === req.method && req.path === p.path);
    if (isPublic) return next();

    // Accept the JWT via Authorization header (preferred) or ?token=… query
    // parameter — needed for plain anchor navigations like file downloads,
    // where we can't set a custom header.
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    const token = headerToken || req.query.token;
    if (!token) {
        return res.status(logging.authenticationError.code).json(logging.authenticationError);
    }
    try {
        req.user = jwt.verify(token, env.auth.jwtSecret);
        next();
    } catch {
        return res.status(logging.authenticationError.code).json(logging.authenticationError);
    }
};
