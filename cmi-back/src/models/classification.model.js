const mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');

const ClassificationSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: [true, "Nombre es requerido"] },
    indication: { type: String, default: null },
    deleted: { type: Boolean, default: false },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', default: null },
    code: { type: Number, required: [true, "Código es requerido"] },
    closed: { type: Boolean, default: false },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    static: { type: Boolean, default: false },
});

ClassificationSchema.plugin(uniqueValidator, { message: 'El campo {PATH} ya existe' });

module.exports = mongoose.model('Classification', ClassificationSchema);