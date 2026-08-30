-- DRISHTI: DoSJE Smart Monitoring & Inspection App
-- Core database schema (MySQL / PostgreSQL compatible with minor tweaks)

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('inspector', 'pmu_admin', 'department_official', 'ngo_incharge') NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type ENUM('ngo', 'institute', 'project') NOT NULL,
    scheme_name VARCHAR(200),
    district VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    incharge_user_id INT,
    cctv_stream_url VARCHAR(500),        -- RTSP/HLS url, simulated for demo
    last_inspected_at TIMESTAMP NULL,
    risk_score DECIMAL(5, 2) DEFAULT 0,  -- 0-100, higher = more suspicious
    status ENUM('active', 'flagged', 'under_review') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incharge_user_id) REFERENCES users(id)
);

CREATE TABLE inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    inspector_id INT NOT NULL,
    assignment_type ENUM('random', 'manual', 'triggered_by_flag') DEFAULT 'random',
    status ENUM('assigned', 'in_progress', 'submitted', 'reviewed') DEFAULT 'assigned',
    checklist_data JSON,                  -- form answers
    inspector_latitude DECIMAL(10, 8),
    inspector_longitude DECIMAL(11, 8),
    gps_verified BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (institute_id) REFERENCES institutes(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id)
);

CREATE TABLE evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    file_type ENUM('photo', 'video') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    file_hash VARCHAR(128),               -- SHA-256, for tamper-proofing
    FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

CREATE TABLE vc_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    initiated_by INT NOT NULL,            -- department official / system
    target_role ENUM('incharge', 'staff', 'beneficiary') NOT NULL,
    call_status ENUM('scheduled', 'ongoing', 'completed', 'missed') DEFAULT 'scheduled',
    call_started_at TIMESTAMP NULL,
    call_ended_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (institute_id) REFERENCES institutes(id),
    FOREIGN KEY (initiated_by) REFERENCES users(id)
);

CREATE TABLE risk_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    flag_type ENUM('attendance_mismatch', 'report_similarity', 'cctv_anomaly', 'missed_vc') NOT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'low',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (institute_id) REFERENCES institutes(id)
);

-- Helpful indexes for dashboard queries
CREATE INDEX idx_institute_risk ON institutes(risk_score);
CREATE INDEX idx_inspection_status ON inspections(status);
CREATE INDEX idx_flags_institute ON risk_flags(institute_id, resolved);
