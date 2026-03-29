const env = require("../config/env");

module.exports = async (entities, entityName) => {
    let multiple = true;
    if (!entities.length) {
        multiple = false;
        entities = [entities];
    } 
    let promises = [];
    let cities = []
    for (let entity of entities) {
        entity = await entity.toJSON();
        promises.push(new Promise(async (resolve, reject) => {
            let modifiedCase = entity._id.toString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
            let regexp = new RegExp("^" + modifiedCase);
            let links = []
            gfs[entityName].find({ 'filename': { $regex: regexp } }).toArray(async (err, files) => {
                if (!files || files.length === 0) resolve(entity);
                for (file in files) {
                    if (!files[file].filename.includes('*')) {
                        links.push(`${env.https ? 'https://' : 'http://'}${env.baseUrl}/api/download/file/?bucketName=${entityName}&fileId=${files[file]._id}`)
                    }
                }
                entity.files = links
                resolve(entity);
            });
        }))
    }
    let result = await Promise.all(promises);
    if (multiple) {
        return result;
    } else {
        return result[0];
    }
}