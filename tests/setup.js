const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  if (process.env.NODE_ENV === 'test') {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    // make mongod instance available for teardown if needed
    global.__MONGOD__ = mongod;
  }
};
