const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Attempting to connect to configured MongoDB URI...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected successfully via MONGO_URI.');
      return;
    } catch (err) {
      console.warn(`Configured MongoDB connection failed (${err.message}). Falling back to in-memory MongoDB...`);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    console.log(`Starting embedded In-Memory MongoDB instance at: ${memoryUri}`);
    await mongoose.connect(memoryUri);
    console.log('Connected to In-Memory MongoDB (Zero-configuration mode active).');
  } catch (err) {
    console.error('Failed to start MongoDB (both external and in-memory):', err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('MongoDB disconnected.');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
