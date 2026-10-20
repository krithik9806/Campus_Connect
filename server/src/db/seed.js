import bcrypt from 'bcryptjs';
import db from './index.js';

export async function seedDatabase() {
  console.log('Seeding CampusConnect database...');

  // Check if users already exist
  const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(existingUsers.rows[0].count, 10) > 0) {
    console.log('Database already has records, skipping seed.');
    return;
  }

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Insert Users
  const userAarav = await db.query(`
    INSERT INTO users (name, email, password_hash, role, department, student_id, avatar_url, engagement_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    'Aarav Sharma',
    'aarav.sharma@campus.edu',
    defaultPassword,
    'student',
    'Computer Science',
    'CS-2023-894',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    78
  ]);
  const studentId = userAarav.rows[0].id;

  const userPriya = await db.query(`
    INSERT INTO users (name, email, password_hash, role, department, student_id, avatar_url, engagement_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    'Priya Patel',
    'priya.patel@campus.edu',
    defaultPassword,
    'coordinator',
    'Robotics & Automation',
    'ROBO-2022-412',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    92
  ]);
  const coordinatorId = userPriya.rows[0].id;

  const userAdmin = await db.query(`
    INSERT INTO users (name, email, password_hash, role, department, student_id, avatar_url, engagement_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    'Dr. Rajesh Menon',
    'admin@campus.edu',
    defaultPassword,
    'admin',
    'Dean of Student Affairs',
    'FAC-ADM-001',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    99
  ]);
  const adminId = userAdmin.rows[0].id;

  // Insert more students for attendee table
  const attendeesData = [
    { name: 'Ethan Cross', email: 'ethan.cross@campus.edu', dept: 'Computer Science', id: 'CS-2024-102', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
    { name: 'Sophia Chen', email: 'sophia.chen@campus.edu', dept: 'Data Science', id: 'DS-2023-551', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { name: 'Marcus Miller', email: 'marcus.miller@campus.edu', dept: 'Electrical Eng', id: 'EE-2024-339', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
    { name: 'Sarah Jenkins', email: 'sarah.j@campus.edu', dept: 'Artificial Intelligence', id: 'AI-2023-882', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
    { name: 'Liam King', email: 'liam.king@campus.edu', dept: 'Mechanical Eng', id: 'ME-2024-118', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
    { name: 'Maya Lin', email: 'maya.lin@campus.edu', dept: 'Software Eng', id: 'SE-2023-402', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' }
  ];

  const attendeeIds = [];
  for (const a of attendeesData) {
    const res = await db.query(`
      INSERT INTO users (name, email, password_hash, role, department, student_id, avatar_url, engagement_score)
      VALUES ($1, $2, $3, 'student', $4, $5, $6, $7)
      RETURNING id
    `, [a.name, a.email, defaultPassword, a.dept, a.id, a.avatar, Math.floor(Math.random() * 40 + 50)]);
    attendeeIds.push(res.rows[0].id);
  }

  // 2. Insert Clubs
  const clubs = [
    {
      name: 'ACM Student Chapter',
      category: 'Technical & Coding',
      description: 'The premier computing and technology society on campus. Hosting hackathons, competitive programming, and technical masterclasses.',
      cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      coordinator_id: coordinatorId,
      member_count: 450,
      points: 980
    },
    {
      name: 'Robotics & AI Guild',
      category: 'Technical & Coding',
      description: 'Pioneering autonomous robotics, drone technologies, computer vision, and hands-on hardware engineering.',
      cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
      coordinator_id: coordinatorId,
      member_count: 320,
      points: 840
    },
    {
      name: 'Design & UX Collective',
      category: 'Design & Creative',
      description: 'Empowering digital product designers, UI/UX researchers, visual storytellers, and 3D animators across campus.',
      cover_image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=200&q=80',
      coordinator_id: null,
      member_count: 210,
      points: 720
    },
    {
      name: 'Music & Acoustic Society',
      category: 'Cultural & Arts',
      description: 'Bringing together vocalists, instrumentalists, sound engineers, and music enthusiasts for live campus concerts and jams.',
      cover_image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80',
      coordinator_id: null,
      member_count: 180,
      points: 610
    },
    {
      name: 'Entrepreneurship Cell (E-Cell)',
      category: 'Entrepreneurship',
      description: 'Nurturing student founders, startup pitch fests, venture incubation, and direct mentorship from industry venture capitalists.',
      cover_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=200&q=80',
      coordinator_id: null,
      member_count: 290,
      points: 580
    },
    {
      name: 'Model United Nations (MUN) Club',
      category: 'Social & Community',
      description: 'Debating global geopolitics, international diplomacy, parliamentary simulations, and public policy discourse.',
      cover_image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
      logo_url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=200&q=80',
      coordinator_id: null,
      member_count: 140,
      points: 490
    }
  ];

  const clubIds = [];
  for (const c of clubs) {
    const res = await db.query(`
      INSERT INTO clubs (name, category, description, cover_image, logo_url, coordinator_id, member_count, points)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [c.name, c.category, c.description, c.cover_image, c.logo_url, c.coordinator_id, c.member_count, c.points]);
    clubIds.push(res.rows[0].id);
  }

  // Add memberships for Aarav (Student)
  await db.query(`
    INSERT INTO club_members (club_id, user_id, role, status)
    VALUES ($1, $2, 'member', 'active'), ($3, $4, 'member', 'active')
  `, [clubIds[0], studentId, clubIds[1], studentId]);

  // 3. Insert Events
  // Featured Event (HackCon)
  const evHackcon = await db.query(`
    INSERT INTO events (club_id, title, description, category, image_url, date_str, start_time, end_time, venue, capacity, registered_count, checked_in_count, price_type, ticket_price, status, budget_requested, impact_score, safety_clearance, coordinator_notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING id
  `, [
    clubIds[0], // ACM
    'Annual Spring HackCon 2025',
    'The flagship 36-hour collegiate hackathon bringing together over 500 designers, developers, and founders to build cutting-edge solutions for real-world impact.',
    'Hackathons',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'March 15-16, 2025',
    '09:00 AM',
    '06:00 PM',
    'Main Tech Tower, Hall B',
    500,
    342,
    0,
    'free',
    0.00,
    'approved',
    2500.00,
    'High',
    'Approved',
    'Sponsors secured. Security clearances approved for 36-hour overnight duration.',
    coordinatorId
  ]);
  const hackconId = evHackcon.rows[0].id;

  // Coordinator Event (Drone Swarm)
  const evDrone = await db.query(`
    INSERT INTO events (club_id, title, description, category, image_url, date_str, start_time, end_time, venue, capacity, registered_count, checked_in_count, price_type, ticket_price, status, budget_requested, impact_score, safety_clearance, coordinator_notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING id
  `, [
    clubIds[1], // Robotics Guild
    'Autonomous Drone Swarm Workshop',
    'Hands-on session covering PX4 autopilot software, ROS2 messaging frameworks, and multi-agent spatial coordination for quadcopters.',
    'Workshops',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1000&q=80',
    'March 22, 2025',
    '10:00 AM',
    '04:00 PM',
    'Robotics Arena & Lab 3',
    866,
    842,
    318,
    'free',
    0.00,
    'approved',
    1200.00,
    'High',
    'Approved',
    'Indoor safety nets and RF frequency clearances confirmed.',
    coordinatorId
  ]);
  const droneEventId = evDrone.rows[0].id;

  // Additional approved events
  const otherEvents = [
    {
      club_id: clubIds[2],
      title: 'Design Thinking: UI/UX in the Age of AI',
      desc: 'Interactive workshop on generative interface patterns, accessibility tokens, and rapid Figma prototyping.',
      cat: 'Workshops',
      img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
      date: 'March 18, 2025',
      time: '02:00 PM - 05:00 PM',
      venue: 'Design Center, Studio A',
      cap: 120,
      reg: 98,
      status: 'approved'
    },
    {
      club_id: clubIds[3],
      title: 'Inter-College Battle of the Bands',
      desc: 'Annual acoustic and rock showdown featuring 14 collegiate bands across the state. Live voting and prizes.',
      cat: 'Cultural',
      img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      date: 'March 28, 2025',
      time: '05:30 PM - 10:00 PM',
      venue: 'Open Air Amphitheatre',
      cap: 600,
      reg: 480,
      status: 'approved'
    },
    {
      club_id: clubIds[0],
      title: 'Quantum Computing & Cryptography Seminar',
      desc: 'Distinguished lecture on Post-Quantum Lattice Cryptography and Shor algorithm implications for campus networks.',
      cat: 'Tech Talks',
      img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      date: 'April 02, 2025',
      time: '11:00 AM - 01:00 PM',
      venue: 'Tech Auditorium A',
      cap: 200,
      reg: 145,
      status: 'approved'
    },
    {
      club_id: clubIds[4],
      title: 'Campus Recruitment Prep & Mock Day',
      desc: 'Comprehensive placement readiness boot camp: technical coding screens, system design, and behavioural mock interviews.',
      cat: 'Career',
      img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      date: 'April 05, 2025',
      time: '09:30 AM - 04:30 PM',
      venue: 'Placement Cell Complex',
      cap: 250,
      reg: 210,
      status: 'approved'
    },
    {
      club_id: clubIds[4],
      title: 'Alumni Networking Mixer & Panel',
      desc: 'Connect with distinguished alumni founders, executives, and researchers over coffee and networking circles.',
      cat: 'Socials',
      img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      date: 'April 12, 2025',
      time: '04:00 PM - 07:00 PM',
      venue: 'Student Commons Lounge',
      cap: 150,
      reg: 110,
      status: 'approved'
    }
  ];

  for (const ev of otherEvents) {
    await db.query(`
      INSERT INTO events (club_id, title, description, category, image_url, date_str, start_time, end_time, venue, capacity, registered_count, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, '10:00 AM', '04:00 PM', $7, $8, $9, $10, $11)
    `, [ev.club_id, ev.title, ev.desc, ev.cat, ev.img, ev.date, ev.venue, ev.cap, ev.reg, ev.status, coordinatorId]);
  }

  // Pending Proposals for Governance / Admin Screen (Screen 4)
  const pendingProposals = [
    {
      club_id: clubIds[1], // Robotics Guild
      title: 'National AI & Robotics Symposium',
      desc: 'Three-day inter-collegiate showcase featuring autonomous ground vehicles, drone displays, and keynote lectures by industry leaders.',
      cat: 'Tech Talks',
      img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      date: 'November 18-20, 2025',
      venue: 'Main Auditorium & Lab 4',
      cap: 500,
      budget: 1250.00,
      impact: 'High',
      safety: 'Approved',
      notes: 'Facilities cleared. Security team assigned. Speaker list verified and travel funded.'
    },
    {
      club_id: clubIds[0],
      title: 'Midnight Stargazing & Astronomy Camp',
      desc: 'Overnight celestial observation session with high-powered telescopes, astrophysics talks, and astrophotography workshops.',
      cat: 'Socials',
      img: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
      date: 'December 05, 2025',
      venue: 'North Campus Observatory & Field',
      cap: 80,
      budget: 400.00,
      impact: 'Medium',
      safety: 'Requires Overnight Campus Security Permission',
      notes: 'Requires coordination with campus night patrol and field lighting controls.'
    },
    {
      club_id: clubIds[0],
      title: 'Inter-College Esports Championship',
      desc: 'LAN tournament featuring Valorant, Rocket League, and Chess across 32 collegiate squads with live twitch streaming.',
      cat: 'Sports',
      img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      date: 'December 12-14, 2025',
      venue: 'Student Center Arena',
      cap: 300,
      budget: 850.00,
      impact: 'High',
      safety: 'Approved',
      notes: 'Network bandwidth testing complete. 1Gbps fiber drops confirmed.'
    }
  ];

  for (const p of pendingProposals) {
    await db.query(`
      INSERT INTO events (club_id, title, description, category, image_url, date_str, start_time, end_time, venue, capacity, registered_count, status, budget_requested, impact_score, safety_clearance, coordinator_notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, '09:00 AM', '09:00 PM', $7, $8, 0, 'pending_approval', $9, $10, $11, $12, $13)
    `, [p.club_id, p.title, p.desc, p.cat, p.img, p.date, p.venue, p.cap, p.budget, p.impact, p.safety, p.notes, coordinatorId]);
  }

  // 4. Registrations & Attendance for Drone Swarm & Hackcon
  // Register Aarav for HackCon & Drone Swarm
  const regAarav1 = await db.query(`
    INSERT INTO registrations (event_id, user_id, ticket_code, status, qr_token)
    VALUES ($1, $2, 'TKT-HACK-001', 'registered', 'CC_TOKEN_HACK_AARAV_894')
    RETURNING id
  `, [hackconId, studentId]);

  const regAarav2 = await db.query(`
    INSERT INTO registrations (event_id, user_id, ticket_code, status, qr_token)
    VALUES ($1, $2, 'TKT-DRONE-001', 'registered', 'CC_TOKEN_DRONE_AARAV_894')
    RETURNING id
  `, [droneEventId, studentId]);

  // Register attendees from attendeesData for Drone Event
  for (let i = 0; i < attendeeIds.length; i++) {
    const attId = attendeeIds[i];
    const isCheckedIn = i % 2 === 0;
    const ticketCode = `TKT-DRONE-${100 + i}`;
    const qrToken = `CC_TOKEN_DRONE_${attId}_${ticketCode}`;

    const reg = await db.query(`
      INSERT INTO registrations (event_id, user_id, ticket_code, status, qr_token)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [droneEventId, attId, ticketCode, isCheckedIn ? 'attended' : 'registered', qrToken]);

    if (isCheckedIn) {
      await db.query(`
        INSERT INTO attendance (event_id, registration_id, user_id, verified_by, method)
        VALUES ($1, $2, $3, $4, 'qr_scan')
      `, [droneEventId, reg.rows[0].id, attId, coordinatorId]);
    }
  }

  // 5. Announcements
  await db.query(`
    INSERT INTO announcements (club_id, title, message, scope, priority, created_by)
    VALUES
    (NULL, 'Campus Health & Safety Protocols Update', 'All student attendees for indoor arena workshops must carry their digital student ID for verification.', 'college_wide', 'high', $1),
    ($2, 'Drone Swarm Hardware Check-in Starts at 9:30 AM', 'Please arrive at Robotics Lab 3 early to complete pre-flight firmware calibration on provided hardware.', 'event', 'normal', $3),
    ($4, 'HackCon 2025 Mentor & Sponsor Office Hours Announced', 'Leading engineers from Google and Microsoft will be conducting architecture office hours in Room 102.', 'club', 'normal', $3)
  `, [adminId, droneEventId, coordinatorId, clubIds[0]]);

  // 6. Notifications for Aarav
  await db.query(`
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES
    ($1, 'Registration Confirmed: Annual Spring HackCon 2025', 'Your pass TKT-HACK-001 has been generated. Check in with your digital QR token at Main Tech Tower.', 'registration', false),
    ($1, 'Workshop Notice: Drone Swarm Hardware Check-in', 'Pre-flight calibration begins at 9:30 AM in Robotics Lab 3.', 'event', false),
    ($1, 'Club Membership Approved: Robotics & AI Guild', 'Welcome to the Robotics Guild! Access club channels and project repositories now.', 'system', true)
  `, [studentId]);

  // 7. Audit Logs
  await db.query(`
    INSERT INTO audit_logs (user_id, action, details)
    VALUES
    ($1, 'EVENT_APPROVED', 'Administrator sanctioned event: Annual Spring HackCon 2025'),
    ($1, 'EVENT_APPROVED', 'Administrator sanctioned event: Autonomous Drone Swarm Workshop'),
    ($2, 'COORDINATOR_ASSIGNED', 'Priya Patel assigned as lead coordinator for Robotics & AI Guild'),
    ($3, 'REGISTRATION_CREATED', 'Student Aarav Sharma registered for HackCon 2025')
  `, [adminId, coordinatorId, studentId]);

  console.log('CampusConnect database successfully seeded!');
}

export default seedDatabase;
