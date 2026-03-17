// ============================================
// DATABASE CONNECTION - MongoDB
// ============================================
import mongoose from 'mongoose';
import colors from 'colors';

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      // useNewUrlParser: true,     // Mongoose 6+ වලදී default
      // useUnifiedTopology: true,  // Mongoose 6+ වලදී default
      maxPoolSize: 10,              // Maximum 10 connections pool එකේ
      serverSelectionTimeoutMS: 5000, // 5s timeout
      socketTimeoutMS: 45000,       // 45s socket timeout
      family: 4                     // IPv4 use කරන්න
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );
    console.log(`   Database: ${conn.connection.name}`.cyan);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`.red);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB Disconnected'.yellow);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed (app termination)'.yellow);
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`.red.bold);
    // 5s retry
    console.log('🔄 Retrying connection in 5 seconds...'.yellow);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;