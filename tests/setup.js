const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect mongoose to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('MongoDB Memory Server started');
});

afterAll(async () => {
  // Disconnect and stop MongoDB Memory Server
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('MongoDB Memory Server stopped');
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
