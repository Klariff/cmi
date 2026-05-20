const router = require('express').Router();
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll } = require('../db');
const fileStorage = require('../storage/files');

router.get('/get/projects', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 50;
        const projects = hydrateAll('projects', db.prepare(
            'SELECT * FROM projects WHERE deleted = 0 ORDER BY name LIMIT ? OFFSET ?'
        ).all(limit, (page - 1) * limit));
        const count = db.prepare('SELECT COUNT(*) AS c FROM projects WHERE deleted = 0').get().c;
        return res.json({ projects, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/projects/user', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 50;
        const projects = hydrateAll('projects', db.prepare(`
            SELECT p.* FROM projects p
            JOIN user_projects up ON up.projectId = p._id
            WHERE up.userId = ? AND p.deleted = 0
            ORDER BY p.name LIMIT ? OFFSET ?
        `).all(req.query.userId, limit, (page - 1) * limit));
        return res.json(projects);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/project', (req, res) => {
    try {
        if (!req.query.projectId || req.query.projectId == 'null') {
            return res.status(logging.invalidParameters.code).json({ message: "El parametro projectId es requerido" });
        }
        const project = hydrate('projects', db.prepare(
            'SELECT * FROM projects WHERE _id = ? AND deleted = 0'
        ).get(req.query.projectId));
        return res.json(project || null);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

// Seed a fully-populated example project (Medio Ambiente) so a fresh
// installation has something to play with without manual setup.
router.post('/create/project/example', (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(logging.invalidParameters.code).json({ message: "userId es requerido" });

        const projectId = newId();
        const introduction = "Estamos haciendo un estudio acerca de lo que las personas piensan sobre el medio ambiente. " +
            "A continuación verás un conjunto de tarjetas con acciones cotidianas; tu tarea es agruparlas según los criterios que consideres relevantes.";
        const ending = "¡Muchas gracias por tu participación!";

        const cards = [
            "Reciclar en casa",
            "Comprar productos locales y de temporada",
            "Pagar más por un producto ecológico",
            "Hacer voluntariado ambiental",
            "Tomar duchas en cinco minutos o menos",
            "Comprar en tiendas locales",
            "Participar activamente de un grupo ambientalista",
            "Apagar las luces que dejé de utilizar",
            "Votar por un alcalde que promueva la construcción de ciclo-rutas",
            "Votar por un político que tenga su programa de gobierno orientado a mitigación y adaptación al cambio climático",
            "Votar por consejales que apoyen políticas ambientales",
            "Leer noticias sobre cambio climático",
            "Reducir el consumo de carne",
            "Usar bicicleta o transporte público",
            "Compostar residuos orgánicos",
        ];

        db.transaction(() => {
            db.prepare(`
                INSERT INTO projects (_id, name, minOpenQuestionsCnt, introductionText, endingText, videoId, deleted)
                VALUES (?, ?, ?, ?, ?, NULL, 0)
            `).run(projectId, 'Ejemplo · Medio ambiente', 2, introduction, ending);
            db.prepare('INSERT INTO user_projects (userId, projectId) VALUES (?, ?)').run(userId, projectId);

            const cardStmt = db.prepare(`
                INSERT INTO cards (_id, name, code, deleted, onlyShowImage, imageId, projectId)
                VALUES (?, ?, ?, 0, 0, NULL, ?)
            `);
            cards.forEach((name, idx) => cardStmt.run(newId(), name, idx + 1, projectId));
        })();

        return res.json({ message: "Proyecto de ejemplo creado exitosamente", id: projectId });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/project', (req, res) => {
    try {
        const { name, minOpenQuestionsCnt, introductionText, endingText, userId } = req.body;
        if (!name || minOpenQuestionsCnt == null || !introductionText || !endingText) {
            return res.status(logging.invalidParameters.code).json({ message: "Faltan parámetros requeridos" });
        }
        if (!userId) return res.status(logging.invalidParameters.code).json({ message: "userId es requerido" });

        const projectId = newId();
        db.transaction(() => {
            db.prepare(`
                INSERT INTO projects (_id, name, minOpenQuestionsCnt, introductionText, endingText, videoId, deleted)
                VALUES (?, ?, ?, ?, ?, NULL, 0)
            `).run(projectId, name, minOpenQuestionsCnt, introductionText, endingText);

            db.prepare('INSERT INTO user_projects (userId, projectId) VALUES (?, ?)').run(userId, projectId);
        })();

        return res.json({ message: "Proyecto creado exitosamente", id: projectId });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/project', (req, res) => {
    try {
        delete req.body._id;

        const allowed = ['name', 'minOpenQuestionsCnt', 'introductionText', 'endingText', 'videoId'];
        const fields = Object.keys(req.body).filter(k => allowed.includes(k));
        if (fields.length === 0) return res.json({ message: "Proyecto actualizado exitosamente" });

        // Detect previous video that should be deleted from disk on this update.
        let previousVideoId = null;
        if ('videoId' in req.body) {
            const current = db.prepare('SELECT videoId FROM projects WHERE _id = ?').get(req.query.projectId);
            if (current && current.videoId) {
                const newVal = req.body.videoId;
                if (newVal === null || (newVal && newVal.toString() !== current.videoId.toString())) {
                    previousVideoId = current.videoId;
                }
            }
        }

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => req.body[f]);
        const r = db.prepare(`UPDATE projects SET ${setClause} WHERE _id = ?`).run(...values, req.query.projectId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el parámetro" });

        if (previousVideoId) fileStorage.delete('project', previousVideoId);

        return res.json({ message: "Proyecto actualizado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/project', (req, res) => {
    try {
        const projectId = req.query.projectId;

        // Gather files before deleting rows.
        const cards = db.prepare('SELECT imageId FROM cards WHERE projectId = ?').all(projectId);
        const project = db.prepare('SELECT videoId FROM projects WHERE _id = ?').get(projectId);

        db.transaction(() => {
            // FK ON DELETE CASCADE handles cards/categories/classifications/participants/junctions.
            db.prepare('DELETE FROM projects WHERE _id = ?').run(projectId);
        })();

        // Delete files on disk after the DB transaction commits.
        for (const c of cards) {
            if (c.imageId) fileStorage.delete('card', c.imageId);
        }
        if (project && project.videoId) fileStorage.delete('project', project.videoId);

        return res.json({ message: "Proyecto eliminado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/clear/project', (req, res) => {
    try {
        const projectId = req.query.projectId;
        db.transaction(() => {
            db.prepare('DELETE FROM categories       WHERE projectId = ? AND static = 0').run(projectId);
            db.prepare('DELETE FROM classifications  WHERE projectId = ? AND static = 0').run(projectId);
            db.prepare('DELETE FROM participants     WHERE projectId = ?').run(projectId);
        })();
        return res.json({ message: "Proyecto depurado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
