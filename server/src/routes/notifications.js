import express from 'express';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get current user's notifications
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 30
    `, [req.user.id]);

    const unreadCountRes = await db.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `, [req.user.id]);

    return res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCountRes.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (req, res) => {
  try {
    await db.query(`
      UPDATE notifications SET is_read = TRUE WHERE user_id = $1
    `, [req.user.id]);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

export default router;
