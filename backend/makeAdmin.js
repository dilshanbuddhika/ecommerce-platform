import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: 'john@example.com' },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log('SUCCESS! User is now ADMIN:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();