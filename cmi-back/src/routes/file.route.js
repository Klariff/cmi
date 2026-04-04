const router = require('express').Router();
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const mongoose = require('mongoose');
const entityFileJoiner = require('../utils/entityFileJoiner.js');
const { exportResultsCSV, exportParticipantsExcel, exportLabeledResultsCSV } = require('../services/export.service');
const fs = require('fs');

const storage = new GridFsStorage({
    url: env.database.uri,
    file: (req, file) => {
        return new Promise(async (resolve, reject) => {
            let bucket = req.query.bucketName;
            let element = await mongoose.model(bucket.charAt(0).toUpperCase() + bucket.slice(1)).findOne({ _id: file.originalname.replace(/\.[^/.]+$/, "") }).exec();
            element = await (await entityFileJoiner(element, bucket));
            const fileInfo = {
                filename: `${element._id}.${file.originalname.split('.').pop()}`,
                bucketName: bucket
            };
            if (element.files.length === 0) {
                return resolve(fileInfo);
            }
            lastFileId = element.files[element.files.length - 1].substring(element.files[element.files.length - 1].lastIndexOf('/') + 1).split("=").pop();
            try {
                await gfs[bucket].find({ _id: new mongoose.Types.ObjectId(lastFileId) }).toArray();
            } catch (err) {}
            resolve(fileInfo);
        });
    }
});

const upload = multer({ storage });

router.post('/upload/file', upload.single('file'), (req, res, next) => {
    mongoose.model(req.query.bucketName.charAt(0).toUpperCase() + req.query.bucketName.slice(1)).updateOne({ _id: req.file.filename.split('.')[0] }, { imageId: req.file.id }).exec();
    res.send({
        message: 'Archivo subido exitosamente',
        id: req.file.id
    });
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
