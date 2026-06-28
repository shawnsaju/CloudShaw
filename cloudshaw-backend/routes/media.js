const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const Media = require('../models/Media');
const Folder = require('../models/Folder');
const upload = require('../middleware/upload');

// All media routes require authentication
router.use(protect);

// Helper: derive fileType from mimeType
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'image';
};

// Helper: verify folder belongs to the requesting user
const verifyFolderOwnership = async (folderId, userId) => {
  const folder = await Folder.findOne({ _id: folderId, userId });
  return folder;
};

// ── POST /api/media/:folderId/upload ─────────────────────────────────────────
router.post('/:folderId/upload', upload.array('files', 20), async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await verifyFolderOwnership(folderId, req.user._id);
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const savedMedia = await Promise.all(
      req.files.map(async (file) => {
        const relativePath = `/uploads/${folderId}/${file.filename}`;
        const fileType = getFileType(file.mimetype);

        const media = new Media({
          folderId,
          filePath: relativePath,
          fileName: file.originalname,
          fileSize: file.size,
          fileType,
          mimeType: file.mimetype,
          title: path.parse(file.originalname).name,
          caption: '',
          hashtags: [],
          status: 'pending',
        });

        return media.save();
      })
    );

    res.status(201).json({ success: true, data: savedMedia, count: savedMedia.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/media/:folderId ─────────────────────────────────────────────────
router.get('/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;

    // Verify ownership
    const folder = await verifyFolderOwnership(folderId, req.user._id);
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    const { status, search, page = 1, limit = 50 } = req.query;
    const query = { folderId };

    if (status && ['pending', 'uploaded'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { hashtags: searchRegex }, { caption: searchRegex }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [media, total] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Media.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: media,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/media/item/:id ──────────────────────────────────────────────────
router.get('/item/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('folderId', 'name platform color userId');
    if (!media) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    // Verify ownership through folder
    if (media.folderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: media });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/media/item/:id ──────────────────────────────────────────────────
router.put('/item/:id', async (req, res) => {
  try {
    const { title, caption, hashtags, scheduledDate } = req.body;

    const media = await Media.findById(req.params.id).populate('folderId', 'userId');
    if (!media) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    if (media.folderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await Media.findByIdAndUpdate(
      req.params.id,
      { title, caption, hashtags, scheduledDate: scheduledDate || null },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/media/item/:id/status ────────────────────────────────────────
router.patch('/item/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'uploaded'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "pending" or "uploaded"' });
    }

    const media = await Media.findById(req.params.id).populate('folderId', 'userId');
    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });
    if (media.folderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await Media.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/media/bulk ────────────────────────────────────────────────────
// Bulk status update or bulk delete
router.patch('/bulk', async (req, res) => {
  try {
    const { ids, action, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No media IDs provided' });
    }

    // Verify all media belong to this user
    const mediaItems = await Media.find({ _id: { $in: ids } }).populate('folderId', 'userId');
    const owned = mediaItems.every(
      (m) => m.folderId && m.folderId.userId.toString() === req.user._id.toString()
    );
    if (!owned) return res.status(403).json({ success: false, error: 'Access denied' });

    if (action === 'delete') {
      // Delete files from disk
      mediaItems.forEach((m) => {
        const filePath = path.join(__dirname, '..', m.filePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      await Media.deleteMany({ _id: { $in: ids } });
      res.json({ success: true, message: `${ids.length} items deleted` });
    } else if (action === 'status' && status) {
      await Media.updateMany({ _id: { $in: ids } }, { status });
      res.json({ success: true, message: `${ids.length} items updated to "${status}"` });
    } else {
      res.status(400).json({ success: false, error: 'Invalid bulk action' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/media/item/:id ───────────────────────────────────────────────
router.delete('/item/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('folderId', 'userId');
    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });
    if (media.folderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const filePath = path.join(__dirname, '..', media.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
