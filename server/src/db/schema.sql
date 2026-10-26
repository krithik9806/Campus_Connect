-- CampusConnect PostgreSQL Relational Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'coordinator', 'admin')),
    department VARCHAR(150) DEFAULT 'Computer Science',
    student_id VARCHAR(50) DEFAULT 'CC-2025-001',
    avatar_url TEXT,
    engagement_score INTEGER DEFAULT 78,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image TEXT,
    logo_url TEXT,
    coordinator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    member_count INTEGER DEFAULT 0,
    points INTEGER DEFAULT 500,
    faculty_advisor VARCHAR(200) DEFAULT 'Dr. Sundar Rao (Dept. Head)',
    compliance_status VARCHAR(50) DEFAULT 'Good Standing',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_members (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'declined')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    date_str VARCHAR(100) NOT NULL,
    start_time VARCHAR(50) DEFAULT '09:00 AM',
    end_time VARCHAR(50) DEFAULT '05:00 PM',
    venue VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    checked_in_count INTEGER DEFAULT 0,
    price_type VARCHAR(20) DEFAULT 'free' CHECK (price_type IN ('free', 'paid')),
    ticket_price NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'completed')),
    budget_requested NUMERIC(10, 2) DEFAULT 0.00,
    impact_score VARCHAR(50) DEFAULT 'High',
    safety_clearance VARCHAR(50) DEFAULT 'Approved',
    coordinator_notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    qr_token TEXT NOT NULL,
    academic_year VARCHAR(50) DEFAULT '3rd Year',
    phone_number VARCHAR(50) DEFAULT '+1 (555) 234-5678',
    emergency_contact VARCHAR(100),
    participation_type VARCHAR(50) DEFAULT 'individual',
    team_name VARCHAR(150),
    team_members TEXT,
    dietary_pref VARCHAR(50) DEFAULT 'Vegetarian',
    tshirt_size VARCHAR(20) DEFAULT 'M',
    portfolio_url TEXT,
    special_accommodations TEXT,
    code_of_conduct_agreed BOOLEAN DEFAULT TRUE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_id VARCHAR(100),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(50) DEFAULT 'qr_scan' CHECK (method IN ('qr_scan', 'manual')),
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scope VARCHAR(50) DEFAULT 'college_wide' CHECK (scope IN ('college_wide', 'club', 'event')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_approvals (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'changes_requested')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100) DEFAULT '127.0.0.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
