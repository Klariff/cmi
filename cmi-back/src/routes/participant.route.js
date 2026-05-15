const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll } = require('../db');

// Replace location FK ids with `{ _id, name }` objects to mimic mongoose populate.
function populateLocations(p) {
    if (!p) return p;
    const fields = [
        ['countryId',    'countries'],
        ['departmentId', 'departments'],
        ['cityId',       'cities'],
        ['areaId',       'areas'],
    ];
    for (const [field, table] of fields) {
        if (p[field]) {
            const row = db.prepare(`SELECT _id, name FROM ${table} WHERE _id = ?`).get(p[field]);
            p[field] = row || null;
        }
    }
    return p;
}

router.get('/get/participants', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;
        const participants = hydrateAll('participants', db.prepare(`
            SELECT * FROM participants WHERE deleted = 0 AND projectId = ?
            ORDER BY surveyDate DESC LIMIT ? OFFSET ?
        `).all(req.query.projectId, limit, (page - 1) * limit)).map(populateLocations);
        const count = db.prepare('SELECT COUNT(*) AS c FROM participants WHERE deleted = 0 AND projectId = ?').get(req.query.projectId).c;
        return res.json({ participants, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/participant', (req, res) => {
    try {
        const p = hydrate('participants', db.prepare(
            'SELECT * FROM participants WHERE _id = ? AND deleted = 0'
        ).get(req.query.participantId));
        return res.json(p ? populateLocations(p) : null);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

function flattenLocationObjects(body) {
    for (const f of ['countryId', 'departmentId', 'cityId', 'areaId']) {
        if (body[f] && typeof body[f] === 'object' && body[f]._id) body[f] = body[f]._id;
        if (!body[f]) delete body[f];
    }
}

router.post('/create/participant', (req, res) => {
    try {
        flattenLocationObjects(req.body);
        const { fullName, age, gender, countryId, departmentId, cityId, projectId,
                areaId, socialLevel, educationalLevel, observations } = req.body;

        if (!fullName || age == null || !gender || !countryId || !departmentId || !cityId || !projectId) {
            return res.status(logging.invalidParameters.code).json({ message: "Faltan parámetros requeridos" });
        }

        const id = newId();
        db.prepare(`
            INSERT INTO participants (_id, fullName, age, gender, socialLevel, educationalLevel,
                                      surveyDate, countryId, departmentId, cityId, areaId,
                                      observations, deleted, projectId)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, 0, ?)
        `).run(id, fullName, age, gender, socialLevel || null, educationalLevel || null,
               countryId, departmentId, cityId, areaId || null, observations || null, projectId);

        return res.json({ message: "Participante creado exitosamente", id });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/participant', (req, res) => {
    try {
        delete req.body._id;
        flattenLocationObjects(req.body);

        const allowed = ['fullName', 'age', 'gender', 'socialLevel', 'educationalLevel',
                         'countryId', 'departmentId', 'cityId', 'areaId', 'observations', 'projectId'];
        const fields = Object.keys(req.body).filter(k => allowed.includes(k));
        if (fields.length === 0) return res.json({ message: "Participante actualizado exitosamente" });

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => req.body[f]);
        const r = db.prepare(`UPDATE participants SET ${setClause} WHERE _id = ?`).run(...values, req.query.participantId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" });

        return res.json({ message: "Participante actualizado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/participant', (req, res) => {
    try {
        const r = db.prepare('UPDATE participants SET deleted = 1 WHERE _id = ?').run(req.query.participantId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el participante" });
        return res.json({ message: "Participante eliminado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
