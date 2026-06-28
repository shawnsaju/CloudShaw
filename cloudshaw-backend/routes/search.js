const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Media = require('../models/Media');

// ── GET /api/search?q=<query> ────────────────────────────────────────────────
// Global search across folders AND media for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { folders: [], media: [] } });
    }

    const userId = req.user._id;
    const regex = new RegExp(q.trim(), 'i');

    // Get user's folder IDs first (for scoping media search)
    const userFolders = await Folder.find({ userId }).select('_id').lean();
    const folderIds = userFolders.map((f) => f._id);

    const [folders, media] = await Promise.all([
      // Search folders by name
      Folder.find({ userId, name: regex }).limit(5).lean(),

      // Search media by title, caption, or hashtags
      Media.find({
        folderId: { $in: folderIds },
        $or: [{ title: regex }, { caption: regex }, { hashtags: regex }],
      })
        .limit(10)
        .populate('folderId', 'name platform color')
        .lean(),
    ]);

    res.json({ success: true, data: { folders, media } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
