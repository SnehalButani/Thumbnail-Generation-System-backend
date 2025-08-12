import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('Please provide MONGO_URI in the environment variables');
}

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;