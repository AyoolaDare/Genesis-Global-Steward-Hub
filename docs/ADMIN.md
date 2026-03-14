# ADMIN SPECIFICATION
## GG Steward — Main Administrator Role, Access & Functions

---

## 1. WHO THE ADMIN IS

The **Admin** is the supreme authority in GG Steward. There is no higher role in the system. Every module, every approval chain, every permission grant, and every system-level decision either passes through Admin or is visible to Admin.

Admin is not a department. Admin is not a team. Admin is the **operational brain of the entire application** — the one role that sees everything, controls everything, and is accountable for the integrity of every record in the system.

Admin accounts are created only by other Admins or during initial system setup. They cannot be self-registered.

---

## 2. ROLE ASSIGNMENT & AUTOMATIC USER CREATION

This is one of the most important flows in GG Steward. When Admin assigns a role to any church member, **the system automatically creates a login account** for that person and immediately lists them in the Admin Users panel where credentials can be managed.

### 2.1 — Assignable Roles

These are all the roles Admin can assign to any church member. Once assigned, the member becomes a System User:

| Role Code | Title | Scope |
|-----------|-------|-------|
| `ADMIN` | Administrator | System-wide — full access |
| `MEDICAL` | Medical Team | Medical module only |
| `FOLLOWUP` | Follow-Up Team | Follow-Up module only |
| `CELL_LEADER` | Cell Leader | Assigned cell group — full control |
| `CELL_ASST` | Cell Lead Assistant | Assigned cell group — limited |
| `HOD` | Head of Department | Assigned department — full control |
| `ASST_HOD` | Assistant HOD | Assigned department — co-admin |
| `WELFARE` | Welfare Officer | Assigned department — member care |
| `PRO` | Public Relations Officer | Assigned department — communications |
| `HR` | HR Team | HR module only |

### 2.2 — Role Assignment Flow

```
Admin opens any Member's profile
         │
         ▼
Clicks [Assign Role]
         │
         ▼
Step 1 — Select Role
  Dropdown of all available roles
  If selecting a department role (HOD, ASST_HOD, WELFARE, PRO):
    → Second dropdown appears: "Select Department"
  If selecting a cell role (CELL_LEADER, CELL_ASST):
    → Second dropdown appears: "Select Cell Group"
         │
         ▼
Step 2 — Review & Confirm
  Email address auto-filled from the member's profile
  System will auto-generate a secure temporary password
  No manual password entry required at this step
         │
         ▼
Step 3 — Confirm Assignment
  Summary shown:
    Member: John Afolabi
    Role: HOD
    Department: Media
    Login Email: john@email.com (from their member profile)
  [Confirm & Create Login]
         │
         ▼
System automatically:
  1. Creates a SystemUser record linked to the Person profile
  2. Sets the assigned role and scope (department/cell if applicable)
  3. Auto-generates a secure temporary password
  4. Stores the hashed password
  5. Adds them to the Admin Users panel immediately
  6. Sends login credentials + temp password to the member's email
  7. Logs the assignment in the audit trail
         │
         ▼
Member receives email:
  Subject: "Your GG Steward login is ready"
  Body: Login URL, email address, temporary password
        "You will be prompted to change your password on first login"
         │
         ▼
Member logs in → prompted to set a new permanent password before proceeding
```

### 2.3 — What Happens if the Member Has No Email

If the member profile has no email address:
- Admin is blocked from completing role assignment with a warning:
  "This member has no email address. A login cannot be created until an email is added."
- Admin must first update the member's profile to include a valid email
- Once the email is added, Admin can proceed with role assignment
- The temporary password email is sent automatically on successful assignment

### 2.4 — One Member, Multiple Roles

A member can hold roles in multiple scopes — for example, HOD of Media Department and CELL_LEADER of Zone A. When they log in, a **scope switcher** appears in their header allowing them to switch between their active roles and views.

---

## 3. ADMIN USERS PANEL

This is where Admin manages every system user — their roles, passwords, and access status.

### 3.1 — Users List

```
Filters: Role | Status (Active/Inactive) | Department | Cell Group
Search: Name | Email

┌─────────────────────────────────────────────────────────────────────────────────┐
│  SYSTEM USERS                                              [+ Assign New Role]  │
├──────────────┬────────────┬──────────────────┬───────────────┬──────────┬───────┤
│ Name         │ Role       │ Scope            │ Last Login    │ Status   │ Actions│
├──────────────┼────────────┼──────────────────┼───────────────┼──────────┼───────┤
│ Ada Okafor   │ HOD        │ Media Dept       │ Today 09:14   │ Active   │ • • • │
│ Tunde Bello  │ CELL_LEADER│ Zone A Group     │ Yesterday     │ Active   │ • • • │
│ Grace Mensah │ WELFARE    │ Choir Dept       │ 3 days ago    │ Active   │ • • • │
│ Emeka Nwosu  │ FOLLOWUP   │ System-wide      │ Today 07:30   │ Active   │ • • • │
│ Kemi Fashola │ HOD        │ Ushers Dept      │ Never         │ Active   │ • • • │
└──────────────┴────────────┴──────────────────┴───────────────┴──────────┴───────┘
```

### 3.2 — User Actions (the • • • menu)

Each user row has an actions menu with:

| Action | Description |
|--------|-------------|
| **View Profile** | Opens the linked member profile |
| **Change Password** | Admin sets a new password for this user |
| **Reset Password** | Generates a new random password, shows it once |
| **Edit Role** | Change their role or reassign to different dept/cell |
| **Add Another Role** | Assign an additional role (multi-scope users) |
| **Deactivate** | Disables login without deleting the user or member record |
| **Reactivate** | Re-enables a deactivated user |
| **View Audit Trail** | See all actions this user has ever taken |

### 3.3 — Change Password Flow

```
Admin clicks [Change Password] on any user
         │
         ▼
Modal opens:
  User: Ada Okafor
  Role: HOD — Media Department
  ─────────────────────────────
  New Password: [________________]
  Confirm Password: [________________]
  ─────────────────────────────
  [x] Notify user by email  ← checked by default
  [ ] Force re-login (invalidates current session)
  ─────────────────────────────
  [Save Password]
         │
         ▼
Password updated immediately
Email sent to user with new credentials (if notify checked)
Audit log entry created: "Admin changed password for Ada Okafor"
```

Admin can also click **[Reset to Temp Password]** which auto-generates a new temporary password, emails it to the user, and forces a password change on next login — same flow as the initial role assignment.

### 3.4 — Revoking a Role

When Admin removes a role from a system user:

```
Admin clicks [Edit Role] → selects "Remove Role"
         │
         ▼
If user has only this one role:
  - System User account is deactivated
  - Person profile remains 100% intact
  - They lose all login access immediately
  - Active session is invalidated

If user has multiple roles:
  - Only the selected role is removed
  - Other roles remain active
  - If removed role was a dept/cell role:
    their scope for that dept/cell is removed
         │
         ▼
Audit log entry created
Member notified via email (if email exists)
```

---

## 4. ADMIN DASHBOARD

### 4.1 — Dashboard Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  [GG Steward Logo]                          [🔔 Notifications 12]   │
│  Welcome, [Admin Name]    Main Administrator      [Avatar] [▼]      │
│  Thursday, 12 March 2026                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 — Top KPI Row (6 Cards)

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Active      │ │ New Members │ │ Pending     │ │ Active      │ │ Active Cell │
│ Members     │ │ Workers     │ │ This Month  │ │ Approvals   │ │ Departments │ │ Groups      │
│  3,842      │ │   124       │ │    47       │ │    12       │ │    18       │ │    34       │
│ ▲ 3.2% MoM │ │ ▲ 2 added  │ │ ⬤ 8 new    │ │ ⚠ urgent   │ │ ✅ running  │ │ ✅ active   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 4.3 — Charts Section

| Chart | Type | Question Answered |
|-------|------|-------------------|
| Member Growth | Line (12 months) | Is the church growing? |
| Member Status Breakdown | Donut | Health of the database |
| Department Size Comparison | Horizontal Bar | Which departments are largest? |
| Cell Group Activity | Bar | Are cell groups healthy? |
| Follow-Up Conversion Funnel | Funnel | How many visitors become integrated members? |
| Worker Distribution | Pie | How are workers spread across departments? |

### 4.4 — Pending Approvals Table

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ⚠ PENDING APPROVALS                                            [View All]       │
├───┬──────────────────┬───────────────────────┬──────────────┬──────────┬────────┤
│ # │ Person / Item    │ Action Required        │ Source       │ Date     │ Action │
├───┼──────────────────┼───────────────────────┼──────────────┼──────────┼────────┤
│ 1 │ John Afolabi     │ New Member Approval    │ Medical      │ Today    │ ✅ ❌  │
│ 2 │ Grace Mensah     │ New Member Approval    │ Cell Group   │ Today    │ ✅ ❌  │
│ 3 │ Welfare Check Msg│ Message Final Approval │ Media Dept   │ Yesterday│ ✅ ❌  │
└───┴──────────────────┴───────────────────────┴──────────────┴──────────┴────────┘
```

### 4.5 — Live Activity Feed

```
┌──────────────────────────────────────────────────────────┐
│  🔴 LIVE ACTIVITY                          [View Logs]   │
├──────────────────────────────────────────────────────────┤
│  ⚕️  Medical added new member: Emeka Obi    2 min ago    │
│  📞  Follow-Up completed task: Ada Okafor   5 min ago    │
│  🏢  Media Dept marked attendance           12 min ago   │
│  🏘️  Cell Group 7 added 3 members           18 min ago   │
│  ✅  Admin approved: Grace Mensah profile   1 hr ago     │
└──────────────────────────────────────────────────────────┘
```

### 4.6 — Module Status Tiles

```
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│  ⚕️ Medical             │  │  📞 Follow-Up           │  │  🏘️ Cell Groups         │
│  Visits today: 4       │  │  Queue: 23 pending     │  │  Active: 34            │
│  New profiles: 2       │  │  Overdue: 5            │  │  Disbanded: 8          │
│  [Open Module →]       │  │  [Open Module →]       │  │  [Open Module →]       │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│  🏢 Departments         │  │  💼 HR / Workers        │  │  👥 Members             │
│  Active: 18            │  │  Workers: 124          │  │  Total: 3,842          │
│  Sessions this week: 7 │  │  On leave: 3           │  │  Inactive: 89          │
│  [Open Module →]       │  │  [Open Module →]       │  │  [Open Module →]       │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

---

## 5. MEMBER MANAGEMENT

### 5.1 — Members List Page

```
Filters: Status | Gender | Source | Joined Date | Department | Cell Group
Search: Name | Phone | Email
Export: CSV / Excel

Columns: Photo | Full Name | Phone | Email | Status | Source | Joined | Actions
```

### 5.2 — Member Detail View

```
┌──────────────────────────────────────────────────────────┐
│  [Photo]  John Afolabi                    [MEMBER badge] │
│           08012345678  |  john@email.com                 │
│           Joined: 15 Jan 2025  |  Source: Medical        │
├──────────────────────────────────────────────────────────┤
│  PERSONAL INFO    │  CHURCH INFO      │  EMERGENCY       │
│  DOB, Gender,     │  Baptized, Join   │  Contact name    │
│  Address, State   │  date, Status     │  Contact phone   │
├──────────────────────────────────────────────────────────┤
│  MEDICAL SUMMARY  │  FOLLOW-UP HISTORY│  MEMBERSHIPS     │
│  Blood group,     │  Tasks, outcomes, │  Departments,    │
│  Last visit date  │  assigned to      │  Cell Groups     │
├──────────────────────────────────────────────────────────┤
│  SYSTEM ACCESS                                           │
│  Role: HOD — Media Department    Status: Active         │
│  Last login: Today 09:14                                 │
├──────────────────────────────────────────────────────────┤
│  ACTIONS:                                                │
│  [Edit Profile]  [Approve]   [Merge]   [Assign Role]    │
│  [Change Password] [Add to Dept] [Add to Cell]          │
└──────────────────────────────────────────────────────────┘
```

### 5.3 — New Member Approval Flow

```
Notification: "New member pending approval"
         │
         ▼
Admin reviews: name, phone, source, attached data
         │
    ┌────┴────┐
APPROVE    REJECT
    │           │
    ▼           ▼
Status:     Record deleted
NEW_MEMBER  Source team notified with reason
    │
    ▼
Follow-Up queue auto-populated
Source team notified of approval
```

---

## 6. APPROVAL CENTER

Single queue page for everything that needs Admin action:

```
┌──────────────────────────────────────────────────────────────────────┐
│  APPROVAL CENTER                              Filter: [All Types ▼] │
├─────────────────┬────────────────────────────────────────────────────┤
│  NEW MEMBERS    │  12 pending  |  Oldest: 5 days ago  [Review All]  │
├─────────────────┼────────────────────────────────────────────────────┤
│  MESSAGES       │  3 pending  |  1 marked URGENT      [Review All]  │
├─────────────────┼────────────────────────────────────────────────────┤
│  PROFILE MERGES │  2 flagged duplicate phones          [Review All]  │
└─────────────────┴────────────────────────────────────────────────────┘
```

---

## 7. DEPARTMENT & CELL GROUP OVERSIGHT

Admin sees ALL departments and ALL cell groups from a single management view — full data, all executives, all members, all messages.

**Department admin actions (Admin only):**
- Create / archive departments
- Assign / revoke executive roles (triggers auto-login creation)
- View full message history including rejected messages
- View all attendance records across all departments

**Cell Group admin actions (Admin only):**
- Create / disband cell groups
- Assign Cell Leader and Cell Lead Assistant (triggers auto-login creation)
- View full member roster and activity log
- Transfer members from disbanded groups

---

## 8. AUDIT LOGS

```
Filters: User | Role | Module | Action Type | Date Range
Search: Entity name or ID

┌──────────────────────────────────────────────────────────────────────────┐
│ AUDIT LOGS                                                               │
├──────────┬───────────┬──────────────────────────┬──────────┬────────────┤
│ User     │ Role      │ Action                   │ Entity   │ Timestamp  │
├──────────┼───────────┼──────────────────────────┼──────────┼────────────┤
│ A. Bello │ MEDICAL   │ CREATE MedicalVisit      │ J.Afolabi│ 09:14 AM   │
│ Admin    │ ADMIN     │ ASSIGN_ROLE HOD           │ A.Okafor │ 08:55 AM   │
│ Admin    │ ADMIN     │ CHANGE_PASSWORD           │ T.Bello  │ 08:30 AM   │
└──────────┴───────────┴──────────────────────────┴──────────┴────────────┘
```

---

## 9. REPORTS & EXPORTS

| Report | Format |
|--------|--------|
| Full Member Directory | CSV / Excel |
| New Member Report | CSV / Chart |
| Attendance Summary (all depts) | CSV / Excel |
| Follow-Up Performance | CSV / Chart |
| Cell Group Health | CSV / Chart |
| Worker Report | CSV / Excel |
| System Users & Roles | CSV |
| Medical Visit Log | CSV |
| Message Log | CSV |
| Audit Report | CSV |

---

## 10. SYSTEM SETTINGS

| Setting | Description |
|---------|-------------|
| Church Name & Logo | Displayed in header and emails |
| Default Password Policy | Min length, complexity for auto-generated passwords |
| Notification Settings | Email vs in-app per event type |
| Absence Alert Threshold | Consecutive absences before alert fires (default: 3) |
| Follow-Up Inactivity Trigger | Days before a member is flagged |
| Session Timeout | Auto-logout after inactivity (default: 30 min) |
| Email From Address | Church email for system notifications |
| Backup & Data | Last backup timestamp, request manual backup |

---

## 11. ADMIN PERMISSIONS SUMMARY

| Capability | Admin |
|-----------|:-----:|
| Assign any role to any member | ✅ |
| Auto-create system user on role assignment | ✅ |
| Change / reset any user's password | ✅ |
| Deactivate / reactivate any user | ✅ |
| View entire member database | ✅ |
| Approve / reject new members | ✅ |
| Merge duplicate profiles | ✅ |
| View all departments (all data) | ✅ |
| Create / archive departments | ✅ |
| View all cell groups | ✅ |
| Create / disband cell groups | ✅ |
| Final message approval | ✅ |
| View all medical records (read-only) | ✅ |
| Full HR access | ✅ |
| Full follow-up queue access | ✅ |
| View audit logs | ✅ |
| Export any report | ✅ |
| Change system settings | ✅ |
| Permanently delete any record | ❌ (soft delete only) |
