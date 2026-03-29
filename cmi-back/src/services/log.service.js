const fs = require('fs');
const log = require('../config/log');

module.exports = {
    logging: log,
    log: async (req, log, message, type) => {
        try {
            let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let path = __dirname + '/../../' + 'main' + '.log';
            fs.appendFileSync(path, `${date} - ${type ? type : log.type} - ${message ? message : log.message}\n`);
        } catch (error) {
            console.error(error)
        }
    }
}
