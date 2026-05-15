const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const { logging, log } = require('../services/log.service.js');
const { db } = require('../db');
const fileStorage = require('../storage/files');
const { exportResultsCSV, exportLabeledResultsCSV, exportParticipantsExcel } = require('../services/export.service');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const SUPPORTED_BUCKETS = new Set(['card', 'project']);
const bucketFieldMap = { card: 'imageId', project: 'videoId' };
const bucketTableMap = { card: 'cards', project: 'projects' };

router.post('/upload/file', upload.single('file'), (req, res) => {
    try {
        const bucket = req.query.bucketName;
        if (!SUPPORTED_BUCKETS.has(bucket)) {
            return res.status(logging.invalidParameters.code).json({ message: "Bucket inválido" });
        }
        if (!req.file) {
            return res.status(logging.invalidParameters.code).json({ message: "Archivo requerido" });
        }

        const fieldName = bucketFieldMap[bucket];
        const tableName = bucketTableMap[bucket];
        // The frontend sends originalname as `<entityId>.<ext>` so we can route the file
        // back to the right entity (matches the previous GridFS behaviour).
        const entityId = req.file.originalname.replace(/\.[^/.]+$/, "");

        const entity = db.prepare(`SELECT _id, ${fieldName} AS prevFileId FROM ${tableName} WHERE _id = ?`).get(entityId);
        if (!entity) {
            return res.status(logging.notFound.code).json({ message: "Entidad no encontrada" });
        }

        const newFileId = fileStorage.saveFromBuffer(bucket, req.file.buffer, req.file.originalname);
        db.prepare(`UPDATE ${tableName} SET ${fieldName} = ? WHERE _id = ?`).run(newFileId, entityId);

        if (entity.prevFileId && entity.prevFileId !== newFileId) {
            fileStorage.delete(bucket, entity.prevFileId);
        }

        return res.send({ message: 'Archivo subido exitosamente', id: newFileId });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/download/file', (req, res) => {
    try {
        const bucket = req.query.bucketName;
        if (!SUPPORTED_BUCKETS.has(bucket)) {
            return res.status(logging.invalidParameters.code).json({ message: "Bucket inválido" });
        }
        const ok = fileStorage.streamTo(bucket, req.query.fileId, res);
        if (!ok) return res.status(logging.notFound.code).json(logging.notFound);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/file', (req, res) => {
    try {
        const bucket = req.query.bucketName;
        if (!SUPPORTED_BUCKETS.has(bucket)) {
            return res.status(logging.invalidParameters.code).json({ message: "Bucket inválido" });
        }
        if (!fileStorage.exists(bucket, req.query.fileId)) {
            return res.status(logging.notFound.code).json(logging.notFound);
        }
        fileStorage.delete(bucket, req.query.fileId);
        return res.send({ message: 'Archivo eliminado exitosamente' });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/download/results', async (req, res) => {
    let filePath = await exportResultsCSV(req.query.projectId);
    res.download(filePath);
    setTimeout(() => fs.unlink(filePath, () => {}), 1000);
});

router.get('/download/labeled-results', async (req, res) => {
    let filePath = await exportLabeledResultsCSV(req.query.projectId);
    res.download(filePath);
    setTimeout(() => fs.unlink(filePath, () => {}), 1000);
});

router.get('/download/participants', async (req, res) => {
    let filePath = await exportParticipantsExcel(req.query.projectId);
    res.download(filePath);
    setTimeout(() => fs.unlink(filePath, () => {}), 1000);
});

module.exports = router;
