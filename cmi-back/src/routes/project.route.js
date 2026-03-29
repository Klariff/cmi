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
    try {
        let imagesPromises = [];
        let cardsPromises = [];
        let categoriesPromises = [];
        let classificationsPromises = [];
        let participantsPromises = [];
        let usersPromises = [];

        let cards = await cardModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        cards.forEach((card) => {
            if (card.imageId) imagesPromises.push(gfs["card"].delete(new mongoose.Types.ObjectId(card.imageId)));
            cardsPromises.push(cardModel.deleteOne({ _id: card._id }).exec());
        })

        let categories = await categoryModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        categories.forEach((category) => {
            categoriesPromises.push(categoryModel.deleteOne({ _id: category._id }).exec());
        })

        let classifications = await classificationModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        classifications.forEach((classification) => {
            classificationsPromises.push(classificationModel.deleteOne({ _id: classification._id }).exec());
        })

        let participants = await participantModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        participants.forEach((participant) => {
            participantsPromises.push(participantModel.deleteOne({ _id: participant._id }).exec());
        })

        /*
        let users = await userModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        users.forEach((user) => {
            usersPromises.push(userModel.deleteOne({ _id: user._id }).exec());
        })
        */

        await Promise.all(imagesPromises);
        await Promise.all(cardsPromises);
        await Promise.all(categoriesPromises);
        await Promise.all(classificationsPromises);
        await Promise.all(participantsPromises);
        //await Promise.all(usersPromises);
        await projectModel.deleteMany({ _id: req.query.projectId }).exec();
        //await userModel.deleteMany({ projectId: req.query.projectId }).exec();

        return res.json({
            message: "Proyecto eliminado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/clear/project', async (req, res) => {
    try {
        let categoriesPromises = [];
        let classificationsPromises = [];
        let participantsPromises = [];

        let categories = await categoryModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId), static: false }).exec();
        categories.forEach((category) => {
            categoriesPromises.push(categoryModel.deleteOne({ _id: category._id }).exec());
        })

        let classifications = await classificationModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId), static: false }).exec();
        classifications.forEach((classification) => {
            classificationsPromises.push(classificationModel.deleteOne({ _id: classification._id }).exec());
        })

        let participants = await participantModel.find({ projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        participants.forEach((participant) => {
            participantsPromises.push(participantModel.deleteOne({ _id: participant._id }).exec());
        })

        await Promise.all(categoriesPromises);
        await Promise.all(classificationsPromises);
        await Promise.all(participantsPromises);

        return res.json({
            message: "Proyecto depurado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

module.exports = router;
