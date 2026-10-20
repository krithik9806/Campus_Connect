import express from 'express';
import db from '../db/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get announcements
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { scope, club_id } = req.query;
    let queryText = `
      SELECT a.*, c.name as club_name, u.name as author_name, u.role as author_role
      FROM announcements a
      LEFT JOIN clubs c ON a.club_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (scope) {
      params.push(scope);
      queryText += ` AND a.scope = $${params.length}`;
    }

    if (club_id) {
      params.push(club_id);
      queryText += ` AND a.club_id = $${params.length}`;
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT 20`;

    const result = await db.query(queryText, params);
    return res.json({ announcements: result.rows });
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ error: 'Failed to retrieve announcements.' });
  }
});

// Broadcast announcement (Coordinators or Admins)
router.post('/', authenticate, requireRole(['coordinator', 'admin']), async (req, res) => {
  try {
    const { title, message, scope, priority, club_id, event_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const result = await db.query(`
      INSERT INTO announcements (club_id, title, message, scope, priority, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      club_id || null,
      title.trim(),
      message.trim(),
      scope || 'college_wide',
      priority || 'normal',
      req.user.id
    ]);

    const announcement = result.rows[0];

    // If broadcasting to event attendees, create in-app notifications for each attendee
    if (event_id) {
      const attendees = await db.query(
        "SELECT user_id FROM registrations WHERE event_id = $1 AND status != 'cancelled'",
        [event_id]
      );
      for (const att of attendees.rows) {
        await db.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, 'event')
        `, [att.user_id, `Broadcast: ${title}`, message]);
      }
    }

    return res.status(201).json({
      message: 'Announcement broadcasted successfully!',
      announcement
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ error: 'Failed to publish announcement.' });
  }
});

export default router;
