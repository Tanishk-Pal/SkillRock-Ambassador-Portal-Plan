import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssap_campus_db';
  const dbName = process.env.MONGODB_DB_NAME || 'ssap_campus_db';

  try {
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    } as any);
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${dbName}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
};
