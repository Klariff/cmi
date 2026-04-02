const router = require('express').Router();
const Country = require('../models/country.model');
const Department = require('../models/department.model');
const City = require('../models/city.model');
const Area = require('../models/area.model');
const { logging, log } = require('../services/log.service.js');

router.get('/get/countries', async (req, res) => {
    try {
        const countries = await Country.find().sort({ name: 1 });
        return res.json(countries);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/departments', async (req, res) => {
    try {
        if (!req.query.countryId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const departments = await Department.find({ countryId: req.query.countryId }).sort({ name: 1 });
        return res.json(departments);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/cities', async (req, res) => {
    try {
        if (!req.query.departmentId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const cities = await City.find({ departmentId: req.query.departmentId }).sort({ name: 1 });
        return res.json(cities);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/areas', async (req, res) => {
    try {
        if (!req.query.cityId) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const areas = await Area.find({ cityId: req.query.cityId }).sort({ name: 1 });
        return res.json(areas);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
