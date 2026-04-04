const env = require("../config/env");

module.exports = async (entities, entityName) => {
    let multiple = true;
    if (!entities.length) {
        multiple = false;
        entities = [entities];
    }
    let promises = [];
    for (let entity of entities) {
        entity = await entity.toJSON();
        promises.push(new Promise(async (resolve, reject) => {
            try {
                let modifiedCase = entity._id.toString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                let regexp = new RegExp("^" + modifiedCase);
                let files = await gfs[entityName].find({ 'filename': { $regex: regexp } }).toArray();
                let links = [];
                if (files && files.length > 0) {
                    for (let file of files) {
                        if (!file.filename.includes('*')) {
                            links.push(`${env.https ? 'https://' : 'http://'}${env.baseUrl}/api/download/file/?bucketName=${entityName}&fileId=${file._id}`);
                        }
                    }
                }
                entity.files = links;
                resolve(entity);
            } catch (err) {
                reject(err);
            }
        }));
    }
    let result = await Promise.all(promises);
    if (multiple) {
        return result;
    } else {
        return result[0];
    }
}
