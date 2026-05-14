const router = require('express').Router();
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const multer = require('multer');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { exportResultsCSV, exportParticipantsExcel, exportLabeledResultsCSV } = require('../services/export.service');
const fs = require('fs');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const bucketFieldMap = { card: 'imageId', project: 'videoId' };

router.post('/upload/file', upload.single('file'), async (req, res) => {
    try {
        const bucket = req.query.bucketName;
        if (!bucket || !gfs[bucket]) {
            return res.status(logging.invalidParameters.code).json({ message: "Bucket inválido" });
        }
        if (!req.file) {
            return res.status(logging.invalidParameters.code).json({ message: "Archivo requerido" });
        }

        const fieldName = bucketFieldMap[bucket] || 'imageId';
        const Model = mongoose.model(bucket.charAt(0).toUpperCase() + bucket.slice(1));
        const entityId = req.file.originalname.replace(/\.[^/.]+$/, "");
        const ext = req.file.originalname.split('.').pop();
        const filename = `${entityId}.${ext}`;

        const entity = await Model.findOne({ _id: entityId }).exec();
        if (!entity) {
            return res.status(logging.notFound.code).json({ message: "Entidad no encontrada" });
        }
        const previousFileId = entity[fieldName] || null;

        const uploadStream = gfs[bucket].openUploadStream(filename, { contentType: req.file.mimetype });
        const newFileId = uploadStream.id;

        await new Promise((resolve, reject) => {
            Readable.from(req.file.buffer).pipe(uploadStream)
                .on('finish', resolve)
                .on('error', reject);
        });

        await Model.updateOne({ _id: entityId }, { [fieldName]: newFileId }).exec();

        if (previousFileId && previousFileId.toString() !== newFileId.toString()) {
            try { await gfs[bucket].delete(new mongoose.Types.ObjectId(previousFileId)); } catch (e) {}
        }

        res.send({
            message: 'Archivo subido exitosamente',
            id: newFileId
        });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/download/file', async (req, res) => {
    try {
        const files = await gfs[req.query.bucketName].find({ _id: new mongoose.Types.ObjectId(req.query.fileId) }).toArray();
        if (!files || files.length === 0 || files[0].filename.includes('*')) {
            return res.status(logging.notFound.code).json(logging.notFound);
        }
        gfs[req.query.bucketName].openDownloadStreamByName(files[0].filename).pipe(res);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/file', async (req, res) => {
    try {
        const files = await gfs[req.query.bucketName].find({ _id: new mongoose.Types.ObjectId(req.query.fileId) }).toArray();
        if (!files || files.length === 0 || files[0].filename.includes('*')) {
            return res.status(logging.notFound.code).json(logging.notFound);
        }
        await gfs[req.query.bucketName].delete(new mongoose.Types.ObjectId(req.query.fileId));
        res.send({ message: 'Archivo eliminado exitosamente' });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/download/results', async (req, res) => {
    let filePath = await exportResultsCSV(req.query.projectId);
    res.download(filePath);
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err)
                return
            }
        });
    }, 1000);
});

router.get('/download/labeled-results', async (req, res) => {
    let filePath = await exportLabeledResultsCSV(req.query.projectId);
    res.download(filePath);
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err)
                return
            }
        });
    }, 1000);
});

router.get('/download/participants', async (req, res) => {
    let filePath = await exportParticipantsExcel(req.query.projectId);
    res.download(filePath);
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err)
                return
            }
        });
    }, 1000);
});

module.exports = router;
