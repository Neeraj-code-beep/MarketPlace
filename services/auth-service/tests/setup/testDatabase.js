import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Start a fresh in-memory MongoDB instance before the test suites run
export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();

  const mongoURI = mongoServer.getUri();

  await mongoose.connect(mongoURI);

  console.log('Test MongoDB Connected');
};

// Remove test data after each test to keep tests independent
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
};

// Close the database connection and stop the in-memory MongoDB instance
export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log('Test MongoDB Disconnected');
};
