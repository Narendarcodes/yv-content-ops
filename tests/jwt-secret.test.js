describe('JWT_ACCESS_SECRET enforcement', () => {
  test('throws when JWT_ACCESS_SECRET is a known default in production', () => {
    const originalEnv = { ...process.env };
    const originalError = console.error;
    let caught = null;

    // Suppress console.error during the expected failure
    console.error = () => {};

    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_ACCESS_SECRET = 'change-me';
      // Clear require cache to force re-evaluation
      delete require.cache[require.resolve('../src/config')];
      delete require.cache[require.resolve('../src/config')];
      try {
        require('../src/config');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.message).toMatch(/JWT_ACCESS_SECRET/i);
    } finally {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
      process.env.JWT_ACCESS_SECRET = originalEnv.JWT_ACCESS_SECRET;
      console.error = originalError;
      delete require.cache[require.resolve('../src/config')];
    }
  });

  test('does not throw when JWT_ACCESS_SECRET is a strong value in production', () => {
    const originalEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_ACCESS_SECRET = 'a-very-strong-and-unique-secret-value-12345';
      delete require.cache[require.resolve('../src/config')];
      const config = require('../src/config');
      expect(config.jwt.accessSecret).toBe('a-very-strong-and-unique-secret-value-12345');
    } finally {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
      process.env.JWT_ACCESS_SECRET = originalEnv.JWT_ACCESS_SECRET;
      delete require.cache[require.resolve('../src/config')];
    }
  });
});
