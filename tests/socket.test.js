describe('Socket.IO server configuration', () => {
  test('CORS origin is read from config, not hardcoded to true', () => {
    // Set a specific CORS origin
    process.env.CORS_ORIGIN = 'https://app.example.com';
    delete require.cache[require.resolve('../src/config')];
    const config = require('../src/config');

    // config.corsOrigin should be an array of origins when CORS_ORIGIN is set
    expect(config.corsOrigin).toEqual(['https://app.example.com']);
    expect(config.corsOrigin).not.toBe(true);

    // Clean up
    delete process.env.CORS_ORIGIN;
    delete require.cache[require.resolve('../src/config')];
  });

  test('initSocketServer accepts corsOrigin from config', () => {
    // The socket.js module should reference config.corsOrigin rather than
    // hardcoding origin: true. We require it and inspect the source.
    const socketSource = require('fs').readFileSync(
      require('path').join(__dirname, '../src/realtime/socket.js'),
      'utf8'
    );

    // The socket module should reference config.corsOrigin or require('../config')
    expect(socketSource).toMatch(/config\.corsOrigin|require\(['"`].*config['"`]/);
    // It should NOT hardcode origin: true
    expect(socketSource).not.toMatch(/origin:\s*true/);
  });
});
