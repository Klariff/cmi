const mongoose = require('mongoose');

const DepartmentSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
});

module.exports = mongoose.model('Department', DepartmentSchema);
