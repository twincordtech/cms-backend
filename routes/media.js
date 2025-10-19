/*
 * File: media.js
 * Description: Express routes for media and media folder management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authorizeAdmin } = require('../middleware/auth');
const Media = require('../models/Media');
const MediaFolder = require('../models/MediaFolder');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(__dirname, '../uploads/media');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg',  'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml', 'image/bmp', 'image/tiff',
      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      // Web formats
      'text/html',
      'text/css',
      'application/javascript',
      'application/json'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all media folders
router.get('/folders', authorizeAdmin, async (req, res) => {
  try {
    const folders = await MediaFolder.find()
      .populate('parent', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new media folder
router.post('/folders', authorizeAdmin, async (req, res) => {
  try {
    const folder = new MediaFolder({
      ...req.body,
      createdBy: req.user._id
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a media folder
router.put('/folders/:id', authorizeAdmin, async (req, res) => {
  try {
    const folder = await MediaFolder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a media folder
router.delete('/folders/:id', authorizeAdmin, async (req, res) => {
  try {
    const folder = await MediaFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if folder has any media files
    const mediaCount = await Media.countDocuments({ folder: folder._id });
    if (mediaCount > 0) {
      return res.status(400).json({ message: 'Cannot delete folder with media files' });
    }

    await folder.deleteOne();
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all media files
router.get('/files', authorizeAdmin, async (req, res) => {
  try {
    const { folder, type, search } = req.query;
    const query = {};

    if (folder) query.folder = folder;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const files = await Media.find(query)
      .populate('folder', 'name')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a new media file
router.post('/files', authorizeAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = new Media({
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      type: req.body.type,
      url: `/uploads/media/${req.file.filename}`,
      folder: req.body.folder,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    await file.save();
    res.status(201).json(file);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a media file
router.put('/files/:id', authorizeAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('PUT /files/:id - Request received');
    console.log('File ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const fileId = req.params.id;
    const existingFile = await Media.findById(fileId);
    
    if (!existingFile) {
      console.log('File not found:', fileId);
      return res.status(404).json({ message: 'File not found' });
    }

    console.log('Existing file:', existingFile);

    // Prepare update data
    const updateData = {
      name: req.body.name || existingFile.name,
      description: req.body.description || existingFile.description,
      type: req.body.type || existingFile.type,
      folder: req.body.folder || existingFile.folder
    };

    console.log('Update data:', updateData);

    // If a new file was uploaded, update file-related fields
    if (req.file) {
      console.log('New file uploaded:', req.file.originalname);
      
      // Delete the old file if it exists
      if (existingFile.url) {
        const oldFilePath = path.join(__dirname, '..', existingFile.url);
        console.log('Old file path:', oldFilePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Old file deleted');
        }
      }

      // Update with new file information
      updateData.url = `/uploads/media/${req.file.filename}`;
      updateData.size = req.file.size;
      updateData.mimeType = req.file.mimetype;
      
      console.log('Updated file info:', {
        url: updateData.url,
        size: updateData.size,
        mimeType: updateData.mimeType
      });
    }

    const updatedFile = await Media.findByIdAndUpdate(
      fileId,
      updateData,
      { new: true }
    ).populate('folder', 'name').populate('uploadedBy', 'name');

    console.log('File updated successfully:', updatedFile);
    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a media file
router.delete('/files/:id', authorizeAdmin, async (req, res) => {
  try {
    const file = await Media.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the physical file
    const filePath = path.join(__dirname, '..', file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// End of media.js
// Description: End of media routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 