const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Media = require('../models/Media');
const path = require('path');
const fs = require('fs');

// All folder routes require authentication
router.use(protect);

// Helper: attach media stats to a folder object
const withStats = async (folder) => {
  const [total, uploaded] = await Promise.all([
    Media.countDocuments({ folderId: folder._id }),
    Media.countDocuments({ folderId: folder._id, status: 'uploaded' }),
  ]);
  return { ...folder, totalMedia: total, uploadedMedia: uploaded };
};

// ── GET /api/folders ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const foldersWithStats = await Promise.all(folders.map(withStats));
    res.json({ success: true, data: foldersWithStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/folders ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, platform, color } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ success: false, error: 'Name and platform are required' });
    }

    const folder = new Folder({ userId: req.user._id, name, platform, color });
    const saved = await folder.save();

    res.status(201).json({
      success: true,
      data: { ...saved.toObject(), totalMedia: 0, uploadedMedia: 0 },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/folders/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }
    res.json({ success: true, data: await withStats(folder) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/folders/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, platform, color } = req.body;
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, platform, color },
      { new: true, runValidators: true }
    ).lean();

    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    res.json({ success: true, data: await withStats(folder) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/folders/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    // Also remove the uploaded files from disk
    const uploadDir = path.join(__dirname, '..', 'uploads', req.params.id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Remove all media documents for this folder
    await Media.deleteMany({ folderId: req.params.id });

    res.json({ success: true, message: 'Folder and its media deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
