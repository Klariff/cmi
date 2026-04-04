const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const projectModel = require('../models/project.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

const DUMMY_HASH = bcrypt.hashSync('cmi_dummy_unused_hash_value', 10);

function validatePassword(password) {
    if (!password || password.length < 8 || password.length > 20) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*.]/.test(password)) return false;
    return true;
}

router.get('/get/users', async (req, res) => {
    try {
        let users = await userModel.find({ deleted: false }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).populate("projectId").exec();
        let count = await userModel.countDocuments({ deleted: false }).exec();
        return res.json({ users, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/user', async (req, res) => {
    try {
        let user = await userModel.findOne({ $and: [{ deleted: false }, { _id: req.query.userId }] }).populate('projects').exec();
        return res.json(user);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/user', async (req, res) => {
    try {
        if (!validatePassword(req.body.password)) {
            return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
        }
        const user = new userModel(req.body);
        let error = user.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        let hash = await bcrypt.hash(req.body.password, parseInt(env.auth.saltRounds));
        user.password = hash;
        const savedUser = await userModel.create(user);
        const token = jwt.sign({ userId: savedUser._id }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpirationTime });
        return res.json({
            message: "Usuario creado exitosamente",
            userId: savedUser._id,
            token
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error.code == 11000) return res.status(logging.duplicatedAction.code).json({ message: "El usuario ya existe" });
        if (error._message === 'Usuario inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message });
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/user', async (req, res) => {
    try {
        delete req.body._id;
        if (req.body.password) {
            if (!validatePassword(req.body.password)) {
                return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
            }
            let hash = await bcrypt.hash(req.body.password, parseInt(env.auth.saltRounds));
            req.body.password = hash;
        }
        const savedUser = await userModel.updateOne({ _id: req.query.userId }, { $set: req.body }).exec()
        if (savedUser.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" })
        return res.json({
            message: "Usuario actualizado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error.code == 11000) return res.status(logging.duplicatedAction.code).json({ message: "Usuario duplicado" })
        if (error._message === 'Usuario inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/user', async (req, res) => {
    try {
        const savedUser = await userModel.updateOne({ _id: req.query.userId }, { deleted: true }).exec()
        if (savedUser.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" })
        return res.json({
            message: "Usuario eliminado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/link/user', async (req, res) => {
    try {

        let user = await userModel.findOne({ $and: [{ deleted: false }, { username: req.query.username }] }).populate('projects').exec();
        if (!user) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" })
        
        for (let project of user.projects) {
            if (project._id.toString() === req.query.projectId) {
                return res.status(logging.duplicatedAction.code).json({ message: "El usuario ya está vinculado al proyecto" });
            }
        }

        let project = await projectModel.findOne({ _id: req.query.projectId }).exec();
        if (!project) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el proyecto" })
        user.projects.push(project._id);
        await userModel.updateOne({
            username: req.query.username
        }, {
            $set: {
                projects: user.projects
            }
        }).exec();

        return res.json({
            message: "Usuario vinculado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/unlink/user', async (req, res) => {
    try {
        let user = await userModel.findOne({ $and: [{ deleted: false }, { username: req.query.username }] }).populate('projects').exec();
        if (!user) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" });

        let projectIndex = user.projects.findIndex(project => project._id.toString() === req.query.projectId);
        if (projectIndex === -1) {
            return res.status(logging.invalidParameters.code).json({ message: "El usuario no está asociado al proyecto" });
        }

        user.projects.splice(projectIndex, 1);
        await userModel.updateOne({
            username: req.query.username
        }, {
            $set: {
                projects: user.projects
            }
        }).exec();

        return res.json({
            message: "Usuario desvinculado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/signup', async (req, res) => {
    try {
        let user = req.body;
        if (!user.password || !user.username) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        if (!validatePassword(user.password)) {
            return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
        }
        let hash = await bcrypt.hash(req.body.password, parseInt(env.auth.saltRounds));
        user.password = hash;
        let userSameEmail = await userModel.findOne({ email: req.body.email });
        if (userSameEmail) {
            return res.status(logging.duplicatedAction.code).json(logging.duplicatedAction);
        }
        let savedUser = await new userModel(user).save();
        return res.json({
            message: "Usuario creado exitosamente",
            userId: savedUser._id.toString()
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/login', async (req, res) => {
    try {
        if (!req.body.username || !req.body.password) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        let user = await userModel.findOne({ $and: [{ deleted: false }, { username: req.body.username }] }).exec();
        const hashToCompare = user ? user.password : DUMMY_HASH;
        let hashResult = await bcrypt.compare(req.body.password, hashToCompare);
        if (!user || !hashResult) return res.status(logging.authenticationError.code).json(logging.authenticationError);
        const token = jwt.sign({ userId: user._id }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpirationTime });
        return res.json({ userId: user._id.toString(), token });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
