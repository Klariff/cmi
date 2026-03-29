const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const categoryModel = require('../models/category.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

router.get('/get/categories', async (req, res) => {
    try {
        let categorys = await categoryModel.find({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        return res.json(categorys);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/category', async (req, res) => {
    try {
        let category = await categoryModel.findOne({ $and: [{ deleted: false }, { _id: req.query.categoryId }] }).exec();
        return res.json(category);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/category/classification', async (req, res) => {
    try {
        let category = await categoryModel.find({ $and: [{ deleted: false }, { classificationId: req.query.classificationId }] }).sort({ code: 1 }).exec();
        return res.json(category);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/category', async (req, res) => {
    try {
        const category = new categoryModel(req.body);
        let error = category.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        if (req.body.static === true) {
            let previousCategory = await categoryModel.findOne({ projectId: new mongoose.Types.ObjectId(req.body.projectId), code: req.body.code, deleted: false, closed: null, static: req.body.static, classificationId: req.body.classificationId }).exec();
            if (previousCategory) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una categoría con ese código" })
        }
        const savedCategory = await categoryModel.create(category);
        return res.json({
            message: "Categoría creada exitosamente",
            id: savedCategory._id
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Categoría inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/category', async (req, res) => {
    try {
        let updateCategory = await categoryModel.findOne({ _id: req.query.categoryId }).exec();
        if (!updateCategory) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la categoría" })
        delete req.body._id;
        await categoryModel.updateOne({ _id: req.query.categoryId }, { $set: req.body }).exec()
        return res.json({
            message: "Categoría actualizada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Categoría inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/category', async (req, res) => {
    try {
        const savedCategory = await categoryModel.updateOne({ _id: req.query.categoryId }, { deleted: true }).exec()
        if (savedCategory.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la categoría" })
        return res.json({
            message: "Categoría eliminada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

module.exports = router;
