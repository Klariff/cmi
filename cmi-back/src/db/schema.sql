-- CMI database schema (SQLite)
-- All ids are TEXT (UUID v4 strings) to keep API contract compatible with frontend.
-- Booleans are INTEGER (0/1) and converted to JS booleans by the row mapper.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
    _id      TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    deleted  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
    _id                 TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    minOpenQuestionsCnt INTEGER NOT NULL,
    introductionText    TEXT NOT NULL,
    endingText          TEXT NOT NULL,
    videoId             TEXT,
    deleted             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_projects (
    userId    TEXT NOT NULL REFERENCES users(_id)    ON DELETE CASCADE,
    projectId TEXT NOT NULL REFERENCES projects(_id) ON DELETE CASCADE,
    PRIMARY KEY (userId, projectId)
);
CREATE INDEX IF NOT EXISTS idx_user_projects_project ON user_projects(projectId);

CREATE TABLE IF NOT EXISTS cards (
    _id           TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    code          INTEGER NOT NULL,
    deleted       INTEGER NOT NULL DEFAULT 0,
    onlyShowImage INTEGER NOT NULL DEFAULT 0,
    imageId       TEXT,
    projectId     TEXT NOT NULL REFERENCES projects(_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(projectId);

CREATE TABLE IF NOT EXISTS classifications (
    _id              TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    indication       TEXT,
    deleted          INTEGER NOT NULL DEFAULT 0,
    participantId    TEXT,
    code             INTEGER NOT NULL,
    closed           INTEGER NOT NULL DEFAULT 0,
    projectId        TEXT NOT NULL REFERENCES projects(_id) ON DELETE CASCADE,
    static           INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_classifications_project ON classifications(projectId);
CREATE INDEX IF NOT EXISTS idx_classifications_participant ON classifications(participantId);

CREATE TABLE IF NOT EXISTS categories (
    _id              TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    code             INTEGER NOT NULL,
    classificationId TEXT REFERENCES classifications(_id) ON DELETE CASCADE,
    deleted          INTEGER NOT NULL DEFAULT 0,
    closed           INTEGER NOT NULL DEFAULT 0,
    projectId        TEXT NOT NULL REFERENCES projects(_id) ON DELETE CASCADE,
    static           INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(projectId);
CREATE INDEX IF NOT EXISTS idx_categories_classification ON categories(classificationId);

CREATE TABLE IF NOT EXISTS category_cards (
    categoryId TEXT NOT NULL REFERENCES categories(_id) ON DELETE CASCADE,
    cardId     TEXT NOT NULL REFERENCES cards(_id)      ON DELETE CASCADE,
    PRIMARY KEY (categoryId, cardId)
);
CREATE INDEX IF NOT EXISTS idx_category_cards_card ON category_cards(cardId);

CREATE TABLE IF NOT EXISTS participants (
    _id              TEXT PRIMARY KEY,
    fullName         TEXT NOT NULL,
    age              INTEGER NOT NULL,
    gender           TEXT NOT NULL,
    socialLevel      TEXT,
    educationalLevel TEXT,
    surveyDate       TEXT NOT NULL DEFAULT (datetime('now')),
    countryId        TEXT NOT NULL REFERENCES countries(_id),
    departmentId    TEXT NOT NULL REFERENCES departments(_id),
    cityId           TEXT NOT NULL REFERENCES cities(_id),
    areaId           TEXT REFERENCES areas(_id),
    observations     TEXT,
    deleted          INTEGER NOT NULL DEFAULT 0,
    projectId        TEXT NOT NULL REFERENCES projects(_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_participants_project ON participants(projectId);

CREATE TABLE IF NOT EXISTS countries (
    _id  TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS departments (
    _id       TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    countryId TEXT NOT NULL REFERENCES countries(_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_departments_country ON departments(countryId);

CREATE TABLE IF NOT EXISTS cities (
    _id          TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    departmentId TEXT NOT NULL REFERENCES departments(_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cities_department ON cities(departmentId);

CREATE TABLE IF NOT EXISTS areas (
    _id    TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    cityId TEXT NOT NULL REFERENCES cities(_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_areas_city ON areas(cityId);
