const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { newId } = require('../db');

// Disk-based file storage that replaces MongoDB GridFS.
// Each "bucket" is a subdirectory under env.storage.uploadDir.
// Files are stored as <fileId>.<ext> where fileId is a generated UUID.

function bucketDir(bucket) {
    return path.join(env.storage.uploadDir, bucket);
}

function ensureBucket(bucket) {
    fs.mkdirSync(bucketDir(bucket), { recursive: true });
}

function findFilePath(bucket, fileId) {
    const dir = bucketDir(bucket);
    if (!fs.existsSync(dir)) return null;
    const matches = fs.readdirSync(dir).filter(f => f.startsWith(fileId + '.') || f === fileId);
    return matches.length ? path.join(dir, matches[0]) : null;
}

module.exports = {
    /**
     * Save a file from a Multer in-memory upload to the bucket.
     * Returns the generated fileId.
     */
    saveFromBuffer(bucket, buffer, originalFilename) {
        ensureBucket(bucket);
        const ext = (originalFilename.split('.').pop() || 'bin').toLowerCase();
        const fileId = newId();
        const filename = `${fileId}.${ext}`;
        fs.writeFileSync(path.join(bucketDir(bucket), filename), buffer);
        return fileId;
    },

    /**
     * Stream a file by id to an Express response.
     * Returns false if not found (caller can send 404).
     */
    streamTo(bucket, fileId, res) {
        const filePath = findFilePath(bucket, fileId);
        if (!filePath) return false;
        fs.createReadStream(filePath).pipe(res);
        return true;
    },

    /**
     * Delete a file by id. No-op if missing.
     */
    delete(bucket, fileId) {
        if (!fileId) return;
        const filePath = findFilePath(bucket, fileId);
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }
    },

    /**
     * Returns true if a file with this id exists in the bucket.
     */
    exists(bucket, fileId) {
        return !!findFilePath(bucket, fileId);
    },
};
