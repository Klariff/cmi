const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const { logging, log } = require('../services/log.service.js');
const { db, newId, hydrate, hydrateAll, transaction } = require('../db');

const DUMMY_HASH = bcrypt.hashSync('cmi_dummy_unused_hash_value', 10);

function validatePassword(password) {
    if (!password || password.length < 8 || password.length > 20) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*.]/.test(password)) return false;
    return true;
}

function getUserProjects(userId) {
    return hydrateAll('projects', db.prepare(`
        SELECT p.* FROM projects p
        JOIN user_projects up ON up.projectId = p._id
        WHERE up.userId = ? AND p.deleted = 0
    `).all(userId));
}

router.get('/get/users', (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 50;
        const users = hydrateAll('users', db.prepare(`
            SELECT * FROM users WHERE deleted = 0
            ORDER BY username LIMIT ? OFFSET ?
        `).all(limit, (page - 1) * limit));
        const count = db.prepare('SELECT COUNT(*) AS c FROM users WHERE deleted = 0').get().c;
        return res.json({ users, count });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.get('/get/user', (req, res) => {
    try {
        const user = hydrate('users', db.prepare('SELECT * FROM users WHERE _id = ? AND deleted = 0').get(req.query.userId));
        if (!user) return res.json(null);
        user.projects = getUserProjects(user._id);
        return res.json(user);
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/create/user', async (req, res) => {
    try {
        if (!validatePassword(req.body.password)) {
            return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
        }
        if (!req.body.fullName || !req.body.username) {
            return res.status(logging.invalidParameters.code).json({ message: "Nombre y usuario son requeridos" });
        }

        const existing = db.prepare('SELECT _id FROM users WHERE username = ?').get(req.body.username);
        if (existing) return res.status(logging.duplicatedAction.code).json({ message: "El usuario ya existe" });

        const hash = await bcrypt.hash(req.body.password, parseInt(env.auth.saltRounds));
        const userId = newId();
        db.prepare(`INSERT INTO users (_id, fullName, username, password, deleted) VALUES (?, ?, ?, ?, 0)`)
            .run(userId, req.body.fullName, req.body.username, hash);

        const token = jwt.sign({ userId }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpirationTime });
        return res.json({ message: "Usuario creado exitosamente", userId, token });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.patch('/update/user', async (req, res) => {
    try {
        delete req.body._id;
        if (req.body.password) {
            if (!validatePassword(req.body.password)) {
                return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
            }
            req.body.password = await bcrypt.hash(req.body.password, parseInt(env.auth.saltRounds));
        }

        const allowed = ['fullName', 'username', 'password'];
        const fields = Object.keys(req.body).filter(k => allowed.includes(k));
        if (fields.length === 0) return res.json({ message: "Usuario actualizado exitosamente" });

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => req.body[f]);
        try {
            const r = db.prepare(`UPDATE users SET ${setClause} WHERE _id = ?`).run(...values, req.query.userId);
            if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" });
        } catch (e) {
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(logging.duplicatedAction.code).json({ message: "Usuario duplicado" });
            throw e;
        }

        return res.json({ message: "Usuario actualizado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.delete('/delete/user', (req, res) => {
    try {
        const r = db.prepare('UPDATE users SET deleted = 1 WHERE _id = ?').run(req.query.userId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" });
        return res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/link/user', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND deleted = 0').get(req.query.username);
        if (!user) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" });

        const project = db.prepare('SELECT _id FROM projects WHERE _id = ? AND deleted = 0').get(req.query.projectId);
        if (!project) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el proyecto" });

        const link = db.prepare('SELECT 1 FROM user_projects WHERE userId = ? AND projectId = ?').get(user._id, req.query.projectId);
        if (link) return res.status(logging.duplicatedAction.code).json({ message: "El usuario ya está vinculado al proyecto" });

        db.prepare('INSERT INTO user_projects (userId, projectId) VALUES (?, ?)').run(user._id, req.query.projectId);
        return res.json({ message: "Usuario vinculado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/unlink/user', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND deleted = 0').get(req.query.username);
        if (!user) return res.status(logging.invalidParameters.code).json({ message: "No se encontró el usuario" });

        const r = db.prepare('DELETE FROM user_projects WHERE userId = ? AND projectId = ?').run(user._id, req.query.projectId);
        if (r.changes === 0) return res.status(logging.invalidParameters.code).json({ message: "El usuario no está asociado al proyecto" });

        return res.json({ message: "Usuario desvinculado exitosamente" });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        if (!username || !password) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        if (!validatePassword(password)) {
            return res.status(logging.invalidParameters.code).json({ message: "La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (!@#$%^&*.)" });
        }

        const existing = db.prepare('SELECT _id FROM users WHERE username = ?').get(username);
        if (existing) return res.status(logging.duplicatedAction.code).json(logging.duplicatedAction);

        const hash = await bcrypt.hash(password, parseInt(env.auth.saltRounds));
        const userId = newId();
        db.prepare(`INSERT INTO users (_id, fullName, username, password, deleted) VALUES (?, ?, ?, ?, 0)`)
            .run(userId, fullName || username, username, hash);

        return res.json({ message: "Usuario creado exitosamente", userId });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

router.post('/login', async (req, res) => {
    try {
        if (!req.body.username || !req.body.password) return res.status(logging.invalidParameters.code).json(logging.invalidParameters);
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND deleted = 0').get(req.body.username);
        const hashToCompare = user ? user.password : DUMMY_HASH;
        const ok = await bcrypt.compare(req.body.password, hashToCompare);
        if (!user || !ok) return res.status(logging.authenticationError.code).json(logging.authenticationError);
        const token = jwt.sign({ userId: user._id }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpirationTime });
        return res.json({ userId: user._id, token });
    } catch (error) {
        log(req, logging.internalServerError, error.message);
        return res.status(logging.internalServerError.code).json(logging.internalServerError);
    }
});

module.exports = router;
