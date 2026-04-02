const mongoose = require('mongoose');

const CountrySchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Country', CountrySchema);
