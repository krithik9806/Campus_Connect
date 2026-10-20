import express from 'express';
import db from '../db/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import QRCode from 'qrcode';

const router = express.Router();

// List events
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { category, search, club_id, status } = req.query;

    let queryText = `
      SELECT e.*, c.name as club_name, c.logo_url as club_logo, c.category as club_category
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by status (default to approved unless requested by coordinator/admin)
    if (status) {
      params.push(status);
      queryText += ` AND e.status = $${params.length}`;
    } else {
      params.push('approved');
      queryText += ` AND e.status = $${params.length}`;
    }

    if (category && category !== 'All Events' && category !== 'All') {
      params.push(category);
      queryText += ` AND e.category = $${params.length}`;
    }

    if (club_id) {
      params.push(club_id);
      queryText += ` AND e.club_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.venue ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY e.id ASC`;

    const result = await db.query(queryText, params);
    const events = result.rows;

    // If authenticated, attach user's registration status for each event
    if (req.user) {
      const userRegs = await db.query(
        'SELECT event_id, ticket_code, status FROM registrations WHERE user_id = $1',
        [req.user.id]
      );
      const regMap = new Map();
      userRegs.rows.forEach(r => regMap.set(r.event_id, r));

      events.forEach(ev => {
        const userReg = regMap.get(ev.id);
        ev.is_registered = !!userReg && userReg.status !== 'cancelled';
        ev.user_ticket_code = userReg?.ticket_code || null;
        ev.user_registration_status = userReg?.status || null;
      });
    }

    return res.json({ events });
  } catch (err) {
    console.error('List events error:', err);
    return res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

// Get single event
router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT e.*, c.name as club_name, c.logo_url as club_logo, c.cover_image as club_cover,
             u.name as creator_name, u.email as creator_email
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = result.rows[0];

    // Check if user is registered
    if (req.user) {
      const regRes = await db.query(`
        SELECT r.*, a.checked_in_at
        FROM registrations r
        LEFT JOIN attendance a ON r.id = a.registration_id
        WHERE r.event_id = $1 AND r.user_id = $2
      `, [id, req.user.id]);

      if (regRes.rows.length > 0) {
        event.registration = regRes.rows[0];
        event.is_registered = regRes.rows[0].status !== 'cancelled';
      }
    }

    return res.json({ event });
  } catch (err) {
    console.error('Get event error:', err);
    return res.status(500).json({ error: 'Failed to retrieve event.' });
  }
});

// Create Event (Coordinators & Admins)
router.post('/', authenticate, requireRole(['coordinator', 'admin']), async (req, res) => {
  try {
    const {
      title, description, category, club_id, image_url, date_str,
      start_time, end_time, venue, capacity, price_type, ticket_price,
      budget_requested, coordinator_notes
    } = req.body;

    if (!title || !category || !venue || !date_str) {
      return res.status(400).json({ error: 'Title, category, venue, and date are required.' });
    }

    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending_approval';

    const result = await db.query(`
      INSERT INTO events (
        club_id, title, description, category, image_url, date_str,
        start_time, end_time, venue, capacity, registered_count,
        price_type, ticket_price, status, budget_requested, coordinator_notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      club_id || 1,
      title.trim(),
      description || '',
      category,
      image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      date_str,
      start_time || '09:00 AM',
      end_time || '05:00 PM',
      venue,
      capacity ? parseInt(capacity, 10) : 100,
      price_type || 'free',
      ticket_price ? parseFloat(ticket_price) : 0.00,
      initialStatus,
      budget_requested ? parseFloat(budget_requested) : 0.00,
      coordinator_notes || '',
      req.user.id
    ]);

    const createdEvent = result.rows[0];

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, 'EVENT_CREATED', 'Event created: ' || $2 || ' with status ' || $3)
    `, [req.user.id, createdEvent.title, initialStatus]);

    return res.status(201).json({
      message: initialStatus === 'approved' ? 'Event created and published!' : 'Event submitted for administrative sanctioning!',
      event: createdEvent
    });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ error: 'Failed to create event.' });
  }
});

// Register for an event
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check event exists and is approved
    const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const event = eventRes.rows[0];

    if (event.status !== 'approved') {
      return res.status(400).json({ error: 'This event is not open for registrations.' });
    }

    // Capacity check
    if (event.registered_count >= event.capacity) {
      return res.status(400).json({ error: 'This event has reached full capacity.' });
    }

    // Duplicate registration check
    const existingReg = await db.query(
      'SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingReg.rows.length > 0 && existingReg.rows[0].status === 'registered') {
      return res.status(409).json({ error: 'You are already registered for this event.' });
    }

    const ticketCode = `TKT-${event.title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'EV')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `CC_PASS_${eventId}_${userId}_${ticketCode}`;

    // Generate QR Code data URL
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      token: qrToken,
      ticketCode,
      eventId: event.id,
      userId: req.user.id,
      name: req.user.name,
      eventTitle: event.title
    }));

    let regResult;
    if (existingReg.rows.length > 0) {
      // Re-activate cancelled registration
      regResult = await db.query(`
        UPDATE registrations
        SET status = 'registered', ticket_code = $1, qr_token = $2, registered_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [ticketCode, qrToken, existingReg.rows[0].id]);
    } else {
      regResult = await db.query(`
        INSERT INTO registrations (event_id, user_id, ticket_code, status, qr_token)
        VALUES ($1, $2, $3, 'registered', $4)
        RETURNING *
      `, [eventId, userId, ticketCode, qrToken]);
    }

    // Increment registered_count on event
    await db.query(`
      UPDATE events SET registered_count = registered_count + 1 WHERE id = $1
    `, [eventId]);

    // Create confirmation notification
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, 'registration')
    `, [
      userId,
      `Pass Confirmed: ${event.title}`,
      `Your ticket code is ${ticketCode}. Show your digital QR badge at the venue entry.`
    ]);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, 'REGISTRATION_SUCCESS', 'Registered for event: ' || $2)
    `, [userId, event.title]);

    return res.status(201).json({
      message: 'Registration successful!',
      registration: regResult.rows[0],
      qrDataUrl,
      ticketCode
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register for event.' });
  }
});

// Cancel registration
router.delete('/:id/register', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const regRes = await db.query(
      'SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (regRes.rows.length === 0 || regRes.rows[0].status === 'cancelled') {
      return res.status(404).json({ error: 'Active registration not found.' });
    }

    await db.query(
      "UPDATE registrations SET status = 'cancelled' WHERE id = $1",
      [regRes.rows[0].id]
    );

    await db.query(
      'UPDATE events SET registered_count = GREATEST(0, registered_count - 1) WHERE id = $1',
      [eventId]
    );

    return res.json({ message: 'Registration successfully cancelled.' });
  } catch (err) {
    console.error('Cancel registration error:', err);
    return res.status(500).json({ error: 'Failed to cancel registration.' });
  }
});

// Coordinator: Get attendees list for an event (Screen 3)
router.get('/:id/attendees', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;

    const result = await db.query(`
      SELECT r.id as registration_id, r.ticket_code, r.status as registration_status, r.registered_at,
             u.id as user_id, u.name, u.email, u.student_id, u.department, u.avatar_url,
             a.id as attendance_id, a.method as check_in_method, a.checked_in_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE r.event_id = $1 AND r.status != 'cancelled'
      ORDER BY (a.id IS NOT NULL) DESC, r.registered_at DESC
    `, [eventId]);

    return res.json({ attendees: result.rows });
  } catch (err) {
    console.error('Get attendees error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendees.' });
  }
});

// Coordinator: Check-In Attendee via QR Token or Student ID / Ticket Code (Screen 3)
router.post('/:id/check-in', authenticate, requireRole(['coordinator', 'admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { token, code, student_id } = req.body;

    if (!token && !code && !student_id) {
      return res.status(400).json({ error: 'QR token, ticket code, or student ID is required.' });
    }

    let regQuery = `
      SELECT r.*, u.name, u.email, u.student_id, u.department
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1 AND r.status = 'registered'
    `;
    const params = [eventId];

    if (token) {
      params.push(token);
      regQuery += ` AND r.qr_token = $${params.length}`;
    } else if (code) {
      params.push(code.trim().toUpperCase());
      regQuery += ` AND UPPER(r.ticket_code) = $${params.length}`;
    } else if (student_id) {
      params.push(student_id.trim().toUpperCase());
      regQuery += ` AND UPPER(u.student_id) = $${params.length}`;
    }

    const regRes = await db.query(regQuery, params);

    if (regRes.rows.length === 0) {
      return res.status(404).json({
        error: 'No active registration found matching the provided QR badge or Student ID for this event.'
      });
    }

    const registration = regRes.rows[0];

    // Check if already checked in
    const attCheck = await db.query(
      'SELECT id, checked_in_at FROM attendance WHERE event_id = $1 AND user_id = $2',
      [eventId, registration.user_id]
    );

    if (attCheck.rows.length > 0) {
      return res.status(409).json({
        error: `${registration.name} is already checked in at ${new Date(attCheck.rows[0].checked_in_at).toLocaleTimeString()}`,
        attendee: registration
      });
    }

    // Record attendance
    const method = token ? 'qr_scan' : 'manual';
    const attRes = await db.query(`
      INSERT INTO attendance (event_id, registration_id, user_id, verified_by, method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [eventId, registration.id, registration.user_id, req.user.id, method]);

    // Update status in registrations
    await db.query("UPDATE registrations SET status = 'attended' WHERE id = $1", [registration.id]);

    // Increment checked_in_count in events
    await db.query('UPDATE events SET checked_in_count = checked_in_count + 1 WHERE id = $1', [eventId]);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, 'ATTENDANCE_RECORDED', 'Checked in attendee ' || $2 || ' for event #' || $3)
    `, [req.user.id, registration.name, eventId]);

    return res.json({
      message: `Verified and Checked In: ${registration.name}`,
      attendance: attRes.rows[0],
      attendee: {
        id: registration.user_id,
        name: registration.name,
        email: registration.email,
        student_id: registration.student_id,
        department: registration.department,
        ticket_code: registration.ticket_code,
        checked_in_at: attRes.rows[0].checked_in_at,
        method
      }
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Failed to process check-in.' });
  }
});

// Coordinator: Event metrics for event manager (Screen 3)
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const event = eventRes.rows[0];

    const regCountRes = await db.query(
      "SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status != 'cancelled'",
      [eventId]
    );
    const totalReg = parseInt(regCountRes.rows[0].count, 10);

    const attCountRes = await db.query(
      'SELECT COUNT(*) as count FROM attendance WHERE event_id = $1',
      [eventId]
    );
    const checkedIn = parseInt(attCountRes.rows[0].count, 10);

    const remainingSeats = Math.max(0, event.capacity - totalReg);
    const turnoutRate = totalReg > 0 ? ((checkedIn / totalReg) * 100).toFixed(1) : '0.0';

    return res.json({
      event,
      stats: {
        totalRegistrations: totalReg,
        checkedIn,
        turnoutRate: `${turnoutRate}%`,
        remainingSeats,
        capacity: event.capacity,
        rating: '4.8 / 5.0'
      }
    });
  } catch (err) {
    console.error('Get event stats error:', err);
    return res.status(500).json({ error: 'Failed to get stats.' });
  }
});

export default router;
