const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { logging } = require('../services/log.service');

const PUBLIC_PATHS = [
    { method: 'POST', path: '/api/login' },
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
    const isPublic = PUBLIC_PATHS.some(p => p.method === req.method && req.path === p.path);
    if (isPublic) return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(logging.authenticationError.code).json(logging.authenticationError);
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, env.auth.jwtSecret);
        next();
    } catch {
        return res.status(logging.authenticationError.code).json(logging.authenticationError);
    }
};
