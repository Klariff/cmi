const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll } = require('../db');

router.get('/get/classifications', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;
        const classifications = hydrateAll('classifications', db.prepare(`
            SELECT * FROM classifications WHERE deleted = 0 AND projectId = ?
            ORDER BY code LIMIT ? OFFSET ?
        `).all(req.query.projectId, limit, (page - 1) * limit));
        const count = db.prepare('SELECT COUNT(*) AS c FROM classifications WHERE deleted = 0 AND projectId = ?').get(req.query.projectId).c;
        return res.json({ classifications, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

// Default classifications: static templates with their categories pre-populated.
router.get('/get/classifications/default', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;

        const classifications = hydrateAll('classifications', db.prepare(`
            SELECT * FROM classifications
            WHERE deleted = 0 AND static = 1 AND projectId = ?
            ORDER BY code LIMIT ? OFFSET ?
        `).all(req.query.projectId, limit, (page - 1) * limit));

        const catStmt = db.prepare(`
            SELECT _id, name, code, deleted, classificationId
            FROM categories WHERE deleted = 0 AND classificationId = ? ORDER BY code
        `);
        const cardsStmt = db.prepare('SELECT cardId FROM category_cards WHERE categoryId = ?');

        for (const c of classifications) {
            const cats = hydrateAll('categories', catStmt.all(c._id));
            for (const cat of cats) {
                cat.cardsId = cardsStmt.all(cat._id).map(r => r.cardId);
            }
            c.categories = cats;
        }

        const count = db.prepare(`
            SELECT COUNT(*) AS c FROM classifications
            WHERE deleted = 0 AND indication IS NOT NULL AND projectId = ?
        `).get(req.query.projectId).c;

        return res.json({ classifications, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/classification', (req, res) => {
    try {
        const c = hydrate('classifications', db.prepare(
            'SELECT * FROM classifications WHERE _id = ? AND deleted = 0'
        ).get(req.query.classificationId));
        return res.json(c || null);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/classification', (req, res) => {
    try {
        const { name, code, projectId, indication, closed, participantId, static: isStatic } = req.body;
        if (!name || code == null || !projectId) {
            return res.status(logging.invalidParameters.code).json({ message: "Faltan parámetros requeridos" });
        }
        if (isStatic === true) {
            const dup = db.prepare(`
                SELECT _id FROM classifications
                WHERE projectId = ? AND code = ? AND deleted = 0 AND static = 1
            `).get(projectId, code);
            if (dup) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una clasificación con ese código" });
        }

        const id = newId();
        db.prepare(`
            INSERT INTO classifications (_id, name, indication, deleted, participantId, code, closed, projectId, static)
            VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
        `).run(id, name, indication || null, participantId || null, code, closed ? 1 : 0, projectId, isStatic ? 1 : 0);

        return res.json({ message: "Clasificación creada exitosamente", id });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/classification', (req, res) => {
    try {
        const c = db.prepare('SELECT _id FROM classifications WHERE _id = ?').get(req.query.classificationId);
        if (!c) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la clasificación" });

        if (req.body.code != null && req.body.projectId && req.body.static != null) {
            const dup = db.prepare(`
                SELECT _id FROM classifications
                WHERE projectId = ? AND code = ? AND deleted = 0 AND static = ? AND _id != ?
            `).get(req.body.projectId, req.body.code, req.body.static ? 1 : 0, req.query.classificationId);
            if (dup) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una tarjeta con ese código" });
        }

        delete req.body._id;
        const allowed = ['name', 'indication', 'participantId', 'code', 'closed', 'projectId', 'static'];
        const fields = Object.keys(req.body).filter(k => allowed.includes(k));
        if (fields.length === 0) return res.json({ message: "Tarjeta actualizada exitosamente" });

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => {
            const v = req.body[f];
            return (f === 'closed' || f === 'static') ? (v ? 1 : 0) : v;
        });
        db.prepare(`UPDATE classifications SET ${setClause} WHERE _id = ?`).run(...values, req.query.classificationId);

        return res.json({ message: "Tarjeta actualizada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/classification', (req, res) => {
    try {
        const r = db.prepare('UPDATE classifications SET deleted = 1 WHERE _id = ?').run(req.query.classificationId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la clasificación" });
        return res.json({ message: "Clasificación eliminada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
