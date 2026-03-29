const mongoose = require('mongoose');

const ParticipantSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    fullName: { type: String, required: [true, "Nombre completo es requerido"] },
    age: { type: Number, required: [true, "Edad es requerida"] },
    gender: { type: String, required: [true, "Género es requerido"] },
    socialLevel: { type: String },
    educationalLevel: { type: String },
    surveyDate: { type: Date, default: Date.now },
    country: { type: String, required: [true, "País es requerido"] },
    region: { type: String, required: [true, "Región es requerida"] },
    city: { type: String, required: [true, "Ciudad es requerida"] },
    area: { type: String, required: [true, "Area es requerida"] },
    observations: { type: String },
    deleted: { type: Boolean, default: false },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
});

module.exports = mongoose.model('Participant', ParticipantSchema);