const mongoose = require('mongoose');
const Country = require('../models/country.model');
const Department = require('../models/department.model');
const City = require('../models/city.model');
const Area = require('../models/area.model');

module.exports = async function migrateParticipants() {
    const collection = mongoose.connection.collection('participants');

    const oldParticipants = await collection.find({ country: { $exists: true } }).toArray();
    if (oldParticipants.length === 0) return;

    console.log(`[geo-migration] Migrating ${oldParticipants.length} participant(s)...`);

    for (const participant of oldParticipants) {
        const country = await Country.findOne({ name: participant.country });
        const department = await Department.findOne({ name: participant.region });
        const city = await City.findOne({ name: participant.city });

        let areaId = undefined;
        if (participant.area && participant.area !== 'N/A') {
            const area = await Area.findOne({ name: participant.area });
            if (area) areaId = area._id;
        }

        const update = {
            $set: {
                countryId: country?._id ?? null,
                departmentId: department?._id ?? null,
                cityId: city?._id ?? null,
                ...(areaId && { areaId }),
            },
            $unset: { country: 1, region: 1, city: 1, area: 1 },
        };

        await collection.updateOne({ _id: participant._id }, update);
    }

    console.log('[geo-migration] Migration completed.');
};
