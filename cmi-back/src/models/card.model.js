const mongoose = require('mongoose');

const CardSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: [true, "Nombre es requerido"] },
    code: { type: Number, required: [true, "Código es requerido"] },
    deleted: { type: Boolean, default: false },
    onlyShowImage: { type: Boolean, default: false },
    imageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
});


module.exports = mongoose.model('Card', CardSchema);