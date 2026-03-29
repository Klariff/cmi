const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cardModel = require('../models/card.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const entityFileJoiner = require('../utils/entityFileJoiner.js');
const mongoose = require('mongoose');

router.get('/get/cards', async (req, res) => {
    try {
        let cards = await cardModel.find({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).sort({ code: 1 }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        if (cards.length > 0) {
            cards = await entityFileJoiner(cards, 'card');
        }
        let count = await cardModel.countDocuments({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        return res.json({ cards, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/card', async (req, res) => {
    try {
        let card = await cardModel.findOne({ $and: [{ deleted: false }, { _id: req.query.cardId }] }).exec();
        if (!card) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" })
        card = await entityFileJoiner(card, 'card');
        return res.json(card);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/card', async (req, res) => {
    try {
        const card = new cardModel(req.body);
        let error = card.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        let previousCard = await cardModel.findOne({ projectId: new mongoose.Types.ObjectId(req.body.projectId), code: req.body.code, deleted: false }).exec();
        if (previousCard) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" })
        const savedCard = await cardModel.create(card);
        return res.json({
            message: "Tarjeta creado exitosamente",
            id: savedCard._id
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Tarjeta inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/card', async (req, res) => {
    try {
        let updateCard = await cardModel.findOne({ _id: req.query.cardId }).exec();
        if (!updateCard) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" })
        delete req.body._id;
        let previousCard = await cardModel.find({ projectId: new mongoose.Types.ObjectId(req.body.projectId), code: req.body.code, deleted: false, static: req.body.static, _id: { $ne: new mongoose.Types.ObjectId(req.query.cardId) } }).exec();
        if (previousCard.length > 0) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" })
        await cardModel.updateOne({ _id: req.query.cardId }, { $set: req.body }).exec()
        return res.json({
            message: "Tarjeta actualizada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Tarjeta inválida') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/card', async (req, res) => {
    try {
        const savedCard = await cardModel.updateOne({ _id: req.query.cardId }, { deleted: true }).exec()
        if (savedCard.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" })
        let foundCard = await cardModel.findOne({ _id: req.query.cardId }).exec();
        if (foundCard.imageId) {
            await gfs["card"].delete(new mongoose.Types.ObjectId(foundCard.imageId));
            await cardModel.updateOne({ _id: req.query.cardId }, { imageId: undefined }).exec()
        }
        return res.json({
            message: "Tarjeta eliminada exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

module.exports = router;
