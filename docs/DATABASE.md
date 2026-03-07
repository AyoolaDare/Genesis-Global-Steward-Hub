# DATABASE SPECIFICATION
## Church Management System (CMS) — PostgreSQL Schema

---

## 1. DATABASE PHILOSOPHY

- **PostgreSQL** as the primary database — relational integrity, advanced querying, full-text search
- **Single source of truth** — one `Person` table for all people types (members, workers, new members)
- **Soft deletes** everywhere — nothing is permanently deleted, only archived
- **Append-only** for medical and audit records — immutable history
- **UUID primary keys** — portable, no sequential guessing
- **Snake_case** naming for all tables and columns
- **Timestamps on everything**: `created_at`, `updated_at`, `deleted_at`

---

## 2. ENTITY RELATIONSHIP OVERVIEW

```
Person (core entity)
  ├── MedicalRecord (1:many)
  │     └── MedicalVisit (1:many)
  ├── FollowUpTask (1:many)
  ├── CellGroupMember (many:many → CellGroup)
  ├── DepartmentMember (many:many → Department)
  ├── WorkerProfile (1:1, workers only)
  │     ├── HRContract
  │     ├── HRPayroll
  │     └── HRLeave
  ├── Notification (1:many)
  └── AuditLog (1:many)

CellGroup
  └── CellGroupMember → Person

Department
  └── DepartmentMember → Person
  └── DepartmentAttendance → Person

SystemUser (login credentials, separate from Person profile)
  └── Person (1:1)
```

---

## 3. CORE TABLES

### 3.1 — `persons`

The **central table** for all human records in the system.

```sql
CREATE TABLE persons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  other_names       VARCHAR(100),
  phone             VARCHAR(20) UNIQUE NOT NULL,  -- Normalized, primary key for lookup
  email             VARCHAR(255) UNIQUE,
  date_of_birth     DATE,
  gender            VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  profile_photo_url TEXT,
  
  -- Status & Type
  status            VARCHAR(30) NOT NULL DEFAULT 'NEW_MEMBER'
                    CHECK (status IN ('NEW_MEMBER', 'PENDING_APPROVAL', 'MEMBER', 'WORKER', 'INACTIVE')),
  source            VARCHAR(30)           -- 'MEDICAL', 'FOLLOWUP', 'CELL', 'ADMIN'
                    CHECK (source IN ('MEDICAL', 'FOLLOWUP', 'CELL', 'ADMIN')),
  
  -- Contact
  address           TEXT,
  state             VARCHAR(100),
  country           VARCHAR(100) DEFAULT 'Nigeria',
  emergency_contact_name   VARCHAR(200),
  emergency_contact_phone  VARCHAR(20),
  
  -- Church Info
  joined_date       DATE,
  baptized          BOOLEAN DEFAULT FALSE,
  baptism_date      DATE,
  
  -- Profile Completeness
  is_profile_complete    BOOLEAN DEFAULT FALSE,
  merged_from_id         UUID REFERENCES persons(id),  -- If this was merged
  
  -- Soft delete & timestamps
  deleted_at        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_persons_phone ON persons(phone);
CREATE INDEX idx_persons_status ON persons(status);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_name ON persons USING gin(
  to_tsvector('english', first_name || ' ' || last_name)
);
```

---

### 3.2 — `system_users`

Login credentials — separate from `persons` to allow staff without a Person profile.

```sql
CREATE TABLE system_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID REFERENCES persons(id),    -- Nullable (system-only accounts)
  username        VARCHAR(100) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  
  -- Role & Access
  role            VARCHAR(30) NOT NULL
                  CHECK (role IN ('ADMIN', 'MEDICAL', 'FOLLOWUP', 'CELL_ADMIN', 'DEPT_LEADER', 'DEPT_ASST', 'HR')),
  module_access   TEXT[] DEFAULT '{}',           -- Array of module slugs
  is_active       BOOLEAN DEFAULT TRUE,
  
  -- Auth tokens
  refresh_token   TEXT,
  last_login      TIMESTAMP,
  
  -- Timestamps
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

### 3.3 — `medical_records`

One record per person — the master medical file.

```sql
CREATE TABLE medical_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID REFERENCES persons(id) ON DELETE RESTRICT,
  
  -- General Health
  blood_group     VARCHAR(5),     -- A+, O-, etc.
  genotype        VARCHAR(5),     -- AA, AS, SS, etc.
  allergies       TEXT[],
  chronic_conditions TEXT[],
  disabilities    TEXT[],
  current_medications TEXT[],
  
  -- Emergency
  preferred_hospital  VARCHAR(255),
  health_insurance_provider VARCHAR(255),
  health_insurance_number   VARCHAR(100),
  
  -- Metadata
  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_medical_records_person ON medical_records(person_id);
```

---

### 3.4 — `medical_visits`

Each hospital/medical team interaction — append-only.

```sql
CREATE TABLE medical_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID REFERENCES persons(id) ON DELETE RESTRICT,
  medical_record_id UUID REFERENCES medical_records(id),
  
  -- Visit Details
  visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type      VARCHAR(50),     -- 'ROUTINE', 'EMERGENCY', 'FOLLOWUP', 'SCREENING'
  complaint       TEXT,
  diagnosis       TEXT,
  treatment       TEXT,
  prescription    TEXT,
  next_visit_date DATE,
  
  -- Vitals
  blood_pressure  VARCHAR(20),
  weight_kg       DECIMAL(5,2),
  height_cm       DECIMAL(5,2),
  temperature_c   DECIMAL(4,1),
  pulse_rate      INTEGER,
  
  -- Attachments
  attachments     TEXT[],         -- Cloudinary URLs
  notes           TEXT,
  
  -- Staff
  attended_by     UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW()
  -- NO updated_at — visits are immutable; amendments are new records
);

CREATE INDEX idx_medical_visits_person ON medical_visits(person_id);
CREATE INDEX idx_medical_visits_date ON medical_visits(visit_date);
```

---

### 3.5 — `cell_groups`

```sql
CREATE TABLE cell_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  purpose         TEXT,
  
  -- Leadership
  admin_id        UUID REFERENCES system_users(id),    -- Cell Admin
  
  -- Status
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISBANDED')),
  disbanded_at    TIMESTAMP,
  disbanded_reason TEXT,
  
  -- Meeting Info
  meeting_schedule VARCHAR(255),
  meeting_location VARCHAR(255),
  
  -- Timestamps
  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

### 3.6 — `cell_group_members`

```sql
CREATE TABLE cell_group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_group_id   UUID REFERENCES cell_groups(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  role            VARCHAR(30) DEFAULT 'MEMBER'
                  CHECK (role IN ('MEMBER', 'LEADER', 'ASSISTANT')),
  joined_date     DATE DEFAULT CURRENT_DATE,
  left_date       DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  
  -- How they were added
  added_by        UUID REFERENCES system_users(id),
  added_via       VARCHAR(30),   -- 'PHONE_SEARCH', 'MANUAL', 'ADMIN'
  
  created_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (cell_group_id, person_id)   -- No duplicates in same group
);

CREATE INDEX idx_cgm_person ON cell_group_members(person_id);
CREATE INDEX idx_cgm_group ON cell_group_members(cell_group_id);
```

---

### 3.7 — `departments`

```sql
CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL UNIQUE,
  description     TEXT,
  category        VARCHAR(100),    -- 'MINISTRY', 'ADMIN', 'SUPPORT', 'MEDIA', etc.
  
  -- Leadership (Person IDs, must be WORKER or MEMBER)
  team_leader_id  UUID REFERENCES persons(id),
  asst_leader_id  UUID REFERENCES persons(id),
  
  -- Status
  is_active       BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

### 3.8 — `department_members`

```sql
CREATE TABLE department_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  role            VARCHAR(50) DEFAULT 'VOLUNTEER',
  joined_date     DATE DEFAULT CURRENT_DATE,
  left_date       DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  
  added_by        UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (department_id, person_id)
);
```

---

### 3.9 — `department_attendance`

```sql
CREATE TABLE department_attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id),
  
  -- Session Info
  session_name    VARCHAR(255),
  session_date    DATE NOT NULL,
  session_type    VARCHAR(50),   -- 'REGULAR', 'SPECIAL', 'TRAINING'
  notes           TEXT,
  
  -- Marked by
  marked_by       UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Attendance Records (per person per session)
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id   UUID REFERENCES department_attendance(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id),
  
  status          VARCHAR(20) NOT NULL
                  CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')),
  excuse_reason   TEXT,
  
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendance_dept ON department_attendance(department_id);
CREATE INDEX idx_attendance_date ON department_attendance(session_date);
CREATE INDEX idx_attendance_records_person ON attendance_records(person_id);
```

---

### 3.10 — `worker_profiles`

HR module — one per WORKER.

```sql
CREATE TABLE worker_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID REFERENCES persons(id) UNIQUE ON DELETE RESTRICT,
  
  -- Employment
  worker_id       VARCHAR(50) UNIQUE NOT NULL,   -- e.g. "CHU-2024-0042"
  job_title       VARCHAR(255),
  department_id   UUID REFERENCES departments(id),
  employment_type VARCHAR(30)
                  CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER_STAFF')),
  employment_status VARCHAR(30) DEFAULT 'ACTIVE'
                  CHECK (employment_status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')),
  
  -- Dates
  hire_date       DATE NOT NULL,
  probation_end   DATE,
  termination_date DATE,
  
  -- Compensation
  salary_amount   DECIMAL(12,2),
  salary_currency VARCHAR(5) DEFAULT 'NGN',
  pay_frequency   VARCHAR(20) DEFAULT 'MONTHLY',
  
  -- Bank Details
  bank_name       VARCHAR(100),
  account_number  VARCHAR(50),
  account_name    VARCHAR(255),
  
  -- Documents
  contract_url    TEXT,            -- Cloudinary URL
  id_document_url TEXT,
  
  -- Meta
  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

### 3.11 — `follow_up_tasks`

```sql
CREATE TABLE follow_up_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Task Details
  type            VARCHAR(50)   -- 'NEW_MEMBER_OUTREACH', 'INACTIVE_MEMBER', 'PRAYER', 'VISIT'
                  CHECK (type IN ('NEW_MEMBER_OUTREACH', 'INACTIVE_MEMBER', 'PRAYER', 'VISIT', 'CALL', 'OTHER')),
  priority        VARCHAR(20) DEFAULT 'NORMAL'
                  CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status          VARCHAR(30) DEFAULT 'UNASSIGNED'
                  CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED')),
  
  -- Notes
  description     TEXT,
  outcome         TEXT,         -- Filled when completed
  
  -- Assignment
  assigned_to     UUID REFERENCES system_users(id),
  assigned_at     TIMESTAMP,
  due_date        DATE,
  completed_at    TIMESTAMP,
  
  -- Source
  triggered_by    VARCHAR(30),  -- 'MEDICAL', 'CELL', 'ADMIN', 'AUTO'
  source_id       UUID,         -- ID of the triggering record
  
  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_followup_person ON follow_up_tasks(person_id);
CREATE INDEX idx_followup_status ON follow_up_tasks(status);
CREATE INDEX idx_followup_assigned ON follow_up_tasks(assigned_to);
```

---

### 3.12 — `notifications`

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient (can be a role or a specific user)
  recipient_user_id UUID REFERENCES system_users(id),
  recipient_role  VARCHAR(30),    -- if broadcast to a role
  
  -- Content
  title           VARCHAR(255) NOT NULL,
  message         TEXT,
  type            VARCHAR(50)    -- maps to TriggerEvent enum
                  CHECK (type IN (
                    'NEW_MEMBER_CREATED', 'PROFILE_PENDING_APPROVAL', 'MEMBER_APPROVED',
                    'MEMBER_MERGED', 'MEDICAL_RECORD_CREATED', 'CELL_GROUP_NEW_MEMBER',
                    'FOLLOWUP_ASSIGNED', 'FOLLOWUP_COMPLETED', 'WORKER_CREATED',
                    'CELL_GROUP_DISBANDED', 'GENERAL'
                  )),
  
  -- Linking
  entity_type     VARCHAR(50),   -- 'Person', 'CellGroup', etc.
  entity_id       UUID,
  action_url      TEXT,          -- Frontend deep link
  
  -- State
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMP,
  
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_user_id, is_read)
  WHERE is_read = FALSE;
```

---

### 3.13 — `audit_logs`

Immutable activity trail.

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id         UUID REFERENCES system_users(id),
  user_role       VARCHAR(30),
  
  -- Action
  action          VARCHAR(100) NOT NULL,  -- 'CREATE_MEMBER', 'APPROVE_PROFILE', etc.
  entity_type     VARCHAR(50),
  entity_id       UUID,
  
  -- State change
  before_state    JSONB,
  after_state     JSONB,
  
  -- Context
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  request_id      UUID,
  
  created_at      TIMESTAMP DEFAULT NOW()
  -- No updated_at — this table is APPEND ONLY
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## 4. VIEWS (Pre-computed Queries)

```sql
-- Full member profile view (joins medical + follow-up status)
CREATE VIEW v_member_profiles AS
SELECT
  p.id, p.first_name, p.last_name, p.phone, p.email,
  p.status, p.gender, p.profile_photo_url,
  p.joined_date, p.created_at,
  mr.blood_group, mr.genotype,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'IN_PROGRESS') AS open_followup_tasks,
  COUNT(DISTINCT mv.id) AS total_medical_visits
FROM persons p
LEFT JOIN medical_records mr ON mr.person_id = p.id
LEFT JOIN follow_up_tasks ft ON ft.person_id = p.id
LEFT JOIN medical_visits mv ON mv.person_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, mr.id;

-- Department member with attendance rate
CREATE VIEW v_dept_member_attendance AS
SELECT
  dm.department_id,
  dm.person_id,
  p.first_name || ' ' || p.last_name AS full_name,
  COUNT(ar.id) FILTER (WHERE ar.status = 'PRESENT') AS attended,
  COUNT(ar.id) AS total_sessions,
  ROUND(
    COUNT(ar.id) FILTER (WHERE ar.status = 'PRESENT')::DECIMAL /
    NULLIF(COUNT(ar.id), 0) * 100, 1
  ) AS attendance_rate
FROM department_members dm
JOIN persons p ON p.id = dm.person_id
LEFT JOIN attendance_records ar ON ar.person_id = dm.person_id
WHERE dm.is_active = TRUE
GROUP BY dm.department_id, dm.person_id, p.first_name, p.last_name;
```

---

## 5. MIGRATION STRATEGY

- Use **Prisma Migrate** for all schema changes
- Never modify existing migrations — always create new ones
- Migration naming: `YYYYMMDD_description` (e.g., `20240315_add_medical_vitals`)
- All migrations tested on staging before production
- Seed file for initial data: roles, default departments, admin user

---

## 6. BACKUP STRATEGY

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full dump | Daily | 30 days | Render managed + S3 |
| WAL streaming | Continuous | 7 days | Render managed |
| Pre-migration snapshot | Before each deploy | 90 days | Manual S3 |

---

## 7. PERFORMANCE NOTES

- All foreign keys have indexes
- Phone number lookup: exact match on indexed column — O(log n)
- Full-text search: GIN index on `persons` name fields
- Medical visits: partition by year in Phase 2 if volume grows
- Pagination: cursor-based for large tables (not offset-based)
- Soft deletes: all queries include `WHERE deleted_at IS NULL` — partial index on this
