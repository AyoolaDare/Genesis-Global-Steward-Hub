# DEPARTMENT SPECIFICATION
## GG Steward — Full Department Structure, Logic & Access

---

## 1. WHAT A DEPARTMENT IS

A **Department** in GG Steward is a permanent ministry unit within the church. Unlike Cell Groups (which are temporary and purpose-driven), Departments are standing operational teams that serve the church continuously — Choir, Ushers, Media, Protocol, Children's Ministry, Drama, Dance, and so on.

Every department has a defined **leadership structure**, its own **member roster**, tracks **attendance by session type**, manages **internal communications** through a governed **messaging system**, and has access to a **data dashboard** that answers real operational questions about its people.

Departments are created and owned by **Admin**. They are managed day-to-day by **Executives** — members of the church who have been granted elevated access to the Department Hub by Admin.

---

## 2. DEPARTMENT LEADERSHIP STRUCTURE

Every department has exactly **four executive roles**. These are not system-wide roles — they are department-scoped. A person can hold an executive role in one department and be a regular member in another.

| Role Code | Title | Responsibility |
|-----------|-------|---------------|
| `HOD` | Head of Department | Overall department leadership, final internal authority |
| `ASST_HOD` | Assistant Head of Department | Deputizes for HOD, co-manages operations |
| `WELFARE` | Welfare Officer | Member care, pastoral support, absence follow-up |
| `PRO` | Public Relations Officer | Communications, announcements, messaging drafts |

### Role Hierarchy (for approvals and authority)

```
ADMIN  (system-wide, ultimate authority)
  │
  └──► HOD  (department head, Level 1 approver)
         │
         └──► ASST_HOD  (deputy, Level 1 approver when HOD unavailable)
                │
                ├──► WELFARE  (member care, draft messages only)
                └──► PRO      (communications, draft messages only)
```

### What Each Role Can Do

| Action | HOD | ASST_HOD | WELFARE | PRO |
|--------|:---:|:--------:|:-------:|:---:|
| View department dashboard | ✅ | ✅ | ✅ | ✅ |
| View full member roster | ✅ | ✅ | ✅ | ✅ |
| Add member to department | ✅ | ✅ | ✅ | ✅ |
| Remove member from department | ✅ | ✅ | ❌ | ❌ |
| Mark attendance | ✅ | ✅ | ✅ | ❌ |
| Create attendance session | ✅ | ✅ | ✅ | ❌ |
| Draft a message | ✅ | ✅ | ✅ | ✅ |
| Approve message (Level 1) | ✅ | ✅ | ❌ | ❌ |
| Send message without approval | ❌ | ❌ | ❌ | ❌ |
| View message approval status | ✅ | ✅ | ✅ | ✅ |
| View attendance leaderboards | ✅ | ✅ | ✅ | ✅ |
| View absence alerts | ✅ | ✅ | ✅ | ❌ |
| Search all church members | ✅ | ✅ | ✅ | ✅ |
| Create new church member | ❌ | ❌ | ❌ | ❌ |
| Grant executive access | ❌ | ❌ | ❌ | ❌ |
| Disband department | ❌ | ❌ | ❌ | ❌ |

---

## 3. GRANTING EXECUTIVE ACCESS (Admin Only)

Executives are **church members** who have been elevated by Admin. No one can grant themselves executive access. No executive can grant another person executive access.

### Grant Flow

```
Admin opens a Member's profile
         │
         ▼
Clicks "Grant Executive Access"
         │
         ▼
Admin selects:
  - Which Department
  - Which Role: HOD / ASST_HOD / WELFARE / PRO
         │
         ▼
System checks:
  - Is the member already an executive in this department? → Block (show error)
  - Does this department already have someone in this role? → Warn Admin, confirm override
         │
         ▼
System creates or activates SystemUser login for the member
  - If member has no login → new credentials generated
  - If member already has login → role updated, department linked
         │
         ▼
Member receives login credentials via:
  - In-app notification (if they have a session)
  - Email with temporary password + login link
         │
         ▼
Member logs into GG Steward Hub
→ Sees ONLY their Department Executive view
→ Cannot see Admin, Medical, HR, Follow-Up, or other departments
```

### Revoking Executive Access

```
Admin opens the Department → Executives tab
         │
         ▼
Clicks "Revoke Access" on the executive
         │
         ▼
System:
  - Removes department role from SystemUser
  - If user has no other roles → account deactivated
  - Person record remains intact (they are still a church member)
  - Audit log entry created
         │
         ▼
Executive loses login access immediately
(their active session is invalidated)
```

### One Person, Multiple Departments

A member can be an executive in more than one department (e.g., HOD of Media and WELFARE of Ushers). When they log in, they see a **department switcher** — a dropdown that lets them switch between their departments without logging out.

---

## 4. DEPARTMENT DASHBOARD

The Executive Dashboard is the first screen after login. It is **data-first** — every section answers a specific operational question.

### 4.1 — Dashboard Header

```
┌──────────────────────────────────────────────────────────────────┐
│  [Church Logo]  GG Steward                  [Dept Switcher ▼]   │
│  Welcome back, Ada Okafor         HOD — Media Department        │
│                                   [Notifications 🔔3] [Avatar]  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 — KPI Cards Row

Four stat cards across the top:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Total Members   │ │  Last Session    │ │  Absent This     │ │  New This Month  │
│      142         │ │  Present: 98     │ │  Month: 12       │ │       6          │
│  ▲ 3 this month  │ │  69% attendance  │ │  ⚠ 3 critical    │ │  ✅ added        │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

| Card | Data Shown | Accent Color |
|------|-----------|-------------|
| Total Members | Count of active dept members + MoM change | Cyan |
| Last Session | Present count + attendance % for most recent session | Green |
| Absent This Month | Total absences + count of members with 3+ consecutive absences flagged | Orange |
| New This Month | Members added to department this calendar month | Blue |

### 4.3 — Attendance Trend Chart

**Chart type:** Line chart
**X-axis:** Last 8 sessions (labeled by date + session name)
**Y-axis:** Number of members present
**Lines:**
- `Regular Sessions` — solid blue line
- `Training Sessions` — dashed green line
- `Special Sessions` — dotted orange line

**Answers:** *Are people showing up consistently? Is training attendance different from regular attendance?*

### 4.4 — Attendance Rate Donut

**Chart type:** Donut / Pie
**Segments:**
- Present (green)
- Absent (red)
- Excused (orange)
- Late (yellow)

**Center text:** Overall attendance rate as a percentage (e.g., `74%`)
**Time range selector:** Last session / Last month / Last 3 months / All time

**Answers:** *What percentage of the department is consistently engaged?*

### 4.5 — Member Growth Bar Chart

**Chart type:** Vertical bar chart
**X-axis:** Last 6 months
**Y-axis:** Members added per month
**Color:** Department accent color with lighter shade for current month (in progress)

**Answers:** *Is the department growing? Which months had the most additions?*

### 4.6 — Gender Breakdown Pie

**Chart type:** Pie chart (2 or 3 segments)
**Segments:** Male / Female / (Unspecified if any)
**Labels:** Count + percentage per segment

**Answers:** *What is the gender balance of this department?*

### 4.7 — Session Type Breakdown Donut

**Chart type:** Donut
**Segments:** Regular / Training / Special / Rehearsal
**Center text:** Total sessions held

**Answers:** *How much of our activity is training vs regular meetings?*

### 4.8 — Top Attendance Leaderboard

**Title:** ⭐ Top Attendees
**Scope:** Regular sessions only (REGULAR + SPECIAL session types)
**Time filter:** Last 3 months (default) — switchable

```
┌──────┬───────────────────┬─────────────┬──────────┬──────────────┐
│ Rank │ Name              │ Sessions    │ Rate     │ Streak       │
├──────┼───────────────────┼─────────────┼──────────┼──────────────┤
│  🥇  │ Ada Okafor        │  18 / 18    │  100%    │  🔥 18       │
│  🥈  │ Tunde Bello       │  17 / 18    │   94%    │  🔥 12       │
│  🥉  │ Grace Mensah      │  16 / 18    │   89%    │     8        │
│   4  │ Emeka Nwosu       │  15 / 18    │   83%    │     5        │
│   5  │ Lara Adeyemi      │  14 / 18    │   78%    │     3        │
└──────┴───────────────────┴─────────────┴──────────┴──────────────┘
```

**Streak** = consecutive sessions attended without a miss
**Answers:** *Who are the most committed and consistent members?*

### 4.9 — Top Training Leaderboard

**Title:** 📚 Most Consistent Trainees
**Scope:** TRAINING session type only
**Time filter:** Last 3 months (default) — switchable

```
┌──────┬───────────────────┬─────────────┬──────────┬──────────────┐
│ Rank │ Name              │ Trainings   │ Rate     │ Last Attended│
├──────┼───────────────────┼─────────────┼──────────┼──────────────┤
│  🥇  │ Emeka Nwosu       │   8 / 8     │  100%    │  Today       │
│  🥈  │ Lara Adeyemi      │   7 / 8     │   88%    │  3 days ago  │
│  🥉  │ Kemi Fashola      │   6 / 8     │   75%    │  1 week ago  │
│   4  │ Seun Adesanya     │   5 / 8     │   63%    │  2 weeks ago │
│   5  │ Bola Okonkwo      │   4 / 8     │   50%    │  1 month ago │
└──────┴───────────────────┴─────────────┴──────────┴──────────────┘
```

**Answers:** *Who is investing in their skills and ministry development?*

### 4.10 — Absence Alert Panel

**Title:** ⚠️ Needs Attention
**Logic:** Any member who has missed 3 or more consecutive sessions of ANY type

```
┌───────────────────┬─────────────────┬───────────┬────────────────────┐
│ Name              │ Last Seen       │ Missed    │ Action             │
├───────────────────┼─────────────────┼───────────┼────────────────────┤
│ John Afolabi      │ 3 weeks ago     │ 4 in a row│ [Draft Message]    │
│ Chioma Eze        │ 5 weeks ago     │ 6 in a row│ [Draft Message]    │
│ Remi Olawale      │ 2 weeks ago     │ 3 in a row│ [Draft Message]    │
└───────────────────┴─────────────────┴───────────┴────────────────────┘
```

**"Draft Message" shortcut:** Opens the messaging module pre-filled with this member as the context, creating a welfare check message draft — still goes through the full approval flow before sending.

### 4.11 — Pending Messages Panel

**Title:** 💬 Messages Awaiting Approval
Shows messages the department has submitted that are still in the approval pipeline:

```
┌─────────────────────────────┬────────────┬─────────────────┬────────┐
│ Message Title               │ Sent By    │ Stage           │ Date   │
├─────────────────────────────┼────────────┼─────────────────┼────────┤
│ Sunday Rehearsal Reminder   │ PRO        │ Pending HOD     │ Today  │
│ Monthly Welfare Check       │ WELFARE    │ Pending Admin   │ 2d ago │
└─────────────────────────────┴────────────┴─────────────────┴────────┘
```

---

## 5. ATTENDANCE SYSTEM

### 5.1 — Session Types

Every attendance session must be tagged with a type. This is what powers the two separate leaderboards.

| Type Code | Label | Description |
|-----------|-------|-------------|
| `REGULAR` | Regular Meeting | Standard department gathering |
| `TRAINING` | Training Session | Skill development, ministry training |
| `SPECIAL` | Special Event | Church programme, outreach, concert |
| `REHEARSAL` | Rehearsal | For performance departments (choir, drama, dance) |

### 5.2 — Creating an Attendance Session

```
Executive clicks "Mark Attendance"
         │
         ▼
Step 1 — Session Details Form:
  - Session Name (e.g., "Sunday Rehearsal", "Q3 Media Training")
  - Date (default: today)
  - Session Type: REGULAR / TRAINING / SPECIAL / REHEARSAL
  - Optional Notes
         │
         ▼
Step 2 — Attendance Sheet:
  All active department members listed alphabetically
  Each member has a toggle:
  [PRESENT] [ABSENT] [EXCUSED] [LATE]
  Default: ABSENT (must actively mark present)
         │
         ▼
Step 3 — Excuse Reason (if EXCUSED):
  Small text field appears inline for that member
         │
         ▼
Step 4 — Review & Save:
  Summary shown: X present, Y absent, Z excused
  [Save Attendance] button → bulk creates all attendance records
```

### 5.3 — Attendance Record per Member

Each member accumulates a full attendance history across all sessions:

```
Member: Tunde Bello
Department: Media

Session History:
┌─────────────────┬───────────┬───────────┬───────────┐
│ Date            │ Session   │ Type      │ Status    │
├─────────────────┼───────────┼───────────┼───────────┤
│ 12 Mar 2026     │ Practice  │ REGULAR   │ PRESENT   │
│ 05 Mar 2026     │ Q1 Train  │ TRAINING  │ PRESENT   │
│ 26 Feb 2026     │ Practice  │ REGULAR   │ ABSENT    │
│ 19 Feb 2026     │ Drama Ngt │ SPECIAL   │ EXCUSED   │
└─────────────────┴───────────┴───────────┴───────────┘

Attendance Rate (Regular):  17/18 = 94%
Attendance Rate (Training):  7/8  = 88%
Current Streak: 12 regular sessions
```

### 5.4 — Absence Escalation Rules

| Consecutive Absences | System Action |
|---------------------|---------------|
| 3 in a row | Flag on dashboard Absence Alert panel |
| 5 in a row | Welfare Officer receives in-app notification |
| 8 in a row | HOD receives in-app notification + welfare check task created |
| 12 in a row | Admin notified — member may be marked INACTIVE in department |

---

## 6. MEMBER MANAGEMENT

### 6.1 — Adding a Member to the Department

Executives can add any church-level member (status: MEMBER or WORKER) to their department.

```
Executive clicks "Add Member"
         │
         ▼
Search panel opens:
  - Total church member count shown at top (read-only)
    e.g., "3,842 members in the church database"
  - Search input: type name or phone number
  - Results appear in real time (debounced 300ms)
         │
         ▼
Result card shows:
  - Profile photo / initials avatar
  - Full name
  - Phone number
  - Church status badge (MEMBER / WORKER)
  - Current department(s) if any
         │
         ▼
Executive selects the person:
  - Assigns department role: MEMBER or VOLUNTEER
  - Optional: add a note (e.g., "Joining as keyboard player")
  - Clicks [Add to Department]
         │
         ▼
Person added to department roster immediately
Notification sent to Admin (informational, no approval needed for adding)
```

### 6.2 — What If the Person Is Not Found?

```
Search returns no results
         │
         ▼
System shows:
  "No member found with this name/number.
   You cannot create new church members from here.
   Please contact Admin or Follow-Up team to register this person first."

[Flag to Admin] button → creates a note to Admin
  "Department executive [Name] searched for [query] — person not found.
   Possible new member to register."
```

Executives **cannot create** new church members. This is a hard rule — only Admin, Medical, and Follow-Up can initiate new member creation.

### 6.3 — Removing a Member

Only HOD and ASST_HOD can remove a member from the department.

```
HOD clicks the member → opens member detail panel
         │
         ▼
Clicks "Remove from Department"
         │
         ▼
Confirmation modal:
  - Member name
  - Reason field (required)
  - [Confirm Remove] button
         │
         ▼
Member removed from active roster (soft remove — record preserved)
Attendance history retained
Admin notified of the removal
```

**Removing from department does NOT affect:**
- Their church member status
- Their medical records
- Their cell group memberships
- Any other department memberships

### 6.4 — Member Detail View (within Department)

Clicking any member in the roster opens a side panel:

```
┌─────────────────────────────────────────────┐
│  [Photo]  Tunde Bello                       │
│           Member — Media Dept               │
│           Phone: 0812 345 6789              │
│           Joined dept: Jan 2025             │
├─────────────────────────────────────────────┤
│  ATTENDANCE SUMMARY                         │
│  Regular:  94% (17/18 sessions)             │
│  Training: 88% (7/8 sessions)               │
│  Current streak: 12 sessions 🔥             │
├─────────────────────────────────────────────┤
│  RECENT SESSIONS (last 5)                   │
│  12 Mar — Regular    PRESENT                │
│  05 Mar — Training   PRESENT                │
│  26 Feb — Regular    ABSENT                 │
│  19 Feb — Special    EXCUSED                │
│  12 Feb — Regular    PRESENT                │
├─────────────────────────────────────────────┤
│  [Draft Welfare Message]  [Remove Member]   │
└─────────────────────────────────────────────┘
```

---

## 7. MESSAGING SYSTEM

### 7.1 — Overview

All department communications go through a **two-level approval system**. No message reaches department members without passing through both levels. This ensures quality, appropriateness, and Admin oversight of all church communications.

```
LEVEL 1 — Internal Department Approval (HOD or ASST_HOD)
LEVEL 2 — Admin Final Approval (Main Admin)
```

### 7.2 — Message Types

| Type | Description | Priority |
|------|-------------|----------|
| `ANNOUNCEMENT` | General department notice | Normal |
| `REMINDER` | Meeting, rehearsal, or event reminder | Normal |
| `WELFARE_CHECK` | Welfare officer reaching out to a member | Normal |
| `PRAYER_REQUEST` | Prayer point circulated within department | Normal |
| `URGENT` | Time-sensitive, flagged high priority | High |

### 7.3 — Message Recipients

| Option | Description |
|--------|-------------|
| All Department Members | Entire active roster |
| Specific Members | Select individuals from the roster |
| By Role | All HODs, all Welfare officers, etc. |
| Absentees Only | Members who missed the last session |

### 7.4 — Full Message Approval Flow

```
Anyone (HOD / ASST_HOD / WELFARE / PRO) drafts a message
         │
         ▼
Fills in:
  - Message type
  - Subject / Title
  - Body text
  - Recipients (all / specific / by filter)
  - Priority (Normal / Urgent)
         │
         ▼
Clicks [Submit for Approval]
Message status: DRAFT → PENDING_LEVEL1
         │
─────────────── LEVEL 1 ───────────────
         │
         ▼
HOD (or ASST_HOD) sees message in their approval queue
They can:
  [Approve → Level 2]  or  [Reject with Reason]
         │
         ├──── REJECTED ────►  Message status: REJECTED_L1
         │                     Sender notified with reason
         │                     Sender can edit and resubmit
         │
         ▼ APPROVED
Message status: PENDING_LEVEL1 → PENDING_ADMIN
         │
─────────────── LEVEL 2 ───────────────
         │
         ▼
Admin sees message in their approval queue
Full trail visible:
  - Who wrote it
  - Who approved at Level 1
  - Full message content
  - Recipients
Admin can:
  [Approve → Send]  or  [Reject with Reason]
         │
         ├──── REJECTED ────►  Message status: REJECTED_ADMIN
         │                     HOD who approved notified
         │                     Original sender notified
         │                     Reason visible to both
         │
         ▼ APPROVED
Message status: APPROVED → SENT
Message delivered to all selected recipients
Delivery timestamp recorded
```

### 7.5 — Special Rules

**HOD sending their own message:**
```
HOD drafts and submits a message
         │
         ▼
Cannot approve their own message at Level 1
System auto-escalates to ASST_HOD for Level 1 approval
If no ASST_HOD assigned → goes directly to Admin for single-level approval
```

**ASST_HOD approving HOD's message:**
```
If HOD submitted the message → ASST_HOD can approve at Level 1
If ASST_HOD submitted the message → HOD approves at Level 1
They cannot cross-approve their own submissions
```

**Urgent messages:**
```
URGENT messages skip the Level 1 queue and go directly to Admin
Admin sees URGENT badge — expected to review within 1 hour
Sender and HOD are notified when Admin acts
```

### 7.6 — Message Status Reference

| Status | Meaning | Who Can See |
|--------|---------|-------------|
| `DRAFT` | Saved but not submitted | Sender only |
| `PENDING_LEVEL1` | Waiting for HOD/ASST_HOD review | Sender + HOD + ASST_HOD |
| `PENDING_ADMIN` | Passed Level 1, waiting for Admin | Sender + HOD + Admin |
| `APPROVED` | Admin approved, being sent | All executives |
| `SENT` | Delivered to recipients | All executives |
| `REJECTED_L1` | Rejected at Level 1 | Sender + HOD |
| `REJECTED_ADMIN` | Rejected by Admin | Sender + HOD + Admin |

### 7.7 — Message History

Executives can view all past messages sent to their department:

```
┌────────────────────────────────────────────────────────────────┐
│  Message History — Media Department                           │
├──────────────────────────┬──────────┬────────────┬────────────┤
│ Subject                  │ Type     │ Sent By    │ Date Sent  │
├──────────────────────────┼──────────┼────────────┼────────────┤
│ Sunday Rehearsal Notice  │ REMINDER │ PRO        │ 10 Mar 26  │
│ Q1 Training Schedule     │ ANNOUNCE │ HOD        │ 02 Mar 26  │
│ Prayer for Bro. Emeka    │ PRAYER   │ WELFARE    │ 28 Feb 26  │
└──────────────────────────┴──────────┴────────────┴────────────┘
```

Clicking a message shows the full content, approval trail, and delivery stats.

---

## 8. DATABASE TABLES

### 8.1 — `departments`

```sql
CREATE TABLE departments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL UNIQUE,
  description       TEXT,
  category          VARCHAR(100),   -- 'MINISTRY', 'ADMIN', 'SUPPORT', 'MEDIA', etc.
  is_active         BOOLEAN DEFAULT TRUE,
  created_by        UUID REFERENCES system_users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### 8.2 — `department_executives`

Replaces the old single leader/assistant model. Now supports all 4 roles.

```sql
CREATE TABLE department_executives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id) ON DELETE CASCADE,
  system_user_id  UUID REFERENCES system_users(id),

  role            VARCHAR(20) NOT NULL
                  CHECK (role IN ('HOD', 'ASST_HOD', 'WELFARE', 'PRO')),

  granted_by      UUID REFERENCES system_users(id),   -- Must be ADMIN
  granted_at      TIMESTAMP DEFAULT NOW(),
  revoked_at      TIMESTAMP,
  is_active       BOOLEAN DEFAULT TRUE,

  UNIQUE (department_id, role)      -- One person per role per department
  -- Note: same person can hold roles in different departments
);

CREATE INDEX idx_dept_exec_dept    ON department_executives(department_id);
CREATE INDEX idx_dept_exec_person  ON department_executives(person_id);
CREATE INDEX idx_dept_exec_sysuser ON department_executives(system_user_id);
```

### 8.3 — `department_members`

```sql
CREATE TABLE department_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id) ON DELETE CASCADE,

  member_role     VARCHAR(30) DEFAULT 'MEMBER'
                  CHECK (member_role IN ('MEMBER', 'VOLUNTEER')),
  joined_date     DATE DEFAULT CURRENT_DATE,
  left_date       DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  removal_reason  TEXT,
  notes           TEXT,

  added_by        UUID REFERENCES system_users(id),
  removed_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE (department_id, person_id)
);

CREATE INDEX idx_dept_members_dept   ON department_members(department_id);
CREATE INDEX idx_dept_members_person ON department_members(person_id);
```

### 8.4 — `department_sessions`

```sql
CREATE TABLE department_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,

  session_name    VARCHAR(255) NOT NULL,
  session_date    DATE NOT NULL,
  session_type    VARCHAR(20) NOT NULL
                  CHECK (session_type IN ('REGULAR', 'TRAINING', 'SPECIAL', 'REHEARSAL')),
  notes           TEXT,

  created_by      UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_dept ON department_sessions(department_id);
CREATE INDEX idx_sessions_date ON department_sessions(session_date);
CREATE INDEX idx_sessions_type ON department_sessions(session_type);
```

### 8.5 — `attendance_records`

```sql
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES department_sessions(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id),
  person_id       UUID REFERENCES persons(id),

  status          VARCHAR(10) NOT NULL
                  CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')),
  excuse_reason   TEXT,

  marked_by       UUID REFERENCES system_users(id),
  created_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE (session_id, person_id)
);

CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_person  ON attendance_records(person_id);
CREATE INDEX idx_attendance_dept    ON attendance_records(department_id);
CREATE INDEX idx_attendance_status  ON attendance_records(status);
```

### 8.6 — `department_messages`

```sql
CREATE TABLE department_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id       UUID REFERENCES departments(id) ON DELETE CASCADE,

  -- Content
  subject             VARCHAR(255) NOT NULL,
  body                TEXT NOT NULL,
  message_type        VARCHAR(20) NOT NULL
                      CHECK (message_type IN ('ANNOUNCEMENT', 'REMINDER', 'WELFARE_CHECK', 'PRAYER_REQUEST', 'URGENT')),
  priority            VARCHAR(10) DEFAULT 'NORMAL'
                      CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),

  -- Recipients
  recipient_scope     VARCHAR(20) DEFAULT 'ALL'
                      CHECK (recipient_scope IN ('ALL', 'SPECIFIC', 'ABSENTEES')),

  -- Approval pipeline
  approval_stage      VARCHAR(20) DEFAULT 'DRAFT'
                      CHECK (approval_stage IN (
                        'DRAFT',
                        'PENDING_LEVEL1',
                        'PENDING_ADMIN',
                        'APPROVED',
                        'SENT',
                        'REJECTED_L1',
                        'REJECTED_ADMIN'
                      )),

  -- Level 1 (HOD / ASST_HOD)
  level1_reviewed_by  UUID REFERENCES system_users(id),
  level1_reviewed_at  TIMESTAMP,
  level1_rejection_reason TEXT,

  -- Level 2 (Admin)
  admin_reviewed_by   UUID REFERENCES system_users(id),
  admin_reviewed_at   TIMESTAMP,
  admin_rejection_reason TEXT,

  -- Send info
  sent_at             TIMESTAMP,
  sent_by             UUID REFERENCES system_users(id),  -- Admin who triggered final send

  -- Authorship
  created_by          UUID REFERENCES system_users(id),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_dept  ON department_messages(department_id);
CREATE INDEX idx_messages_stage ON department_messages(approval_stage);
CREATE INDEX idx_messages_type  ON department_messages(message_type);
```

### 8.7 — `message_recipients`

```sql
CREATE TABLE message_recipients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID REFERENCES department_messages(id) ON DELETE CASCADE,
  person_id       UUID REFERENCES persons(id),

  delivered_at    TIMESTAMP,
  read_at         TIMESTAMP,

  UNIQUE (message_id, person_id)
);

CREATE INDEX idx_msg_recipients_message ON message_recipients(message_id);
CREATE INDEX idx_msg_recipients_person  ON message_recipients(person_id);
```

---

## 9. BACKEND — MODELS & SERVICES

### 9.1 — Key Django Models

```python
# apps/departments/models.py

class DepartmentExecutive(models.Model):
    class Role(models.TextChoices):
        HOD      = 'HOD',      'Head of Department'
        ASST_HOD = 'ASST_HOD', 'Assistant Head of Department'
        WELFARE  = 'WELFARE',  'Welfare Officer'
        PRO      = 'PRO',      'Public Relations Officer'

    department  = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='executives')
    person      = models.ForeignKey('persons.Person', on_delete=models.CASCADE)
    system_user = models.ForeignKey('accounts.SystemUser', on_delete=models.CASCADE)
    role        = models.CharField(max_length=20, choices=Role.choices)
    granted_by  = models.ForeignKey('accounts.SystemUser', on_delete=models.SET_NULL,
                    null=True, related_name='granted_executives')
    granted_at  = models.DateTimeField(auto_now_add=True)
    revoked_at  = models.DateTimeField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = 'department_executives'
        unique_together = [('department', 'role')]


class DepartmentSession(models.Model):
    class SessionType(models.TextChoices):
        REGULAR   = 'REGULAR',   'Regular Meeting'
        TRAINING  = 'TRAINING',  'Training Session'
        SPECIAL   = 'SPECIAL',   'Special Event'
        REHEARSAL = 'REHEARSAL', 'Rehearsal'

    department   = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='sessions')
    session_name = models.CharField(max_length=255)
    session_date = models.DateField()
    session_type = models.CharField(max_length=20, choices=SessionType.choices)
    notes        = models.TextField(blank=True)
    created_by   = models.ForeignKey('accounts.SystemUser', on_delete=models.SET_NULL, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'department_sessions'


class DepartmentMessage(models.Model):
    class MessageType(models.TextChoices):
        ANNOUNCEMENT  = 'ANNOUNCEMENT',  'Announcement'
        REMINDER      = 'REMINDER',      'Reminder'
        WELFARE_CHECK = 'WELFARE_CHECK', 'Welfare Check'
        PRAYER_REQUEST= 'PRAYER_REQUEST','Prayer Request'
        URGENT        = 'URGENT',        'Urgent'

    class ApprovalStage(models.TextChoices):
        DRAFT           = 'DRAFT',           'Draft'
        PENDING_LEVEL1  = 'PENDING_LEVEL1',  'Pending Level 1'
        PENDING_ADMIN   = 'PENDING_ADMIN',   'Pending Admin'
        APPROVED        = 'APPROVED',        'Approved'
        SENT            = 'SENT',            'Sent'
        REJECTED_L1     = 'REJECTED_L1',     'Rejected at Level 1'
        REJECTED_ADMIN  = 'REJECTED_ADMIN',  'Rejected by Admin'

    department              = models.ForeignKey(Department, on_delete=models.CASCADE)
    subject                 = models.CharField(max_length=255)
    body                    = models.TextField()
    message_type            = models.CharField(max_length=20, choices=MessageType.choices)
    priority                = models.CharField(max_length=10, default='NORMAL')
    recipient_scope         = models.CharField(max_length=20, default='ALL')
    approval_stage          = models.CharField(max_length=20, choices=ApprovalStage.choices, default=ApprovalStage.DRAFT)
    level1_reviewed_by      = models.ForeignKey('accounts.SystemUser', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='l1_reviewed_messages')
    level1_reviewed_at      = models.DateTimeField(null=True, blank=True)
    level1_rejection_reason = models.TextField(blank=True)
    admin_reviewed_by       = models.ForeignKey('accounts.SystemUser', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='admin_reviewed_messages')
    admin_reviewed_at       = models.DateTimeField(null=True, blank=True)
    admin_rejection_reason  = models.TextField(blank=True)
    sent_at                 = models.DateTimeField(null=True, blank=True)
    created_by              = models.ForeignKey('accounts.SystemUser', on_delete=models.SET_NULL,
                                null=True, related_name='authored_messages')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'department_messages'
```

### 9.2 — Message Approval Service

```python
# apps/departments/services.py

class MessageService:

    @staticmethod
    def submit_for_approval(message, submitted_by):
        """Sender submits a draft message for review."""
        if message.created_by != submitted_by:
            raise PermissionError("You can only submit your own messages.")

        # URGENT messages skip Level 1 and go straight to Admin
        if message.priority == 'URGENT' or message.message_type == 'URGENT':
            message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_ADMIN
        else:
            message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_LEVEL1

        message.save(update_fields=['approval_stage', 'updated_at'])
        NotificationService.dispatch_message_pending(message)
        return message

    @staticmethod
    def level1_approve(message, approved_by):
        """HOD or ASST_HOD approves at Level 1."""
        # Cannot approve own message
        if message.created_by == approved_by:
            raise PermissionError("You cannot approve your own message.")

        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_LEVEL1:
            raise ValueError("Message is not pending Level 1 approval.")

        message.level1_reviewed_by  = approved_by
        message.level1_reviewed_at  = timezone.now()
        message.approval_stage      = DepartmentMessage.ApprovalStage.PENDING_ADMIN
        message.save(update_fields=['level1_reviewed_by', 'level1_reviewed_at', 'approval_stage', 'updated_at'])

        # Notify Admin
        NotificationService.dispatch(
            event='MESSAGE_PENDING_ADMIN',
            entity=message,
            target_roles=['ADMIN']
        )
        return message

    @staticmethod
    def level1_reject(message, rejected_by, reason):
        """HOD or ASST_HOD rejects at Level 1."""
        message.level1_reviewed_by      = rejected_by
        message.level1_reviewed_at      = timezone.now()
        message.level1_rejection_reason = reason
        message.approval_stage          = DepartmentMessage.ApprovalStage.REJECTED_L1
        message.save()

        # Notify original sender
        NotificationService.dispatch_message_rejected(message, level=1)
        return message

    @staticmethod
    def admin_approve(message, admin_user):
        """Admin gives final approval and triggers send."""
        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_ADMIN:
            raise ValueError("Message is not pending Admin approval.")

        message.admin_reviewed_by = admin_user
        message.admin_reviewed_at = timezone.now()
        message.approval_stage    = DepartmentMessage.ApprovalStage.APPROVED
        message.save()

        # Deliver message to recipients
        MessageService._deliver(message, sent_by=admin_user)
        return message

    @staticmethod
    def admin_reject(message, admin_user, reason):
        """Admin rejects — notifies HOD who approved AND original sender."""
        message.admin_reviewed_by      = admin_user
        message.admin_reviewed_at      = timezone.now()
        message.admin_rejection_reason = reason
        message.approval_stage         = DepartmentMessage.ApprovalStage.REJECTED_ADMIN
        message.save()

        NotificationService.dispatch_message_rejected(message, level=2)
        return message

    @staticmethod
    def _deliver(message, sent_by):
        """Create MessageRecipient records and mark as SENT."""
        from django.db import transaction

        dept     = message.department
        scope    = message.recipient_scope
        members  = DepartmentMember.objects.filter(department=dept, is_active=True)

        if scope == 'SPECIFIC':
            # Recipients already selected and saved in message_recipients
            pass
        elif scope == 'ABSENTEES':
            last_session = dept.sessions.order_by('-session_date').first()
            if last_session:
                absent_ids = AttendanceRecord.objects.filter(
                    session=last_session, status='ABSENT'
                ).values_list('person_id', flat=True)
                members = members.filter(person_id__in=absent_ids)

        with transaction.atomic():
            MessageRecipient.objects.bulk_create([
                MessageRecipient(message=message, person=m.person)
                for m in members
            ], ignore_conflicts=True)

            message.approval_stage = DepartmentMessage.ApprovalStage.SENT
            message.sent_at        = timezone.now()
            message.sent_by        = sent_by
            message.save(update_fields=['approval_stage', 'sent_at', 'sent_by'])
```

### 9.3 — Leaderboard Query Service

```python
# apps/departments/services.py

class LeaderboardService:

    @staticmethod
    def top_attendance(department_id, session_type=None, limit=5, months=3):
        """
        Returns top members ranked by attendance rate.
        session_type=None means all types.
        session_type='TRAINING' means training leaderboard only.
        """
        from django.db.models import Count, Q
        from datetime import date
        from dateutil.relativedelta import relativedelta

        cutoff = date.today() - relativedelta(months=months)

        sessions = DepartmentSession.objects.filter(
            department_id=department_id,
            session_date__gte=cutoff
        )
        if session_type:
            sessions = sessions.filter(session_type=session_type)

        session_ids   = sessions.values_list('id', flat=True)
        total_sessions = sessions.count()

        if total_sessions == 0:
            return []

        records = (
            AttendanceRecord.objects
            .filter(session_id__in=session_ids)
            .values('person_id')
            .annotate(
                present_count=Count('id', filter=Q(status__in=['PRESENT', 'LATE'])),
                total_count=Count('id')
            )
            .order_by('-present_count')[:limit]
        )

        results = []
        for i, record in enumerate(records, 1):
            from apps.persons.models import Person
            person = Person.objects.get(pk=record['person_id'])
            results.append({
                'rank':          i,
                'person_id':     str(record['person_id']),
                'full_name':     person.full_name,
                'profile_photo': person.profile_photo.url if person.profile_photo else None,
                'attended':      record['present_count'],
                'total':         total_sessions,
                'rate':          round((record['present_count'] / total_sessions) * 100, 1),
                'streak':        LeaderboardService._get_streak(record['person_id'], session_ids),
            })
        return results

    @staticmethod
    def _get_streak(person_id, session_ids):
        """Calculate current consecutive attendance streak."""
        records = (
            AttendanceRecord.objects
            .filter(person_id=person_id, session_id__in=session_ids)
            .select_related('session')
            .order_by('-session__session_date')
        )
        streak = 0
        for record in records:
            if record.status in ('PRESENT', 'LATE'):
                streak += 1
            else:
                break
        return streak

    @staticmethod
    def absence_alerts(department_id, consecutive_threshold=3):
        """Returns members with N or more consecutive absences."""
        members = DepartmentMember.objects.filter(
            department_id=department_id, is_active=True
        )
        alerts = []
        for member in members:
            recent_records = (
                AttendanceRecord.objects
                .filter(person_id=member.person_id, department_id=department_id)
                .order_by('-session__session_date')
                .select_related('session')[:10]
            )
            consecutive = 0
            for record in recent_records:
                if record.status == 'ABSENT':
                    consecutive += 1
                else:
                    break
            if consecutive >= consecutive_threshold:
                alerts.append({
                    'person':      member.person,
                    'missed':      consecutive,
                    'last_seen':   LeaderboardService._last_present(member.person_id, department_id),
                })
        return sorted(alerts, key=lambda x: x['missed'], reverse=True)

    @staticmethod
    def _last_present(person_id, department_id):
        record = (
            AttendanceRecord.objects
            .filter(person_id=person_id, department_id=department_id, status__in=['PRESENT', 'LATE'])
            .order_by('-session__session_date')
            .select_related('session')
            .first()
        )
        return record.session.session_date if record else None
```

---

## 10. API ENDPOINTS

```
# Department Management (Admin only)
GET    /api/v1/depts/                          List all departments
POST   /api/v1/depts/                          Create department
GET    /api/v1/depts/{id}/                     Department detail
PATCH  /api/v1/depts/{id}/                     Update department
POST   /api/v1/depts/{id}/grant_executive/     Grant executive access (Admin only)
POST   /api/v1/depts/{id}/revoke_executive/    Revoke executive access (Admin only)

# Member Management (Executives)
GET    /api/v1/depts/{id}/members/             List department members
POST   /api/v1/depts/{id}/members/             Add member to department
DELETE /api/v1/depts/{id}/members/{person_id}/ Remove member (HOD/ASST_HOD only)
GET    /api/v1/depts/{id}/members/{person_id}/ Member detail + attendance summary

# Attendance (Executives)
GET    /api/v1/depts/{id}/sessions/            List all sessions
POST   /api/v1/depts/{id}/sessions/            Create session + mark attendance
GET    /api/v1/depts/{id}/sessions/{sid}/      Session detail + full attendance sheet
PATCH  /api/v1/depts/{id}/sessions/{sid}/      Edit session (same day only)

# Dashboard Data (Executives)
GET    /api/v1/depts/{id}/dashboard/           All KPI stats in one call
GET    /api/v1/depts/{id}/leaderboard/regular/ Top attendance leaderboard
GET    /api/v1/depts/{id}/leaderboard/training/Top training leaderboard
GET    /api/v1/depts/{id}/alerts/              Absence alerts list

# Messaging (Executives)
GET    /api/v1/depts/{id}/messages/            List messages (filtered by role)
POST   /api/v1/depts/{id}/messages/            Create message draft
GET    /api/v1/depts/{id}/messages/{mid}/      Message detail + approval trail
POST   /api/v1/depts/{id}/messages/{mid}/submit/     Submit draft for approval
POST   /api/v1/depts/{id}/messages/{mid}/approve_l1/ HOD/ASST_HOD Level 1 approve
POST   /api/v1/depts/{id}/messages/{mid}/reject_l1/  HOD/ASST_HOD Level 1 reject
POST   /api/v1/depts/{id}/messages/{mid}/approve_admin/ Admin final approve
POST   /api/v1/depts/{id}/messages/{mid}/reject_admin/  Admin final reject
```

---

## 11. FRONTEND PAGES

| Page | Route | Access |
|------|-------|--------|
| Department Dashboard | `/dept/:id/dashboard` | All executives |
| Member Roster | `/dept/:id/members` | All executives |
| Add Member | `/dept/:id/members/add` | All executives |
| Member Detail | `/dept/:id/members/:pid` | All executives |
| Attendance — Sessions List | `/dept/:id/attendance` | HOD, ASST_HOD, WELFARE |
| Attendance — Mark Session | `/dept/:id/attendance/mark` | HOD, ASST_HOD, WELFARE |
| Session Detail | `/dept/:id/attendance/:sid` | HOD, ASST_HOD, WELFARE |
| Messages — Inbox/History | `/dept/:id/messages` | All executives |
| Messages — Draft | `/dept/:id/messages/new` | All executives |
| Message Detail | `/dept/:id/messages/:mid` | All executives |
| Message Approval Queue | `/dept/:id/messages/approvals` | HOD, ASST_HOD |

---

## 12. GLOSSARY — DEPARTMENT TERMS

| Term | Meaning |
|------|---------|
| **Executive** | A member granted department admin access (HOD, ASST_HOD, WELFARE, PRO) |
| **HOD** | Head of Department — top leadership role |
| **ASST_HOD** | Assistant HOD — deputy, Level 1 approver when needed |
| **WELFARE** | Welfare Officer — member care and pastoral follow-up |
| **PRO** | Public Relations Officer — communications and announcements |
| **Session** | A recorded department gathering (Regular, Training, Special, Rehearsal) |
| **Attendance Streak** | Consecutive sessions a member has attended without a miss |
| **Absence Alert** | Flag triggered when a member misses 3+ consecutive sessions |
| **Level 1 Approval** | First message review by HOD or ASST_HOD |
| **Level 2 Approval** | Final message review by Admin before sending |
| **Recipient Scope** | Who a message is sent to: All / Specific / Absentees |
| **Department Switcher** | UI element for executives in multiple departments |
