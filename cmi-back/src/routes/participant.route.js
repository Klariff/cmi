const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const participantModel = require('../models/participant.model');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

router.get('/get/participants', async (req, res) => {
    try {
        let participants = await participantModel.find({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec();
        let count = await participantModel.countDocuments({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        return res.json({participants, count});
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.get('/get/participant', async (req, res) => {
    try {
        let participant = await participantModel.findOne({ $and: [{ deleted: false }, { _id: req.query.participantId }] }).exec();
        return res.json(participant);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.post('/create/participant', async (req, res) => {
    try {
        const participant = new participantModel(req.body);
        let error = participant.validateSync();
        if (error) return res.status(logging.invalidParameters.code).json({ message: error.message });
        const savedParticipant = await participantModel.create(participant);
        return res.json({
            message: "Participante creado exitosamente",
            id: savedParticipant._id
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Participante inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.patch('/update/participant', async (req, res) => {
    try {
        delete req.body._id;
        const savedParticipant = await participantModel.updateOne({ _id: req.query.participantId }, { $set: req.body }).exec()
        if (savedParticipant.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" })
        return res.json({
            message: "Participante actualizado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Participant validation failed') return res.status(logging.duplicatedAction.code).json({ message: error.message })
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

router.delete('/delete/participant', async (req, res) => {
    try {
        const savedParticipant = await participantModel.updateOne({ _id: req.query.participantId }, { deleted: true }).exec()
        if (savedParticipant.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" })
        return res.json({
            message: "Participante eliminado exitosamente",
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
})

module.exports = router;
