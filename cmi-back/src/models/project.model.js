const mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');

const ProjectSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: [true, "Nombre es requerido"] },
    minOpenQuestionsCnt: { type: Number, required: [true, "Número minimo de preguntas libres es requerido"] },
    introductionText: { type: String, required: [true, "Texto introductorio es requerido"] },
    endingText: { type: String, required: [true, "Texto de finalización es requerido"] },
    deleted: { type: Boolean, default: false },
});

ProjectSchema.plugin(uniqueValidator, { message: 'El campo {PATH} ya existe' });

module.exports = mongoose.model('Project', ProjectSchema);