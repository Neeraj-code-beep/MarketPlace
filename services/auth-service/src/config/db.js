import mongoose from 'mongoose';

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;

  // Validate the MongoDB connection string before attempting connection
  if (!mongoURI) {
    throw new Error(
      'FATAL ERROR: MONGO_URI is not defined in environment variables.',
    );
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      // Connection pooling and timeout settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Wait up to 5 seconds to find a MongoDB server
      socketTimeoutMS: 45000, // Close inactive sockets after 45 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Monitor MongoDB connection errors after the initial connection
    mongoose.connection.on('error', (error) => {
      console.error(`MongoDB runtime error: ${error.message}`);
    });

    // Detect when the database connection is unexpectedly disconnected
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB Initial Connection Error: ${error.message}`);

    // Pass the error to the caller so it can decide how to handle failure
    throw error;
  }
}

export default connectDB;
