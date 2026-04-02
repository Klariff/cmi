const mongoose = require('mongoose');

const AreaSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
});

module.exports = mongoose.model('Area', AreaSchema);
