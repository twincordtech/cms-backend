/* ========================================================================
 * File: removeLayoutVersioning.js
 * Description: Migration script to remove version fields from existing layout documents.
 * Author: Tech4biz Solutions
 * Copyright: Tech4biz Solutions Private
 * ======================================================================== */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for migration'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get the Layout model
const Layout = require('../models/Layout');

async function removeLayoutVersioning() {
  try {
    console.log('Starting layout versioning removal migration...');
    
    // Find all layouts that have version fields
    const layoutsWithVersion = await Layout.find({
      $or: [
        { version: { $exists: true } },
        { changeHistory: { $exists: true } },
        { __v: { $exists: true } }
      ]
    });
    
    console.log(`Found ${layoutsWithVersion.length} layouts with version fields`);
    
    if (layoutsWithVersion.length === 0) {
      console.log('No layouts with version fields found. Migration complete.');
      return;
    }
    
    // Update each layout to remove version fields
    for (const layout of layoutsWithVersion) {
      console.log(`Processing layout: ${layout.name} (${layout._id})`);
      
      // Remove version fields
      const updateData = {
        $unset: {
          version: "",
          changeHistory: "",
          __v: ""
        }
      };
      
      await Layout.updateOne(
        { _id: layout._id },
        updateData
      );
      
      console.log(`✓ Removed version fields from layout: ${layout.name}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
removeLayoutVersioning();

/* ========================================================================
 * End of removeLayoutVersioning.js
 * Description: End of migration script. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.
 * ======================================================================== */ 