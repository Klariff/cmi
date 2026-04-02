const geoData = require('../config/geo-data');
const Country = require('../models/country.model');
const Department = require('../models/department.model');
const City = require('../models/city.model');
const Area = require('../models/area.model');

module.exports = async function seedGeoData() {
    const count = await Country.countDocuments();
    if (count > 0) return;

    console.log('[geo-seed] Seeding geographic data...');

    const country = await Country.create({ name: geoData.country });

    for (const dept of geoData.departments) {
        const department = await Department.create({ name: dept.name, countryId: country._id });

        for (const cityName of dept.cities) {
            const city = await City.create({ name: cityName, departmentId: department._id });

            if (cityName === 'Bogotá') {
                for (const areaName of geoData.bogotaAreas) {
                    await Area.create({ name: areaName, cityId: city._id });
                }
            }
        }
    }

    console.log('[geo-seed] Geographic data seeded successfully.');
};
