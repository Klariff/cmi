const fs = require('fs');
const path = require('path');
const cors = require('cors');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const authMiddleware = require('./middleware/auth.middleware');

// Initialize the SQLite database (synchronous: schema runs at require time).
require('./db');
require('./services/geo-seed.service')();

const app = express();

app.use(cors());
app.set('trust proxy', 1);

app.use(bodyParser.json({ limit: '10mb' }));

app.use('/api/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 429, message: 'Demasiados intentos. Intente nuevamente en 15 minutos.' },
}));

app.use(authMiddleware);

app.use('/api', require('./routes/index.js'));
app.post('/api/echo', (req, res) => res.json(req.body));

// Serve the bundled Angular frontend, if present.
// In production / packaged builds, the build output sits in cmi-back/public/.
const PUBLIC_DIR = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR, { index: false }));
    app.get(/^\/(?!api\/).*/, (req, res) => {
        res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    });
}

http.createServer(app).listen(env.port, () => {
    console.log(`HTTP SERVER LISTENING @ ${env.port}`);
});

module.exports = app;
