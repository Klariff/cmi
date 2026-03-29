const geoData = require('../config/geo-data.js');

module.exports = {
    getCountries: () => {
        return [{ name: geoData.country }];
    },
    getDepartments: () => {
        return geoData.departments.map(d => ({ name: d.name }));
    },
    getCities: (department) => {
        const dept = geoData.departments.find(d => d.name === department);
        return dept ? dept.cities.map(c => ({ name: c })) : [];
    },
    getAreas: (city) => {
        if (city === 'Bogotá') {
            return geoData.bogotaAreas.map(a => ({ name: a }));
        }
        return [];
    }
};
