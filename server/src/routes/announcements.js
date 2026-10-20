import express from 'express';
import db from '../db/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Mock bulletin data matching the State University Bulletin screen
const DEFAULT_BULLETINS = [
  {
    id: 101,
    title: 'Fall 2025 Mid-Term Grade Submission Window & Credit Add/Drop Final Deadline',
    message: 'Notice regarding the mandatory submission of mid-term deficit reports. All students with course attendance below 75% will receive automated academic advisory notifications through the CampusConnect portal before Friday midnight. The registrar\'s office will officially freeze elective drops on Oct 31, 23:59 EST.',
    reference_no: 'AS-2025-089',
    category: 'PINNED • ACADEMIC SENATE',
    posted_date_str: 'Oct 24, 2025 • 09:15 AM',
    issuer: 'Dean of Academic Affairs',
    signee: 'Dr. Eleanor Vance',
    target_audience: 'All Undergraduates & Faculty',
    reads_count: 11402,
    reads_percentage: 85,
    clarifications_count: 14,
    attachment_name: 'Registrar_Calendar_AddDrop_v4.pdf',
    attachment_size: '1.2 MB',
    portal_link: 'https://state-university.edu/registrar/calendar',
    priority: 'pinned',
    scope: 'college_wide',
    pinned: true,
    created_at: '2025-10-24T09:15:00Z'
  },
  {
    id: 102,
    title: 'Annual Tech & Engineering Career Fair 2025: Additional 40 Fortune 500 Recruiters Confirmed',
    message: 'Due to exceptionally high student registration (>1,500 candidates), Day 2 technical interviews are officially expanded into Innovation Lab Floor 3 and Seminar Hall B. Professional business attire is mandatory. Fast-track digital badge printing is active via your unique QR pass in the Student Hub application.',
    reference_no: 'OSA-FAIR-40',
    category: 'CAREER ADVANCEMENT • REVISED VENUE',
    posted_date_str: 'Oct 23, 2025 • 14:30 PM',
    issuer: 'Office of Student Affairs',
    signee: 'Placement & Corporate Relations Cell',
    target_audience: 'Sophomore, Junior & Senior Engineers',
    reads_count: 8910,
    reads_percentage: 72,
    rsvp_synced: true,
    attachment_name: 'Recruiter_Directory_FloorMap_2025.pdf',
    attachment_size: '3.6 MB',
    priority: 'high',
    scope: 'college_wide',
    pinned: false,
    created_at: '2025-10-23T14:30:00Z'
  },
  {
    id: 103,
    title: 'West Campus Dormitory Fiber-Optic Network Maintenance & Scheduled Downtime',
    message: 'Routine infrastructure upgrades to our 10 Gbps campus core backbone. Temporary wireless disruptions expected from 02:00 AM to 05:00 AM on Sunday, Oct 27. Hardwired CAT6 ethernet in computer labs remains completely unaffected.',
    reference_no: 'IT-OPS-901',
    category: 'CAMPUS LIFE & HOUSING',
    posted_date_str: 'Oct 22, 2025 • 11:00 AM',
    issuer: 'Division of Campus IT',
    signee: 'Network Infrastructure Ops',
    target_audience: 'Residence Halls (Elm, Oak, Cypress Towers)',
    reads_count: 3420,
    reads_percentage: 45,
    priority: 'normal',
    scope: 'college_wide',
    pinned: false,
    created_at: '2025-10-22T11:00:00Z'
  },
  {
    id: 104,
    title: 'Spring 2026 Club Budget Allocation Voting Opens on Campus Ballot',
    message: 'Review the proposed $120,000 co-curricular disbursement for technical hackathons, cultural festivals, and athletic tournaments. Council delegates vote on amendment proposals through Wednesday. Individual club coordinators can review allocations in the budget ledger.',
    reference_no: 'SUSC-FIN-44',
    category: 'STUDENT GOVERNMENT • FUNDING ALLOCATION',
    posted_date_str: 'Oct 21, 2025 • 16:45 PM',
    issuer: 'State University Student Council (SUSC)',
    signee: 'Executive Budget Committee',
    target_audience: 'Registered Student Orgs & Club Leads',
    reads_count: 4680,
    reads_percentage: 58,
    ballot_url: 'https://state-university.edu/ballot/spring2026',
    priority: 'normal',
    scope: 'club',
    pinned: false,
    created_at: '2025-10-21T16:45:00Z'
  }
];

// In-memory bulletins store initialized with default data
let bulletins = [...DEFAULT_BULLETINS];

// Urgent Banner State
let urgentAdvisory = {
  id: 'adv-001',
  type: 'URGENT ADVISORY',
  tag: 'Facility Ops & Logistics',
  postedAgo: 'Posted 45 mins ago',
  title: 'Weather Advisory & Evening Transit Delays: Heavy North Campus Snowfall',
  message: 'Heavy snowfall forecast for North Campus starting 18:00 EST. Evening inter-campus shuttle lines running on 30-min delays. Library stays open 24/7 with emergency heating centers and student shelter assistance.',
  radarUrl: 'https://transit.state-university.edu/radar',
  acknowledgedBy: [] // user IDs
};

// Subscribed Feeds state
let subscribedFeeds = [
  { id: 'provost', name: 'President & Provost', subtext: 'Mandatory University Decree', locked: true, enabled: true },
  { id: 'police', name: 'Campus Police & Safety', subtext: 'SMS + App Push Active', locked: false, enabled: true },
  { id: 'eng', name: 'College of Engineering', subtext: 'Academic Memos & Labs', locked: false, enabled: true },
  { id: 'wellness', name: 'Student Wellness Center', subtext: 'Mental Health & Clinic', locked: false, enabled: true },
  { id: 'sports', name: 'Intramural Sports & Gym', subtext: 'Facility Hours & Courts', locked: false, enabled: false }
];

// GET all bulletins with filters and metrics
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { filter, audience, term, sort, search } = req.query;

    // Fetch custom announcements from SQL database
    let dbBulletins = [];
    try {
      const dbRes = await db.query(`
        SELECT a.*, c.name as club_name, u.name as author_name, u.role as author_role
        FROM announcements a
        LEFT JOIN clubs c ON a.club_id = c.id
        LEFT JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
      `);
      dbBulletins = dbRes.rows.map(row => ({
        id: row.id,
        title: row.title,
        message: row.message,
        reference_no: `CC-2025-${row.id.toString().padStart(3, '0')}`,
        category: row.scope === 'college_wide' ? 'COLLEGE-WIDE NOTICE' : (row.club_name ? `${row.club_name.toUpperCase()} DISPATCH` : 'CAMPUS NOTICE'),
        posted_date_str: new Date(row.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        issuer: row.author_name || (row.club_name || 'Dean of Student Affairs'),
        signee: row.author_role === 'admin' ? 'College Administration' : 'Club Leadership Guild',
        target_audience: row.scope === 'college_wide' ? 'All Enrolled Students' : (row.club_name ? `${row.club_name} Members` : 'All Campus Students'),
        reads_count: 1420 + row.id * 180,
        reads_percentage: Math.min(95, 60 + row.id * 5),
        clarifications_count: 3 + row.id,
        priority: row.priority || 'normal',
        scope: row.scope || 'college_wide',
        pinned: row.priority === 'urgent' || row.priority === 'high',
        created_at: row.created_at
      }));
    } catch (e) {
      console.warn('Failed to query DB announcements, using memory list:', e.message);
    }

    // Merge in-memory bulletins and DB bulletins without duplicate IDs
    const seenIds = new Set();
    let list = [];
    for (const b of [...bulletins, ...dbBulletins]) {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        list.push(b);
      }
    }

    // Filter tab
    if (filter && filter !== 'undefined' && filter !== 'all') {
      if (filter === 'urgent') {
        list = list.filter(b => b.priority === 'urgent' || b.priority === 'pinned');
      } else if (filter === 'academic') {
        list = list.filter(b => b.category?.includes('ACADEMIC') || b.category?.includes('SENATE'));
      } else if (filter === 'student') {
        list = list.filter(b => b.category?.includes('STUDENT') || b.scope === 'club');
      }
    }

    // Search query
    if (search && search !== 'undefined' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.message?.toLowerCase().includes(q) ||
        b.reference_no?.toLowerCase().includes(q) ||
        b.issuer?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'reads') {
      list.sort((a, b) => (b.reads_count || 0) - (a.reads_count || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json({
      bulletins: list,
      urgentAdvisory: {
        ...urgentAdvisory,
        isAcknowledged: req.user ? urgentAdvisory.acknowledgedBy.includes(req.user.id) : false
      },
      stats: {
        activeNotices: bulletins.length,
        highPriorityCount: bulletins.filter(b => b.priority === 'pinned' || b.priority === 'urgent').length,
        campusReach: '94.2%',
        enrolledCount: '14,820 / 15,730',
        cohortGrade: 'Cohort A+',
        emergencyBlasts: 3,
        blastNote: '100% delivered carrier gateway',
        targetChannels: 8,
        channelsNote: 'Eng, Arts, Dorms, Commuters'
      },
      subscribedFeeds
    });
  } catch (err) {
    console.error('Announcements error:', err);
    return res.status(500).json({ error: 'Failed to fetch bulletins.' });
  }
});

// Acknowledge urgent advisory
router.post('/urgent/acknowledge', authenticate, (req, res) => {
  const userId = req.user.id;
  if (!urgentAdvisory.acknowledgedBy.includes(userId)) {
    urgentAdvisory.acknowledgedBy.push(userId);
  }
  return res.json({ success: true, message: 'Advisory acknowledged.' });
});

// Post a bulletin / dispatch
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      message,
      target_audience,
      priority = 'normal',
      category = 'DEPARTMENTAL NOTICE',
      attachment_name,
      attachment_size
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Headline and message content are required.' });
    }

    const refNo = `CC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBulletin = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      reference_no: refNo,
      category: category.toUpperCase(),
      posted_date_str: 'Just now',
      issuer: req.user.name || 'Coordinator Console',
      signee: req.user.role === 'admin' ? 'Dean of Student Affairs' : 'Club Leadership Guild',
      target_audience: target_audience || 'All Enrolled Students',
      reads_count: 1,
      reads_percentage: 1,
      clarifications_count: 0,
      attachment_name: attachment_name || null,
      attachment_size: attachment_size || null,
      priority,
      scope: 'college_wide',
      pinned: priority === 'urgent',
      created_at: new Date().toISOString()
    };

    bulletins.unshift(newBulletin);

    return res.status(201).json({
      success: true,
      message: 'Notice dispatched successfully across student channels!',
      bulletin: newBulletin
    });
  } catch (err) {
    console.error('Dispatch error:', err);
    return res.status(500).json({ error: 'Failed to post bulletin.' });
  }
});

// Mock clarifications store
const announcementClarifications = {
  101: [
    {
      id: 1,
      question: "Does the elective drop freeze apply to accelerated 8-week module courses?",
      answer: "No, accelerated 8-week courses follow Section 4B of the Academic Senate bylaws with independent mid-term drop deadlines. Please consult your course syllabus or academic advisor.",
      author: "Academic Affairs Helpdesk",
      timestamp: "Oct 24, 2025 • 10:30 AM"
    },
    {
      id: 2,
      question: "Will grade deficiency notices impact financial aid eligibility immediately?",
      answer: "Deficiency warnings are purely advisory notifications. Financial aid status reviews occur strictly at the conclusion of the semester after final grades are certified.",
      author: "Office of Financial Aid",
      timestamp: "Oct 24, 2025 • 11:15 AM"
    }
  ],
  102: [
    {
      id: 3,
      question: "Will hard-copy printed resumes be required, or can recruiters scan digital QR profiles?",
      answer: "Both methods are supported. Digital resume QR passes are available inside your CampusConnect profile, and fast-track printing booths are open in Innovation Lab Lobby.",
      author: "Career Development Cell",
      timestamp: "Oct 23, 2025 • 15:45 PM"
    },
    {
      id: 4,
      question: "Can first-year freshmen attend Day 2 technical interviews?",
      answer: "Freshmen are welcome to attend the career exploration exhibits, but interview booths on Floor 3 are reserved for sophomores, juniors, and seniors.",
      author: "Corporate Relations Lead",
      timestamp: "Oct 23, 2025 • 16:10 PM"
    }
  ],
  103: [
    {
      id: 5,
      question: "Will laundry machine card readers in the dorm basement work during the 2AM-5AM maintenance?",
      answer: "Yes, laundry payment terminals operate on local offline cache and will not be disrupted during the core fiber upgrade.",
      author: "Campus IT Network Ops",
      timestamp: "Oct 22, 2025 • 12:20 PM"
    }
  ],
  104: [
    {
      id: 6,
      question: "Can individual club members vote or only designated club presidents and treasurers?",
      answer: "All registered undergraduate and graduate students with active student IDs are eligible to vote on the general ballot amendments.",
      author: "Student Government Elections Commission",
      timestamp: "Oct 21, 2025 • 17:05 PM"
    }
  ]
};

// GET clarifications for an announcement
router.get('/:id/clarifications', (req, res) => {
  const { id } = req.params;
  const list = announcementClarifications[id] || [];
  return res.json({ clarifications: list });
});

// POST a new clarification inquiry for an announcement
router.post('/:id/clarifications', optionalAuthenticate, (req, res) => {
  const { id } = req.params;
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question content is required.' });
  }

  if (!announcementClarifications[id]) {
    announcementClarifications[id] = [];
  }

  const newClarification = {
    id: Date.now(),
    question: question.trim(),
    answer: "Your inquiry has been logged in the Registrar & Department Dispatch Desk. An authorized advisor will update this public notice with official remarks within 2 business hours.",
    author: req.user?.name || "Student Inquirer",
    timestamp: "Just now"
  };

  announcementClarifications[id].push(newClarification);

  // Update bulletin clarifications count if in memory
  const bulletin = bulletins.find(b => b.id == id);
  if (bulletin) {
    bulletin.clarifications_count = (bulletin.clarifications_count || 0) + 1;
  }

  return res.status(201).json({
    success: true,
    clarification: newClarification,
    clarifications: announcementClarifications[id]
  });
});

// Toggle subscribed feed
router.post('/feeds/:id/toggle', authenticate, (req, res) => {
  const { id } = req.params;
  const feed = subscribedFeeds.find(f => f.id === id);
  if (!feed) return res.status(404).json({ error: 'Feed not found.' });
  if (feed.locked) return res.status(400).json({ error: 'Mandatory university decrees cannot be unsubscribed.' });

  feed.enabled = !feed.enabled;
  return res.json({ success: true, feed });
});

export default router;
