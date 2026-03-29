const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const classificationModel = require('../models/classification.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

router.get('/get/classifications', async (req, res) => {
    try {
        let classifications = await classificationModel.find({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        let count = await classificationModel.countDocuments({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        return res.json({ classifications, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/classifications/default', async (req, res) => {
    try {
        let pipeline = [
            {
                $match: {
                    deleted: false,
                    static: true,
                    projectId: new mongoose.Types.ObjectId(req.query.projectId)
                }
            },
            {
                $lookup: {
                    from: "categories",
                    let: { classificationId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$classificationId", "$$classificationId"] },
                                        { $eq: ["$deleted", false] }
                                    ]
                                }
                            },
                        },
                        {
                            $sort: {
                                code: 1
                            }
                        }
                    ],
                    as: "categories"
                }
            },
            {
                $sort: {
                    code: 1
                }
            },
            {
                $skip: (parseInt(req.query.page) - 1) * parseInt(req.query.limit)
            },
            {
                $limit: parseInt(req.query.limit)
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    indication: 1,
                    deleted: 1,
                    participantId: 1,
                    code: 1,
                    categories: {
                        _id: 1,
                        name: 1,
                        code: 1,
                        deleted: 1,
                        classificationId: 1,
                        cardsId: 1
                    }
                }
            }
        ];

        let classifications = await classificationModel.aggregate(pipeline).exec();
        let count = await classificationModel.countDocuments({ deleted: false, indication: { $ne: null }, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        return res.json({ classifications, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/classification', async (req, res) => {
    try {
        let classification = await classificationModel.findOne({ $and: [{ deleted: false }, { _id: req.query.classificationId }] }).exec();
        return res.json(classification);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/classification', async (req, res) => {
    try {
        const classification = new classificationModel(req.body);
        let error = classification.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        if (req.body.static === true) {
            let previousClassification = await classificationModel.findOne({ projectId: new mongoose.Types.ObjectId(req.body.projectId), code: req.body.code, deleted: false, static: req.body.static }).exec();
            if (previousClassification) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una clasificación con ese código" })
        }
        const savedClassification = await classificationModel.create(classification);
        return res.json({
            message: "Clasificación creada exitosamente",
            id: savedClassification._id
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Clasificación inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/classification', async (req, res) => {
    try {
        let updateClassification = await classificationModel.findOne({ _id: req.query.classificationId }).exec();
        if (!updateClassification) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la clasificación" })
        let previousClassification = await classificationModel.find({ projectId: new mongoose.Types.ObjectId(req.body.projectId), code: req.body.code, deleted: false, static: req.body.static, _id: { $ne: new mongoose.Types.ObjectId(req.query.classificationId) } }).exec();
        if (previousClassification.length > 0) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" })
        delete req.body._id;
        await classificationModel.updateOne({ _id: req.query.classificationId }, { $set: req.body }).exec()
        return res.json({
            message: "Tarjeta actualizada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Clasificación inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/classification', async (req, res) => {
    try {
        const savedClassification = await classificationModel.updateOne({ _id: req.query.classificationId }, { deleted: true }).exec()
        if (savedClassification.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la clasificación" })
        return res.json({
            message: "Clasificación eliminada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

module.exports = router;
