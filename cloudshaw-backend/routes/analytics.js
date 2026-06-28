const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Media = require('../models/Media');
const Folder = require('../models/Folder');

// All analytics routes are protected
router.use(protect);

// ── GET /api/analytics/overview ──────────────────────────────────────────────
// Total counts across all user folders
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all folder IDs belonging to this user
    const folders = await Folder.find({ userId }).select('_id').lean();
    const folderIds = folders.map((f) => f._id);

    const [totalMedia, uploadedMedia, pendingMedia, totalFolders] = await Promise.all([
      Media.countDocuments({ folderId: { $in: folderIds } }),
      Media.countDocuments({ folderId: { $in: folderIds }, status: 'uploaded' }),
      Media.countDocuments({ folderId: { $in: folderIds }, status: 'pending' }),
      Folder.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: { totalMedia, uploadedMedia, pendingMedia, totalFolders },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/analytics/platform-breakdown ────────────────────────────────────
// Media count grouped by platform (for pie/donut chart)
router.get('/platform-breakdown', async (req, res) => {
  try {
    const userId = req.user._id;
    const folders = await Folder.find({ userId }).lean();

    const result = await Promise.all(
      folders.map(async (folder) => {
        const [total, uploaded] = await Promise.all([
          Media.countDocuments({ folderId: folder._id }),
          Media.countDocuments({ folderId: folder._id, status: 'uploaded' }),
        ]);
        return {
          platform: folder.platform,
          folderName: folder.name,
          folderId: folder._id,
          color: folder.color,
          total,
          uploaded,
          pending: total - uploaded,
        };
      })
    );

    // Group by platform
    const byPlatform = {};
    result.forEach(({ platform, total, uploaded, pending }) => {
      if (!byPlatform[platform]) {
        byPlatform[platform] = { platform, total: 0, uploaded: 0, pending: 0 };
      }
      byPlatform[platform].total += total;
      byPlatform[platform].uploaded += uploaded;
      byPlatform[platform].pending += pending;
    });

    res.json({ success: true, data: { byFolder: result, byPlatform: Object.values(byPlatform) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/analytics/activity ──────────────────────────────────────────────
// Items uploaded per day over the last 14 days (for timeline chart)
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const folders = await Folder.find({ userId }).select('_id').lean();
    const folderIds = folders.map((f) => f._id);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const activity = await Media.aggregate([
      {
        $match: {
          folderId: { $in: folderIds },
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          uploaded: {
            $sum: { $cond: [{ $eq: ['$status', 'uploaded'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = activity.find((a) => a._id === key);
      days.push({
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: found ? found.count : 0,
        uploaded: found ? found.uploaded : 0,
      });
    }

    res.json({ success: true, data: days });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
