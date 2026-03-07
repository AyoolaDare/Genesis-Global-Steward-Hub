# GENERAL OVERVIEW
## Church Management System (CMS) — Application Knowledge Base

---

## 1. WHAT THIS APP IS

The **Church Management System (CMS)** is a role-based, web application built to centralize and streamline the operational management of a church. It replaces fragmented spreadsheets, paper records, and disconnected tools with a single, unified platform that every team — from medical to admin — operates from.

The app is not a public website. It is an **internal operations tool** for authorized church staff and team leaders.

---

## 2. THE PROBLEM IT SOLVES

| Before CMS | After CMS |
|-----------|-----------|
| New visitors recorded on paper, easily lost | Digital record created on first contact |
| Medical records in separate files | Linked to the person's main profile |
| Follow-up team doesn't know who's new | Real-time notification when any new person is added |
| Cell group membership tracked in WhatsApp | Structured group management with searchable database |
| Department attendance in notebooks | Digital, tracked, with reports |
| HR files in folders | Centralized, secure, complete worker profiles |
| No single view of a person's journey | Full timeline: first visit → member → volunteer → worker |

---

## 3. THE FIVE MODULES

### 🔐 Admin
The control center. Admin staff have full visibility and authority across the system.
- Approve or reject new member profiles from all sources
- Merge duplicate or partial profiles into one account
- Create and disband cell groups
- Manage system users (create logins, assign roles)
- Access audit logs — who did what, when
- View all reports and dashboards

### ⚕️ Medical
The first touchpoint for many people.
- Verify if a visitor exists in the database via phone number
- Create partial profiles for unknown persons
- Log visits, vitals, diagnoses, prescriptions
- Access full medical history for known members
- Trigger follow-up when a new person is seen

### 📞 Follow-Up
The outreach and pastoral care arm.
- Sees a live queue of all new members (from any source)
- Assigns team members to call or visit new people
- Logs contact attempts and outcomes
- Moves members into departments or cell groups as they engage
- Can create new members (requires Admin approval)

### 🏘️ Cell Groups
Flexible, temporary small teams.
- Admin creates cell groups with a name, purpose, and Cell Admin
- Members added via phone number search (no manual typing)
- Admin verifies matches before confirming
- Unknown numbers trigger new member creation
- Cell Admins manage their own group's members and activities
- Groups can be disbanded; members return to the main pool

### 🏢 Departments
Permanent ministry units (choir, ushers, media, etc.)
- Each has a Team Leader and Assistant Leader
- Members (volunteers) are added and tracked
- Attendance marked per session with PRESENT/ABSENT/EXCUSED
- Attendance rate reported per member
- Leaders manage only their own department

---

## 4. PERSON LIFECYCLE

This is the most important concept in the system. Every person follows a journey:

```
FIRST CONTACT
(Medical walk-in, Cell group number, Follow-up call)
         │
         ▼
   NEW MEMBER (partial profile)
   - Name, phone, source, basic info
   - Medical data if from medical team
         │
         ▼ (Admin reviews and approves)
         │
     MEMBER (full profile)
   - Complete contact info
   - Linked to Follow-Up queue
   - Can join Cell Groups and Departments
         │
         ├──► Joins CELL GROUP (optional, temporary team)
         │
         ├──► Joins DEPARTMENT (volunteer in ministry)
         │
         ▼ (If hired by church)
     WORKER (full HR profile)
   - Employment details
   - Contract, payroll, leave
   - Medical records accessible to HR
```

**Key rule:** One person = one record. Phone number is the unique key. If a person appears in two places, Admin merges them.

---

## 5. THE TRIGGER SYSTEM (How Teams Connect)

The CMS is designed so that no team works in isolation. When one team acts, another is automatically notified.

| Who Acts | What They Do | Who Gets Notified |
|----------|-------------|-------------------|
| Medical | Creates new person | Admin + Follow-Up |
| Cell Admin | Adds unknown phone | Admin (approval needed) |
| Follow-Up | Creates new member | Admin (approval needed) |
| Admin | Approves new member | Follow-Up (new person in queue) |
| Admin | Merges profiles | Original creator team |
| Any | Creates worker | HR team notified |

Notifications appear as:
1. In-app bell notifications (real-time)
2. Email for high-priority events (new person pending approval)

---

## 6. DATA OWNERSHIP & ACCESS RULES

### Who can see medical records?
- Medical team: full access
- HR team: only records of Workers (not regular members)
- Admin: read access to all
- Everyone else: no access

### Who can approve new members?
- **Only Admin**. Other teams can initiate, never finalize.

### Who can disband a cell group?
- **Only Admin**. Cell Admins can manage but not disband.

### Who can see HR records?
- HR team + Admin only.

### Can I see another department's data?
- Department Leaders see only their department.
- Admin sees all departments.

---

## 7. PHONE NUMBER — THE UNIVERSAL KEY

The phone number is the **single most important piece of data** in the system. It is used:
- As the primary lookup when someone walks into medical
- To search the database when adding someone to a cell group
- As a unique constraint — no two people can share a number
- As the de-duplication check during profile merges
- For follow-up outreach tracking

**Phone Normalization Rules:**
- Strip all spaces, dashes, and brackets
- Convert `+234` prefix to `0` (Nigeria standard)
- Store in normalized form: `08012345678`
- Search by normalized form always

---

## 8. PROFILE MERGE — HOW IT WORKS

Because multiple teams can create profiles independently, duplicates can occur. The merge flow ensures every person ends up with exactly one account.

**Scenario Example:**
1. A visitor walks into the medical bay. Medical staff create a partial profile: `Phone: 0801..., Name: John, Blood group: O+`
2. That same person is added to a cell group via phone lookup — a second stub is created before the medical one is approved
3. Admin sees two pending profiles for the same phone number
4. Admin triggers merge:
   - All medical records → attached to primary profile
   - Follow-up tasks → moved to primary profile
   - Notifications sent to both creating teams
   - Duplicate record deleted
   - One clean, complete profile remains

---

## 9. REPORTING CAPABILITIES

| Report | Module | Access |
|--------|--------|--------|
| Total members by status | Admin Dashboard | Admin |
| New members this month | Admin Dashboard | Admin |
| Member growth trend (12 months) | Admin Dashboard | Admin |
| Pending approvals | Admin | Admin |
| Medical visits by date range | Medical | Medical, Admin |
| Members with no medical record | Medical | Medical, Admin |
| Follow-up task completion rate | Follow-Up | Follow-Up, Admin |
| New member conversion rate | Follow-Up | Follow-Up, Admin |
| Cell group membership list | Cell Groups | Cell Admin, Admin |
| Department attendance rate | Departments | Dept Leader, Admin |
| Worker headcount by department | HR | HR, Admin |
| Worker employment status | HR | HR, Admin |

---

## 10. SECURITY PRINCIPLES

1. **Authentication required** for every page and API endpoint
2. **Role-based access** — you only see what your role allows
3. **Audit trail** — every create, update, delete is logged with who did it
4. **Medical records** — extra layer of access control (not just role-based)
5. **Soft deletes** — nothing is permanently deleted, always recoverable
6. **Passwords** — hashed with bcrypt (never stored plain)
7. **Tokens** — short-lived access tokens, refresh via httpOnly cookie
8. **HTTPS** — enforced on all environments (Vercel + Render provide this)

---

## 11. TECHNOLOGY DECISIONS — WHY THESE CHOICES

| Choice | Why |
|--------|-----|
| React + Vite | Fast dev experience, large ecosystem, component-based |
| Node.js + Express | Same language as frontend, fast, familiar |
| TypeScript everywhere | Catches bugs before runtime, better autocomplete |
| PostgreSQL | Relational data model fits church data perfectly |
| Prisma ORM | Type-safe queries, easy migrations, great DX |
| Render (backend) | Simple deployment, managed Postgres, auto-scaling |
| Vercel (frontend) | Zero-config React deploys, preview URLs, global CDN |
| GitHub Actions | Free CI/CD, tight GitHub integration, YAML-based |
| Zod (validation) | Share schemas between frontend and backend |

---

## 12. PHASED DEVELOPMENT PLAN

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Project setup (monorepo, GitHub, CI/CD pipelines)
- [ ] Database schema + Prisma setup
- [ ] Authentication system (login, roles, JWT)
- [ ] Admin module: user management, member management
- [ ] Basic dashboard with KPI cards

### Phase 2 — Core Modules (Weeks 5–10)
- [ ] Medical module: visit logging, record management
- [ ] Follow-Up module: queue, task assignment, outreach logging
- [ ] Cell Groups: creation, phone search, member management
- [ ] Departments: creation, member management, attendance
- [ ] Notification system (in-app)

### Phase 3 — Advanced Features (Weeks 11–16)
- [ ] HR module: worker profiles, contracts, payroll
- [ ] Profile merge workflow
- [ ] Global search (⌘K)
- [ ] Reports and data exports (PDF/Excel)
- [ ] Email notifications (SendGrid)
- [ ] Audit log viewer

### Phase 4 — Polish & Scale (Weeks 17–20)
- [ ] Dashboard infographics and advanced charts
- [ ] Performance optimization
- [ ] Dark mode
- [ ] Mobile responsiveness fine-tuning
- [ ] User training documentation
- [ ] Load testing

---

## 13. KEY VOCABULARY (GLOSSARY)

| Term | Meaning |
|------|---------|
| **Person** | Any human in the database (new member, member, or worker) |
| **New Member** | Partial profile — not yet fully registered |
| **Member** | Fully registered church attendee |
| **Worker** | Paid church staff with HR profile |
| **Volunteer** | Member serving in a department (unpaid) |
| **Cell Group** | Temporary small team, specific purpose, can disband |
| **Department** | Permanent ministry unit (choir, media, ushers, etc.) |
| **Follow-Up** | Team responsible for reaching out to new/inactive members |
| **Pending Approval** | Profile created by non-admin team, awaiting Admin review |
| **Merge** | Combining two partial/duplicate profiles into one |
| **Profile Stub** | Minimal record created before approval (name + phone + source) |
| **Trigger** | An event that causes automatic notification to another team |
| **Audit Log** | Immutable record of every change made in the system |
| **Soft Delete** | Marking a record as deleted without removing it from the database |
| **Module** | A functional section of the app (Admin, Medical, Follow-Up, etc.) |
