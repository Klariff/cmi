const router = require('express').Router();
const { getCountries, getDepartments, getCities, getAreas } = require('../services/location.service.js');
const { logging, log } = require('../services/log.service.js');

router.get('/get/countries', (req, res) => {
    try {
        return res.json(getCountries());
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/departments', (req, res) => {
    try {
        return res.json(getDepartments());
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/cities', (req, res) => {
    try {
        if (!req.query.department) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        return res.json(getCities(req.query.department));
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/areas', (req, res) => {
    try {
        if (!req.query.city) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        return res.json(getAreas(req.query.city));
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
