/*
 * File: db.js
 * Description: Handles MongoDB connection setup using Mongoose for the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Setting strictQuery to false to prepare for the future change
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in newer versions but won't cause errors
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // SSL/TLS options to handle certificate issues
      ssl: true,
      sslValidate: false, // Disable SSL validation for development
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Give more details about the connection error
    if (error.name === 'MongoParseError') {
      console.error('Please check your MongoDB connection string format');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server. Please check if MongoDB is running and network settings');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

// End of db.js
// Description: End of MongoDB connection configuration file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 