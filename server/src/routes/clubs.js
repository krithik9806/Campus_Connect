import express from 'express';
import db from '../db/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List clubs
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { category, search } = req.query;

    let queryText = `
      SELECT c.*, u.name as coordinator_name, u.email as coordinator_email,
             (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id AND e.status = 'approved') as active_events_count
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      WHERE c.is_active = TRUE
    `;
    const params = [];

    if (category && category !== 'All' && category !== 'All (64)') {
      params.push(`%${category}%`);
      queryText += ` AND c.category ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY c.points DESC`;

    const result = await db.query(queryText, params);
    const clubs = result.rows;

    // If authenticated, check if user is a member
    if (req.user) {
      const memberRes = await db.query(
        'SELECT club_id, status, role FROM club_members WHERE user_id = $1',
        [req.user.id]
      );
      const memberMap = new Map();
      memberRes.rows.forEach(m => memberMap.set(m.club_id, m));

      clubs.forEach(c => {
        const mem = memberMap.get(c.id);
        c.is_member = !!mem && mem.status === 'active';
        c.membership_status = mem ? mem.status : 'not_joined';
      });
    }

    return res.json({ clubs });
  } catch (err) {
    console.error('List clubs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve clubs.' });
  }
});

// Club Leaderboard
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, category, logo_url, points, member_count
      FROM clubs
      ORDER BY points DESC
      LIMIT 5
    `);
    return res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
});

// Single club details
router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT c.*, u.name as coordinator_name, u.email as coordinator_email, u.avatar_url as coordinator_avatar
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    const club = result.rows[0];

    // Get club's events
    const eventsRes = await db.query(`
      SELECT * FROM events WHERE club_id = $1 AND status = 'approved' ORDER BY id DESC
    `, [id]);
    club.events = eventsRes.rows;

    // Check membership
    if (req.user) {
      const memRes = await db.query(`
        SELECT status, role FROM club_members WHERE club_id = $1 AND user_id = $2
      `, [id, req.user.id]);
      club.membership = memRes.rows[0] || null;
      club.is_member = memRes.rows.length > 0 && memRes.rows[0].status === 'active';
    }

    return res.json({ club });
  } catch (err) {
    console.error('Get club error:', err);
    return res.status(500).json({ error: 'Failed to retrieve club.' });
  }
});

// Join or request club membership
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    const clubRes = await db.query('SELECT * FROM clubs WHERE id = $1', [clubId]);
    if (clubRes.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    const existingMem = await db.query(
      'SELECT id, status FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );

    if (existingMem.rows.length > 0) {
      if (existingMem.rows[0].status === 'active') {
        return res.status(400).json({ error: 'You are already an active member of this club.' });
      }
      await db.query("UPDATE club_members SET status = 'active' WHERE id = $1", [existingMem.rows[0].id]);
    } else {
      await db.query(`
        INSERT INTO club_members (club_id, user_id, role, status)
        VALUES ($1, $2, 'member', 'active')
      `, [clubId, userId]);

      await db.query('UPDATE clubs SET member_count = member_count + 1 WHERE id = $1', [clubId]);
    }

    // Create notification
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Club Membership Confirmed', 'You have successfully joined ' || $2, 'system')
    `, [userId, clubRes.rows[0].name]);

    return res.json({ message: `Successfully joined ${clubRes.rows[0].name}!` });
  } catch (err) {
    console.error('Join club error:', err);
    return res.status(500).json({ error: 'Failed to join club.' });
  }
});

export default router;
