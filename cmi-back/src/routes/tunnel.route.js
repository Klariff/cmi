const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const tunnel = require('../services/tunnel.service.js');

router.get('/tunnel/available', (req, res) => {
    if (!tunnel.isAvailable()) return res.status(404).json({ available: false });
    return res.json({ available: true });
});

router.get('/tunnel/status', (req, res) => {
    res.json({ url: tunnel.status() });
});

router.post('/tunnel/start', async (req, res) => {
    try {
        const url = await tunnel.start();
        res.json({ url });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        res.status(500).json({ message: error.message });
    }
});

router.post('/tunnel/stop', (req, res) => {
    tunnel.stop();
    res.json({ message: 'Túnel detenido' });
});

module.exports = router;
