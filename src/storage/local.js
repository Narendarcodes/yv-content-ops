const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = require('../config');

/**
 * Local-disk storage adapter (MVP).
 * The storage boundary means a cloud object store can be swapped in later
 * without touching services/controllers.
 */
const UPLOAD_DIR = config.storage.localDir;

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * @param {Buffer|string} data file bytes
 * @param {{filename:string, mimeType?:string}} meta
 * @returns {Promise<{storageRef:string, size:number}>}
 */
async function saveFile(data, meta) {
  ensureDir();
  const id = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(meta.filename || '');
  const storageName = `${id}${ext}`;
  const full = path.join(UPLOAD_DIR, storageName);
  await fs.promises.writeFile(full, data);
  return { storageRef: storageName, size: Buffer.byteLength(data) };
}

async function getFile(storageRef) {
  const full = path.join(UPLOAD_DIR, storageRef);
  if (!fs.existsSync(full)) throw { status: 404, code: 'file_not_found', message: 'File not found' };
  return fs.promises.readFile(full);
}

module.exports = { saveFile, getFile };
