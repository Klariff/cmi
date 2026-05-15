const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('../config/env');

const dbDir = path.dirname(env.database.path);
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(env.database.path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema (idempotent — uses CREATE TABLE IF NOT EXISTS).
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// ----- Boolean field maps for row hydration -------------------------------
const BOOLEAN_FIELDS = {
    users:           ['deleted'],
    projects:        ['deleted'],
    cards:           ['deleted', 'onlyShowImage'],
    classifications: ['deleted', 'closed', 'static'],
    categories:      ['deleted', 'closed', 'static'],
    participants:    ['deleted'],
};

function hydrate(table, row) {
    if (!row) return row;
    const fields = BOOLEAN_FIELDS[table] || [];
    for (const f of fields) {
        if (f in row) row[f] = !!row[f];
    }
    return row;
}

function hydrateAll(table, rows) {
    return rows.map(r => hydrate(table, r));
}

// ----- ID generation -------------------------------------------------------
function newId() {
    return require('crypto').randomUUID();
}

module.exports = {
    db,
    newId,
    hydrate,
    hydrateAll,
    transaction: (fn) => db.transaction(fn),
};
