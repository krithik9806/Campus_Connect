import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate token
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      student_id: user.student_id,
      avatar_url: user.avatar_url
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, role, department, student_id, avatar_url, engagement_score)
      VALUES ($1, $2, $3, 'student', $4, $5, $6, 50)
      RETURNING id, name, email, role, department, student_id, avatar_url, engagement_score
    `, [
      name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      department || 'General Studies',
      student_id || `CC-2025-${Math.floor(100 + Math.random() * 900)}`,
      avatar_url
    ]);

    const user = result.rows[0];
    const token = signToken(user);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, 'USER_REGISTERED', 'New student registered: ' || $2)
    `, [user.id, user.email]);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      student_id: user.student_id,
      avatar_url: user.avatar_url,
      engagement_score: user.engagement_score
    };

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current User Profile & Stats
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await db.query(`
      SELECT id, name, email, role, department, student_id, avatar_url, engagement_score, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];

    // Count user registrations
    const regCountRes = await db.query(`
      SELECT COUNT(*) as count FROM registrations WHERE user_id = $1 AND status != 'cancelled'
    `, [user.id]);

    // Count attended events
    const attCountRes = await db.query(`
      SELECT COUNT(*) as count FROM attendance WHERE user_id = $1
    `, [user.id]);

    // Count clubs joined
    const clubCountRes = await db.query(`
      SELECT COUNT(*) as count FROM club_members WHERE user_id = $1 AND status = 'active'
    `, [user.id]);

    return res.json({
      user,
      stats: {
        registeredEvents: parseInt(regCountRes.rows[0].count, 10),
        attendedEvents: parseInt(attCountRes.rows[0].count, 10),
        clubsJoined: parseInt(clubCountRes.rows[0].count, 10),
        rank: '#12 in Active Participation',
        tier: 'Level 4 Campus Leader'
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Switch Demo User (For testing the 3 user personas easily)
router.post('/switch-demo-user', async (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail = 'aarav.sharma@campus.edu';
    if (role === 'coordinator') targetEmail = 'priya.patel@campus.edu';
    if (role === 'admin') targetEmail = 'admin@campus.edu';

    const result = await db.query('SELECT * FROM users WHERE email = $1', [targetEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Demo user for role ${role} not found.` });
    }

    const user = result.rows[0];
    const token = signToken(user);

    return res.json({
      message: `Switched to ${user.name} (${user.role})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        student_id: user.student_id,
        avatar_url: user.avatar_url,
        engagement_score: user.engagement_score
      }
    });
  } catch (err) {
    console.error('Switch demo user error:', err);
    return res.status(500).json({ error: 'Failed to switch demo user.' });
  }
});

export default router;
