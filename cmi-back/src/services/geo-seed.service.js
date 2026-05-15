const geoData = require('../config/geo-data');
const { db, newId } = require('../db');

module.exports = function seedGeoData() {
    const count = db.prepare('SELECT COUNT(*) AS c FROM countries').get().c;
    if (count > 0) return;

    console.log('[geo-seed] Seeding geographic data...');

    const insertCountry    = db.prepare('INSERT INTO countries    (_id, name) VALUES (?, ?)');
    const insertDepartment = db.prepare('INSERT INTO departments  (_id, name, countryId) VALUES (?, ?, ?)');
    const insertCity       = db.prepare('INSERT INTO cities       (_id, name, departmentId) VALUES (?, ?, ?)');
    const insertArea       = db.prepare('INSERT INTO areas        (_id, name, cityId) VALUES (?, ?, ?)');

    db.transaction(() => {
        const countryId = newId();
        insertCountry.run(countryId, geoData.country);

        for (const dept of geoData.departments) {
            const departmentId = newId();
            insertDepartment.run(departmentId, dept.name, countryId);

            for (const cityName of dept.cities) {
                const cityId = newId();
                insertCity.run(cityId, cityName, departmentId);

                if (cityName === 'Bogotá') {
                    for (const areaName of geoData.bogotaAreas) {
                        insertArea.run(newId(), areaName, cityId);
                    }
                }
            }
        }
    })();

    console.log('[geo-seed] Geographic data seeded successfully.');
};
