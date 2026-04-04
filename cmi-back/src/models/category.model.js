const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    name: { type: String, required: [true, "Nombre es requerido"] },
    code: { type: Number, required: [true, "Código es requerido"] },
    cardsId: { type: [mongoose.Schema.Types.ObjectId], ref: 'Card' },
    classificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classification' },
    deleted: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    static: { type: Boolean, default: false },
});


module.exports = mongoose.model('Category', CategorySchema);