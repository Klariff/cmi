const fetch = require('node-fetch');
const env = require('../config/env.js');

module.exports = {
    getCountries: async () => {
        let response = await fetch(`${env.locations.url}/countryInfoJSON?username=${env.locations.user}`);
        return await response.json();
    },
    getHierarchy: async (geonameId) => {
        let response = await fetch(`${env.locations.url}/childrenJSON?geonameId=${geonameId}&username=${env.locations.user}`);
        return await response.json();
    }
}
