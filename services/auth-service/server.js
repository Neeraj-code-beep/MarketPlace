import 'dotenv/config';

import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 3000;

let server;

// Start the application only after MongoDB connects successfully
const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

// Gracefully shut down the application when a termination signal is received
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new HTTP requests and wait for ongoing requests
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      console.log('HTTP server closed.');
    }

    // Close the MongoDB connection after HTTP requests have finished
    await connectDB.connection?.close?.();

    console.log('Application shut down successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Handle terminal interruption and container termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
