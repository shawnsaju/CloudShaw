const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    platform: {
      type: String,
      required: [true, 'Platform tag is required'],
      trim: true,
      enum: {
        values: ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin', 'other'],
        message: '{VALUE} is not a supported platform',
      },
      default: 'other',
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      default: '#6366f1',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total media count in this folder
folderSchema.virtual('mediaStats', {
  ref: 'Media',
  localField: '_id',
  foreignField: 'folderId',
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
