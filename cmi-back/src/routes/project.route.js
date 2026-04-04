const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const projectModel = require('../models/project.model');
const cardModel = require('../models/card.model');
const categoryModel = require('../models/category.model');
const classificationModel = require('../models/classification.model');
const participantModel = require('../models/participant.model');
const userModel = require('../models/user.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

router.get('/get/projects', async (req, res) => {
    try {
        let projects = await projectModel.find({ deleted: false }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        let count = await projectModel.countDocuments({ deleted: false }).exec();
        return res.json({ projects, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/projects/user', async (req, res) => {
    try {
        let projectsIds = await (await userModel.findOne({ $and: [{ deleted: false }, { _id: req.query.userId }] }).exec()).projects;
        let projects = await projectModel.find({ $and: [{ deleted: false }, { _id: { $in: projectsIds } }] }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        return res.json(projects);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/project', async (req, res) => {
    try {
        if (!req.query.projectId || req.query.projectId == 'null') return res.status(logging.invalidParameters.code).json({ message: "El parametro projectId es requerido" });
        let project = await projectModel.findOne({ $and: [{ deleted: false }, { _id: req.query.projectId }] }).exec();
        return res.json(project);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/project', async (req, res) => {
    try {
        const project = new projectModel(req.body);
        let error = project.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        const savedProject = await projectModel.create(project);
        const user = await userModel.findById(req.body.userId);
        user.projects.push(savedProject._id);
        await user.save();
        return res.json({
            message: "Proyecto creado exitosamente",
            id: savedProject._id
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Proyecto inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/project', async (req, res) => {
    try {
        delete req.body._id;
        const savedProject = await projectModel.updateOne({ _id: req.query.projectId }, { $set: req.body }).exec()
        if (savedProject.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el parámetro" })
        return res.json({
            message: "Proyecto actualizado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Proyecto inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/project', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const projectObjectId = new mongoose.Types.ObjectId(req.query.projectId);

        const cards = await cardModel.find({ projectId: projectObjectId }).session(session).exec();
        const imagesDeletions = cards
            .filter(card => card.imageId)
            .map(card => gfs["card"].delete(new mongoose.Types.ObjectId(card.imageId)));

        await Promise.all([
            ...imagesDeletions,
            cardModel.deleteMany({ projectId: projectObjectId }).session(session).exec(),
            categoryModel.deleteMany({ projectId: projectObjectId }).session(session).exec(),
            classificationModel.deleteMany({ projectId: projectObjectId }).session(session).exec(),
            participantModel.deleteMany({ projectId: projectObjectId }).session(session).exec(),
            projectModel.deleteMany({ _id: req.query.projectId }).session(session).exec(),
        ]);

        await session.commitTransaction();
        return res.json({
            message: "Proyecto eliminado exitosamente",
        });
    } catch (error) {
        await session.abortTransaction();
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    } finally {
        session.endSession();
    }
})

router.delete('/clear/project', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const projectObjectId = new mongoose.Types.ObjectId(req.query.projectId);

        await Promise.all([
            categoryModel.deleteMany({ projectId: projectObjectId, static: false }).session(session).exec(),
            classificationModel.deleteMany({ projectId: projectObjectId, static: false }).session(session).exec(),
            participantModel.deleteMany({ projectId: projectObjectId }).session(session).exec(),
        ]);

        await session.commitTransaction();
        return res.json({
            message: "Proyecto depurado exitosamente",
        });
    } catch (error) {
        await session.abortTransaction();
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    } finally {
        session.endSession();
    }
})

module.exports = router;
