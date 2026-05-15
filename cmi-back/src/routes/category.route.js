const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll } = require('../db');

function withCardsId(category) {
    if (!category) return category;
    category.cardsId = db.prepare(
        'SELECT cardId FROM category_cards WHERE categoryId = ?'
    ).all(category._id).map(r => r.cardId);
    return category;
}

function setCategoryCards(categoryId, cardsId) {
    db.prepare('DELETE FROM category_cards WHERE categoryId = ?').run(categoryId);
    if (Array.isArray(cardsId) && cardsId.length > 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO category_cards (categoryId, cardId) VALUES (?, ?)');
        for (const cardId of cardsId) stmt.run(categoryId, cardId);
    }
}

router.get('/get/categories', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;
        const cats = hydrateAll('categories', db.prepare(`
            SELECT * FROM categories WHERE deleted = 0 AND projectId = ?
            ORDER BY code LIMIT ? OFFSET ?
        `).all(req.query.projectId, limit, (page - 1) * limit)).map(withCardsId);
        return res.json(cats);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/category', (req, res) => {
    try {
        const cat = hydrate('categories', db.prepare(
            'SELECT * FROM categories WHERE _id = ? AND deleted = 0'
        ).get(req.query.categoryId));
        return res.json(cat ? withCardsId(cat) : null);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/category/classification', (req, res) => {
    try {
        const cats = hydrateAll('categories', db.prepare(`
            SELECT * FROM categories WHERE deleted = 0 AND classificationId = ? ORDER BY code
        `).all(req.query.classificationId)).map(withCardsId);
        return res.json(cats);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/category', (req, res) => {
    try {
        const { name, code, projectId, classificationId, closed, static: isStatic, cardsId } = req.body;
        if (!name || code == null || !projectId) {
            return res.status(logging.invalidParameters.code).json({ message: "Faltan parámetros requeridos" });
        }
        if (isStatic === true) {
            const dup = db.prepare(`
                SELECT _id FROM categories
                WHERE projectId = ? AND code = ? AND deleted = 0 AND static = 1
                  AND (classificationId IS ? OR classificationId = ?)
            `).get(projectId, code, classificationId || null, classificationId);
            if (dup) return res.status(logging.duplicatedAction.code).json({ message: "Ya existe una categoría con ese código" });
        }

        const id = newId();
        db.transaction(() => {
            db.prepare(`
                INSERT INTO categories (_id, name, code, classificationId, deleted, closed, projectId, static)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?)
            `).run(id, name, code, classificationId || null, closed ? 1 : 0, projectId, isStatic ? 1 : 0);

            setCategoryCards(id, cardsId);
        })();

        return res.json({ message: "Categoría creada exitosamente", id });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/category', (req, res) => {
    try {
        const cat = db.prepare('SELECT _id FROM categories WHERE _id = ?').get(req.query.categoryId);
        if (!cat) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la categoría" });

        delete req.body._id;
        const { cardsId, ...rest } = req.body;

        const allowed = ['name', 'code', 'classificationId', 'closed', 'projectId', 'static'];
        const fields = Object.keys(rest).filter(k => allowed.includes(k));

        db.transaction(() => {
            if (fields.length > 0) {
                const setClause = fields.map(f => `${f} = ?`).join(', ');
                const values = fields.map(f => {
                    const v = rest[f];
                    return (f === 'closed' || f === 'static') ? (v ? 1 : 0) : v;
                });
                db.prepare(`UPDATE categories SET ${setClause} WHERE _id = ?`).run(...values, req.query.categoryId);
            }
            if (cardsId !== undefined) setCategoryCards(req.query.categoryId, cardsId);
        })();

        return res.json({ message: "Categoría actualizada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/category', (req, res) => {
    try {
        const r = db.prepare('UPDATE categories SET deleted = 1 WHERE _id = ?').run(req.query.categoryId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró la categoría" });
        return res.json({ message: "Categoría eliminada exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
