import {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} from './setup/testDatabase.js';

// Connect to the test database before running tests
beforeAll(async () => {
  await connectTestDB();
});

// Clear database records after every test
afterEach(async () => {
  await clearTestDB();
});

// Close database resources after all tests finish
afterAll(async () => {
  await disconnectTestDB();
});
