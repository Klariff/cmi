const mongoose = require('mongoose');

const ProjectSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: [true, "Nombre es requerido"] },
    minOpenQuestionsCnt: { type: Number, required: [true, "Número minimo de preguntas libres es requerido"] },
    introductionText: { type: String, required: [true, "Texto introductorio es requerido"] },
    endingText: { type: String, required: [true, "Texto de finalización es requerido"] },
    deleted: { type: Boolean, default: false },
});


module.exports = mongoose.model('Project', ProjectSchema);