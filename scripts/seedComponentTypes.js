const mongoose = require('mongoose');
const path = require('path');
const ComponentType = require('../models/ComponentType');
const defaultComponentTypes = require('../config/componentTypes');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedComponentTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Convert the componentTypes object to array format for database
    const componentTypesArray = Object.entries(defaultComponentTypes).map(([name, config]) => ({
      name,
      fields: config.fields
    }));

    // Delete existing component types
    await ComponentType.deleteMany({});
    console.log('Cleared existing component types');

    // Insert new component types
    const result = await ComponentType.insertMany(componentTypesArray);
    console.log(`Seeded ${result.length} component types successfully`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding component types:', error);
    process.exit(1);
  }
};

// Run the seed function
seedComponentTypes(); 