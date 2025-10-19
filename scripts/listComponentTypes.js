/*
 * File: listComponentTypes.js
 * Description: Script to list all component type names and their isActive status for debugging layout validation.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const path = require('path');
const ComponentType = require('../models/ComponentType');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const listComponentTypes = async () => {
  await connectDB();
  const types = await ComponentType.find({}, { name: 1, isActive: 1 });
  console.log('Component Types:');
  types.forEach(t => {
    console.log(`- name: ${t.name}, isActive: ${t.isActive}`);
  });
  mongoose.disconnect();
};

listComponentTypes();

// End of listComponentTypes.js
// Description: End of script. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 