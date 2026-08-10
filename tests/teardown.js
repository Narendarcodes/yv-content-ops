module.exports = async () => {
  if (global.__MONGOD__) {
    try {
      await global.__MONGOD__.stop();
      await global.__MONGOD__.cleanup();
    } catch (e) {
      // ignore
    }
  }
};
