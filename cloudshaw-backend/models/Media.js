const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      required: [true, 'Folder ID is required'],
      index: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // bytes
      default: 0,
    },
    fileType: {
      type: String,
      enum: {
        values: ['image', 'video'],
        message: '{VALUE} is not a valid file type',
      },
      required: [true, 'File type is required'],
    },
    mimeType: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    caption: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    hashtags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'uploaded'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast filtering by status within a folder
mediaSchema.index({ folderId: 1, status: 1 });
mediaSchema.index({ folderId: 1, createdAt: -1 });

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
