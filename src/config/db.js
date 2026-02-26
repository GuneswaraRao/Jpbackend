import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/janvipriya-invoice';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('');
    console.error('To fix:');
    console.error('  1) Install MongoDB: https://www.mongodb.com/try/download/community');
    console.error('     Then start the service (e.g. on Windows: run "mongod" or start MongoDB from Services).');
    console.error('  2) Or use MongoDB Atlas (free cloud): https://www.mongodb.com/cloud/atlas');
    console.error('     Create a cluster, get the connection string, and set MONGODB_URI in server/.env');
    console.error('');
    process.exit(1);
  }
}
