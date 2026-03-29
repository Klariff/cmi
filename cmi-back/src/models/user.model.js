const mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');

const UserSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    fullName: { type: String, required: [true, "Nombre es requerido"] },
    username: { type: String, required: [true, "Usuario es requerido"], unique: true },
    password: { type: String, required: [true, "Contraseña es requerida"] },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    deleted: { type: Boolean, default: false },
});

UserSchema.plugin(uniqueValidator, { message: 'El campo {PATH} ya existe' });

module.exports = mongoose.model('User', UserSchema);