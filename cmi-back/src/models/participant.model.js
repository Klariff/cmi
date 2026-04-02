const mongoose = require('mongoose');

const ParticipantSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    fullName: { type: String, required: [true, "Nombre completo es requerido"] },
    age: { type: Number, required: [true, "Edad es requerida"] },
    gender: { type: String, required: [true, "Género es requerido"] },
    socialLevel: { type: String },
    educationalLevel: { type: String },
    surveyDate: { type: Date, default: Date.now },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: [true, "País es requerido"] },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: [true, "Departamento es requerido"] },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: [true, "Ciudad es requerida"] },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    observations: { type: String },
    deleted: { type: Boolean, default: false },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
});

module.exports = mongoose.model('Participant', ParticipantSchema);
