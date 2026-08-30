/**
 * Version file streaming with HTTP Range support.
 *
 * GET /api/v1/projects/:id/versions/:versionId/files/:fileId
 *   - authenticate + requireOrg (same as other project routes)
 *   - supports `Range: bytes=start-end` -> 206 Partial Content, which is what
 *     makes <video> seeking work without downloading the whole file
 *   - streams from the storage adapter in bounded chunks (no full-file buffering)
 */
const ProjectVersion = require('../models/projectVersion.model');
const logger = require('../utils/logger');

const CHUNK_SIZE = 1024 * 1024; // 1 MiB per range chunk

async function streamVersionFile(req, res, next) {
  try {
    const { id, versionId, fileId } = req.params;

    const version = await ProjectVersion.findOne({ _id: versionId, projectId: id }).lean();
    if (!version) return res.status(404).json({ error: { code: 'version_not_found', message: 'Version not found' } });

    const file = (version.files || []).find((f) => String(f._id) === String(fileId));
    if (!file || !file.storageRef) {
      return res.status(404).json({ error: { code: 'file_not_found', message: 'File not found' } });
    }

    const filePath = require('path').join(config_storageDir(), file.storageRef);
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: 'file_gone', message: 'Stored file missing' } });
    }

    const stat = fs.statSync(filePath);
    const total = stat.size;
    const mime = file.mimeType || 'application/octet-stream';

    const range = req.headers.range;
    if (range) {
      // Parse "bytes=start-end" (end optional). Clamp to file bounds.
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (!match || (match[1] === '' && match[2] === '')) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).json({ error: { code: 'invalid_range', message: 'Malformed Range header' } });
      }
      let start = match[1] === '' ? Math.max(total - parseInt(match[2], 10), 0) : parseInt(match[1], 10);
      let end = match[2] === '' ? Math.min(start + CHUNK_SIZE - 1, total - 1) : parseInt(match[2], 10);
      if (isNaN(start) || isNaN(end) || start > end || start >= total) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).json({ error: { code: 'invalid_range', message: 'Range out of bounds' } });
      }
      end = Math.min(end, total - 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=3600',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      // Full-file response (still streamed, not buffered).
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': mime,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
        'Cache-Control': 'private, max-age=3600',
      });
      fs.createReadStream(filePath).pipe(res);
    }

    res.on('error', (err) => {
      // Client aborted mid-stream is normal for video scrubbing.
      if (err.code !== 'ECONNRESET') logger.warn({ err }, 'stream error');
    });
  } catch (err) {
    next(err);
  }
}

function config_storageDir() {
  const config = require('../config');
  return config.storage.localDir;
}

module.exports = { streamVersionFile };
