// End-to-End Verification Test Script for CampusConnect
import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting CampusConnect End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`  ⏳ ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('1. Server Health Check', async () => {
    const res = await req('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. Student Login & Switch Demo
  let studentToken = '';
  await test('2. Student Authentication (Aarav Sharma)', async () => {
    const res = await req('/auth/switch-demo-user', {
      method: 'POST',
      body: JSON.stringify({ role: 'student' })
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.token, 'Token must exist');
    assert.strictEqual(res.data.user.role, 'student');
    studentToken = res.data.token;
  });

  // 3. Coordinator Authentication
  let coordToken = '';
  await test('3. Coordinator Authentication (Priya Patel)', async () => {
    const res = await req('/auth/switch-demo-user', {
      method: 'POST',
      body: JSON.stringify({ role: 'coordinator' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'coordinator');
    coordToken = res.data.token;
  });

  // 4. Admin Authentication
  let adminToken = '';
  await test('4. Administrator Authentication (Dr. Rajesh Menon)', async () => {
    const res = await req('/auth/switch-demo-user', {
      method: 'POST',
      body: JSON.stringify({ role: 'admin' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'admin');
    adminToken = res.data.token;
  });

  // 5. Invalid Login Rejection
  await test('5. Invalid Credentials Rejection', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@campus.edu', password: 'wrong' })
    });
    assert.strictEqual(res.status, 401);
  });

  // 6. Role-Specific Protected Route (Admin Only)
  await test('6. Role Authorization: Non-admin rejected from Admin endpoints', async () => {
    const res = await req('/admin/stats', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 403, 'Student must be rejected from admin endpoint');
  });

  // 7. Event Discovery & Filtering
  await test('7. Event Discovery with Category Filter', async () => {
    const res = await req('/events?category=Hackathons');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.events));
    assert(res.data.events.some(e => e.title.includes('HackCon')));
  });

  // 8. Clubs Directory & Leaderboard
  await test('8. Clubs Directory and Top Leaderboard', async () => {
    const res = await req('/clubs');
    assert.strictEqual(res.status, 200);
    assert(res.data.clubs.length >= 6);

    const lbRes = await req('/clubs/stats/leaderboard');
    assert.strictEqual(lbRes.status, 200);
    assert(lbRes.data.leaderboard.length >= 3);
  });

  // 9. Event Registration & Duplicate Prevention
  await test('9. Registration & Duplicate Prevention Flow', async () => {
    // Register student for event #4 (Battle of the Bands)
    const regRes = await req('/events/4/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    // Can be 201 created or 409 already registered
    assert([201, 409].includes(regRes.status));

    // Try duplicate registration
    const dupRes = await req('/events/4/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate registration must return 409 Conflict');
  });

  // 10. QR & Manual Attendance Validation
  await test('10. Attendee Check-In Verification Flow', async () => {
    // Register student for event 1 (HackCon)
    const regRes = await req('/events/1/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    let ticketCode = regRes.data?.ticketCode;
    if (!ticketCode) {
      // If already registered, fetch attendees list or registered events to find ticket code
      const myEvRes = await req('/events', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const registeredEv = (myEvRes.data.events || []).find(e => e.id === 1 && e.is_registered);
      ticketCode = registeredEv?.user_ticket_code || 'TKT-HACK-001';
    }

    const checkInRes = await req('/events/1/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${coordToken}` },
      body: JSON.stringify({ code: ticketCode })
    });
    assert([200, 409].includes(checkInRes.status), `Expected 200 or 409, got ${checkInRes.status}`);
  });

  // 11. Event Proposal Sanctioning (Admin Screen 4)
  await test('11. Governance Proposal Sanction & Approval', async () => {
    // Check pending proposals
    const propRes = await req('/admin/proposals?status=pending_approval', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(propRes.status, 200);

    if (propRes.data.proposals.length > 0) {
      const target = propRes.data.proposals[0];
      const approveRes = await req(`/admin/events/${target.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ notes: 'Sanctioned via Automated E2E Suite' })
      });
      assert.strictEqual(approveRes.status, 200);
    }
  });

  // 12. Dashboard Statistics Derived from DB
  await test('12. Real-Time Admin Statistics Calculation', async () => {
    const res = await req('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.stats.totalRegistrations > 0);
    assert(res.data.stats.attendanceRate);
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
