const router = require('express').Router();
const { getCountries, getHierarchy } = require('../services/location.service.js');
const { logging, log } = require('../services/log.service.js');

router.get('/get/countries', async (req, res) => {
    try {
        let data = await getCountries();
        if (data.geonames) {
            data = data.geonames.sort((a, b) => {
                if (a.countryName < b.countryName) { return -1; }
                if (a.countryName > b.countryName) { return 1; }
            });
        } else {
            data = [];
        }
        return res.json(data);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/hierarchy', async (req, res) => {
    try {
        if (req.query.geonameId === undefined) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        let data = await getHierarchy(req.query.geonameId);
        if (data.geonames) {
            data = data.geonames.sort((a, b) => {
                if (a.name < b.name) { return -1; }
                if (a.name > b.name) { return 1; }
            });
        } else {
            data = [];
        }
        return res.json(data);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;