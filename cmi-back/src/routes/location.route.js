const router = require('express').Router();
const { db } = require('../db');
const { logging, log } = require('../services/log.service.js');

router.get('/get/countries', (req, res) => {
    try {
        const countries = db.prepare('SELECT * FROM countries ORDER BY name').all();
        return res.json(countries);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/departments', (req, res) => {
    try {
        if (!req.query.countryId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const rows = db.prepare('SELECT * FROM departments WHERE countryId = ? ORDER BY name').all(req.query.countryId);
        return res.json(rows);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/cities', (req, res) => {
    try {
        if (!req.query.departmentId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const rows = db.prepare('SELECT * FROM cities WHERE departmentId = ? ORDER BY name').all(req.query.departmentId);
        return res.json(rows);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/areas', (req, res) => {
    try {
        if (!req.query.cityId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const rows = db.prepare('SELECT * FROM areas WHERE cityId = ? ORDER BY name').all(req.query.cityId);
        return res.json(rows);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
