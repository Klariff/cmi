const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll } = require('../db');
const fileStorage = require('../storage/files');

function withFiles(card) {
    if (!card) return card;
    card.files = card.imageId
        ? [`/api/download/file?bucketName=card&fileId=${card.imageId}`]
        : [];
    return card;
}

router.get('/get/cards', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;
        let cards = hydrateAll('cards', db.prepare(`
            SELECT * FROM cards WHERE deleted = 0 AND projectId = ?
            ORDER BY code LIMIT ? OFFSET ?
        `).all(req.query.projectId, limit, (page - 1) * limit));
        cards = cards.map(withFiles);
        const count = db.prepare('SELECT COUNT(*) AS c FROM cards WHERE deleted = 0 AND projectId = ?').get(req.query.projectId).c;
        return res.json({ cards, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/card', (req, res) => {
    try {
        let card = hydrate('cards', db.prepare('SELECT * FROM cards WHERE _id = ? AND deleted = 0').get(req.query.cardId));
        if (!card) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" });
        return res.json(withFiles(card));
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/card', (req, res) => {
    try {
        const { name, code, projectId, onlyShowImage } = req.body;
        if (!name || code == null || !projectId) {
            return res.status(logging.invalidParameters.code).json({ message: "Faltan parámetros requeridos" });
        }
        const dup = db.prepare('SELECT _id FROM cards WHERE projectId = ? AND code = ? AND deleted = 0').get(projectId, code);
        if (dup) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" });

        const id = newId();
        db.prepare(`INSERT INTO cards (_id, name, code, deleted, onlyShowImage, imageId, projectId) VALUES (?, ?, ?, 0, ?, NULL, ?)`)
            .run(id, name, code, onlyShowImage ? 1 : 0, projectId);
        return res.json({ message: "Tarjeta creado exitosamente", id });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/card', (req, res) => {
    try {
        const card = db.prepare('SELECT * FROM cards WHERE _id = ?').get(req.query.cardId);
        if (!card) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" });

        delete req.body._id;

        if (req.body.code != null && req.body.projectId) {
            const dup = db.prepare(`
                SELECT _id FROM cards
                WHERE projectId = ? AND code = ? AND deleted = 0 AND _id != ?
            `).get(req.body.projectId, req.body.code, req.query.cardId);
            if (dup) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" });
        }

        const allowed = ['name', 'code', 'onlyShowImage', 'imageId', 'projectId'];
        const fields = Object.keys(req.body).filter(k => allowed.includes(k));
        if (fields.length === 0) return res.json({ message: "Tarjeta actualizada exitosamente" });

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => {
            const v = req.body[f];
            return (f === 'onlyShowImage') ? (v ? 1 : 0) : v;
        });
        db.prepare(`UPDATE cards SET ${setClause} WHERE _id = ?`).run(...values, req.query.cardId);

        return res.json({ message: "Tarjeta actualizada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/card', (req, res) => {
    try {
        const card = db.prepare('SELECT * FROM cards WHERE _id = ?').get(req.query.cardId);
        if (!card) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la tarjeta" });

        db.prepare('UPDATE cards SET deleted = 1, imageId = NULL WHERE _id = ?').run(req.query.cardId);
        if (card.imageId) fileStorage.delete('card', card.imageId);

        return res.json({ message: "Tarjeta eliminada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
