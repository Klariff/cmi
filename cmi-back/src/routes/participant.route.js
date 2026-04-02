const router = require('express').Router();
const participantModel = require('../models/participant.model');
const { logging, log } = require('../services/log.service.js');
const mongoose = require('mongoose');

const LOCATION_POPULATE = [
    { path: 'countryId', select: 'name' },
    { path: 'departmentId', select: 'name' },
    { path: 'cityId', select: 'name' },
    { path: 'areaId', select: 'name' },
];

router.get('/get/participants', async (req, res) => {
    try {
        let participants = await participantModel
            .find({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) })
            .populate(LOCATION_POPULATE)
            .skip((parseInt(req.query.page) - 1) * parseInt(req.query.limit))
            .limit(parseInt(req.query.limit))
            .exec();
        let count = await participantModel.countDocuments({ deleted: false, projectId: new mongoose.Types.ObjectId(req.query.projectId) }).exec();
        return res.json({ participants, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/participant', async (req, res) => {
    try {
        let participant = await participantModel
            .findOne({ $and: [{ deleted: false }, { _id: req.query.participantId }] })
            .populate(LOCATION_POPULATE)
            .exec();
        return res.json(participant);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/participant', async (req, res) => {
    try {
        // Extract _id from nested location objects sent by the frontend
        ['countryId', 'departmentId', 'cityId', 'areaId'].forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'object' && req.body[field]._id) {
                req.body[field] = req.body[field]._id;
            }
            if (!req.body[field]) delete req.body[field];
        });

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
        if (error._message === 'Participante inválido') return res.status(logging.duplicatedAction.code).json({ message: error.message });
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/participant', async (req, res) => {
    try {
        delete req.body._id;
        ['countryId', 'departmentId', 'cityId', 'areaId'].forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'object' && req.body[field]._id) {
                req.body[field] = req.body[field]._id;
            }
        });
        const savedParticipant = await participantModel.updateOne({ _id: req.query.participantId }, { $set: req.body }).exec();
        if (savedParticipant.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" });
        return res.json({ message: "Participante actualizado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        if (error._message === 'Participant validation failed') return res.status(logging.duplicatedAction.code).json({ message: error.message });
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/participant', async (req, res) => {
    try {
        const savedParticipant = await participantModel.updateOne({ _id: req.query.participantId }, { deleted: true }).exec();
        if (savedParticipant.matchedCount === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" });
        return res.json({ message: "Participante eliminado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
