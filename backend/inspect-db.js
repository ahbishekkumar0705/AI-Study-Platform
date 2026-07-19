import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const inspect = async () => {
  try {
    console.log('Connecting to database:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.\n');

    // Define temporary schemas to read
    const File = mongoose.model('File', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const usersCount = await User.countDocuments();
    const filesCount = await File.countDocuments();

    console.log(`=== DB STATS ===`);
    console.log(`Total Users: ${usersCount}`);
    console.log(`Total Files: ${filesCount}`);
    console.log(`================\n`);

    if (usersCount > 0) {
      console.log('=== USERS ===');
      const users = await User.find().lean();
      users.forEach(u => console.log(`- ID: ${u._id}, Username: ${u.username}, Email: ${u.email}, Verified: ${u.isVerified}`));
      console.log('=============\n');
    }

    if (filesCount > 0) {
      console.log('=== FILES ===');
      const files = await File.find().lean();
      files.forEach(f => {
        console.log(`- ID: ${f._id}`);
        console.log(`  Name: ${f.name}`);
        console.log(`  Status: ${f.status}`);
        console.log(`  Pages: ${f.numPages}`);
        console.log(`  Error: ${f.error || 'None'}`);
        console.log(`  Created: ${f.createdAt}`);
      });
      console.log('=============\n');
    }

  } catch (err) {
    console.error('Inspection failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

inspect();
