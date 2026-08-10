const mongoose = require('mongoose');

function health(req, res) {
  const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: { connected: dbState === 1, state: dbState },
  });
}

module.exports = { health };
