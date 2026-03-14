# DEPARTMENT USER SPECIFICATION
## GG Steward — Department Executive Role, Navigation & Access

---

## 1. WHO THE DEPARTMENT USER IS

A **Department User** is a church member who has been assigned a department executive role by Admin. The moment their role is assigned, a system login is automatically created for them. They log into the **Department Hub** — a focused four-section interface scoped entirely to their department.

There are four executive roles within a department:

| Role Code | Title |
|-----------|-------|
| `HOD` | Head of Department |
| `ASST_HOD` | Assistant Head of Department |
| `WELFARE` | Welfare Officer |
| `PRO` | Public Relations Officer |

Department Users **only see their own department's data**. Nothing outside their department is visible to them.

---

## 2. NAVIGATION STRUCTURE

The Department Hub has exactly **four sections**. This is the complete navigation — nothing more, nothing less.

```
┌──────────────────────────────────────────────────────────────────┐
│  [GG Steward]           [Dept Switcher ▼]   [🔔 Bell]  [Avatar] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SIDEBAR (desktop) / BOTTOM TAB BAR (mobile):                   │
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  Dashboard  │  ← Home — metrics, charts, leaderboards        │
│  ├─────────────┤                                                 │
│  │  Members    │  ← Department members ONLY (not all church)    │
│  ├─────────────┤                                                 │
│  │  Attendance │  ← Sessions, mark attendance, history          │
│  ├─────────────┤                                                 │
│  │  Messages   │  ← Draft, submit, track approval status        │
│  └─────────────┘                                                 │
│                                                                  │
│  Notifications: Bell icon in header — clicking opens a dedicated │
│  full Notifications page showing all unread and past alerts     │
│  Profile: Avatar dropdown in header                             │
└──────────────────────────────────────────────────────────────────┘
```

**Important:** The **Members** section shows **only members of this department**. It is not a church-wide member list. Department Users cannot browse all church members freely — they can only search the full database when they are actively in the process of adding a new member to the department.

**Dept Switcher** appears in the header only if the executive holds roles in more than one department. Switching loads that department's full data instantly.

---

## 3. DASHBOARD

The Dashboard is the first screen after login. It answers the most important operational questions about the department at a glance.

### 3.1 — Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  Welcome back, Ada Okafor                  HOD — Media Department   │
│  Thursday, 12 March 2026                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 — KPI Cards

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Total Members   │ │  Last Session    │ │  Absences This   │ │  New This Month  │
│      142         │ │  Present: 98     │ │  Month: 12       │ │       6          │
│  ▲ 3 this month  │ │  Rate: 69%       │ │  ⚠ 3 critical    │ │  ✅ added        │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 3.3 — Charts

| Chart | Type | What It Shows |
|-------|------|--------------|
| Attendance Trend | Line chart | Attendance count across last 8 sessions, split by session type |
| Attendance Rate | Donut | Present / Absent / Excused / Late percentages |
| Member Growth | Bar chart | Members added to this department per month (last 6 months) |
| Gender Breakdown | Pie | Male / Female balance in the department |
| Session Type Breakdown | Donut | Regular / Training / Special / Rehearsal split |

### 3.4 — Top Attendance Leaderboard

Shows top 5 members ranked by attendance rate across regular and special sessions:

```
┌──────┬───────────────────┬─────────────┬──────────┬──────────────┐
│ Rank │ Name              │ Sessions    │ Rate     │ Streak 🔥    │
├──────┼───────────────────┼─────────────┼──────────┼──────────────┤
│  🥇  │ Ada Okafor        │  18 / 18    │  100%    │  18          │
│  🥈  │ Tunde Bello       │  17 / 18    │   94%    │  12          │
│  🥉  │ Grace Mensah      │  16 / 18    │   89%    │   8          │
│   4  │ Emeka Nwosu       │  15 / 18    │   83%    │   5          │
│   5  │ Lara Adeyemi      │  14 / 18    │   78%    │   3          │
└──────┴───────────────────┴─────────────┴──────────┴──────────────┘
```

**Streak** = consecutive sessions attended without a single miss.

### 3.5 — Top Training Leaderboard

Shows top 5 members ranked by training session attendance only:

```
┌──────┬───────────────────┬─────────────┬──────────┬──────────────┐
│ Rank │ Name              │ Trainings   │ Rate     │ Last Attended│
├──────┼───────────────────┼─────────────┼──────────┼──────────────┤
│  🥇  │ Emeka Nwosu       │   8 / 8     │  100%    │  Today       │
│  🥈  │ Lara Adeyemi      │   7 / 8     │   88%    │  3 days ago  │
│  🥉  │ Kemi Fashola      │   6 / 8     │   75%    │  1 week ago  │
└──────┴───────────────────┴─────────────┴──────────┴──────────────┘
```

### 3.6 — Absence Alert Panel

Members who have missed 3 or more consecutive sessions of any type:

```
┌───────────────────┬─────────────────┬───────────┬──────────────────────┐
│ Name              │ Last Seen       │ Missed    │ Action               │
├───────────────────┼─────────────────┼───────────┼──────────────────────┤
│ John Afolabi      │ 3 weeks ago     │ 4 in a row│ [Draft Welfare Msg]  │
│ Chioma Eze        │ 5 weeks ago     │ 6 in a row│ [Draft Welfare Msg]  │
└───────────────────┴─────────────────┴───────────┴──────────────────────┘
```

[Draft Welfare Msg] opens the Messages section with a welfare check template pre-filled. Still goes through the full approval flow.

### 3.7 — Pending Messages Panel

```
┌─────────────────────────────┬────────────┬──────────────────┬────────┐
│ Message Subject             │ Drafted By │ Stage            │ Date   │
├─────────────────────────────┼────────────┼──────────────────┼────────┤
│ Sunday Rehearsal Reminder   │ PRO        │ ⏳ Pending HOD   │ Today  │
│ Monthly Welfare Check       │ WELFARE    │ ⏳ Pending Admin │ 2d ago │
└─────────────────────────────┴────────────┴──────────────────┴────────┘
```

---

## 4. MEMBERS SECTION

This section shows **only the members of this department**. It is not the church-wide member list.

### 4.1 — Department Member List

```
Filters: Role (Member/Volunteer) | Attendance Rate | Joined Date
Search: Name | Phone (searches within department only)

┌──────────────┬──────────────────┬─────────────┬─────────────┬──────────┐
│ Photo        │ Name             │ Role        │ Attend Rate │ Actions  │
├──────────────┼──────────────────┼─────────────┼─────────────┼──────────┤
│ [avatar]     │ Ada Okafor       │ Member      │ 100%  🔥    │ View     │
│ [avatar]     │ Tunde Bello      │ Volunteer   │  94%        │ View     │
│ [avatar]     │ Chioma Eze       │ Member      │  33%  ⚠️    │ View     │
└──────────────┴──────────────────┴─────────────┴─────────────┴──────────┘

                                           [+ Add Member to Department]
```

### 4.2 — Member Detail Panel

Clicking a member opens a side panel showing their department-scoped profile:

```
┌─────────────────────────────────────────────┐
│  [Photo]  Tunde Bello                       │
│           Volunteer — Media Dept            │
│           Phone: 0812 345 6789              │
│           Joined dept: Jan 2025             │
├─────────────────────────────────────────────┤
│  ATTENDANCE SUMMARY                         │
│  Regular:  94% (17/18 sessions)             │
│  Training: 88% (7/8 sessions)               │
│  Streak: 🔥 12 sessions                     │
├─────────────────────────────────────────────┤
│  RECENT SESSIONS (last 5)                   │
│  12 Mar — Regular    ✅ PRESENT             │
│  05 Mar — Training   ✅ PRESENT             │
│  26 Feb — Regular    ❌ ABSENT              │
│  19 Feb — Special    ⚠️ EXCUSED             │
│  12 Feb — Regular    ✅ PRESENT             │
├─────────────────────────────────────────────┤
│  [Draft Message to Member]                  │
│  [Remove from Department] ← HOD/ASST only  │
└─────────────────────────────────────────────┘
```

What is visible in this panel:
- Name, phone, photo, join date in department
- Department role (Member / Volunteer)
- Attendance stats and recent session history

What is NOT visible:
- Medical records
- HR details
- Other department memberships
- Cell group memberships
- Address or emergency contacts

### 4.3 — Add Member to Department

The only time a Department User can search the full church database is when actively adding a new member:

```
Executive clicks [+ Add Member to Department]
         │
         ▼
Search panel opens — full church database search
  - Top: "3,842 total members in the church" ← read-only count
  - Search box: name or phone number
  - Real-time results (debounced 300ms)
         │
         ▼
Result card shows:
  Name | Phone | Church status badge | Current dept(s) if any
         │
         ▼
Executive selects the person
Assigns role: MEMBER or VOLUNTEER
Optional note (e.g., "Joining as keyboard player")
[Add to Department]
         │
         ▼
Person added to roster immediately
Admin notified (informational — no approval needed)
```

**If the person is not found in the church database:**
```
"No member found with this search.
 You cannot create new church members here.
 Please contact Admin or the Follow-Up team."

[Flag to Admin] → sends Admin a note about the missing person
```

### 4.4 — Remove Member (HOD / ASST_HOD only)

- Opens confirmation modal with a required reason field
- Member's church profile is completely unaffected
- Attendance history in this department is preserved
- Admin is notified of the removal

---

## 5. ATTENDANCE SECTION

### 5.1 — Session Types

| Type | Description |
|------|-------------|
| `REGULAR` | Standard department meeting |
| `TRAINING` | Skill or ministry training — feeds Training Leaderboard |
| `SPECIAL` | Church programme or special event |
| `REHEARSAL` | Practice session (Choir, Drama, Dance departments) |

### 5.2 — Sessions List Page

```
┌─────────────────┬───────────┬───────────┬──────────┬──────────┬──────────┐
│ Session Name    │ Date      │ Type      │ Present  │ Absent   │ Rate     │
├─────────────────┼───────────┼───────────┼──────────┼──────────┼──────────┤
│ Sunday Practice │ 12 Mar 26 │ Regular   │  98/142  │  44/142  │  69%     │
│ Q1 Training     │ 05 Mar 26 │ Training  │  76/142  │  66/142  │  54%     │
│ Drama Night     │ 28 Feb 26 │ Special   │ 130/142  │  12/142  │  92%     │
└─────────────────┴───────────┴───────────┴──────────┴──────────┴──────────┘

                                                    [+ Mark New Attendance]
```

### 5.3 — Mark Attendance Flow

```
Step 1 — Session Details
  Session Name, Date (default today), Type, Optional Notes

Step 2 — Attendance Sheet
  All active dept members listed alphabetically
  Default: ABSENT for all
  Toggle per person: [PRESENT] [ABSENT] [EXCUSED] [LATE]
  If EXCUSED: inline reason field appears

Step 3 — Review & Save
  Summary: X present | Y absent | Z excused | W late
  [Save Attendance] → all records created in one action
```

### 5.4 — Absence Escalation Rules

| Consecutive Absences | What Happens |
|---------------------|-------------|
| 3 in a row | Appears in Dashboard Absence Alert panel |
| 5 in a row | WELFARE officer receives in-app notification |
| 8 in a row | HOD receives in-app notification |
| 12 in a row | Admin is automatically notified |

---

## 6. MESSAGES SECTION

### 6.1 — Messages List Page

```
Tabs: Drafts | Pending Approval | Sent | Rejected

┌─────────────────────────────┬──────────────┬──────────────────┬────────────┐
│ Subject                     │ Drafted By   │ Status           │ Date       │
├─────────────────────────────┼──────────────┼──────────────────┼────────────┤
│ Rehearsal Reminder          │ PRO          │ ✅ SENT          │ 10 Mar 26  │
│ Q1 Training Schedule        │ HOD          │ ⏳ Pending Admin │ 11 Mar 26  │
│ Prayer for Bro. Emeka       │ WELFARE      │ ❌ Rejected (L1) │ 09 Mar 26  │
└─────────────────────────────┴──────────────┴──────────────────┴────────────┘

                                                      [+ New Message]
```

### 6.2 — New Message Form

```
Message Type: [ANNOUNCEMENT ▼]
Priority:     [NORMAL ▼]
Subject:      [________________________________]
Body:         [________________________________]
              [________________________________]
Recipients:   ○ All Department Members
              ○ Specific Members (select from dept list)
              ○ Absentees from Last Session

[Save Draft]   [Submit for Approval →]
```

### 6.3 — Two-Level Approval Flow

```
DRAFT
  → Anyone submits
PENDING_LEVEL1
  → HOD or ASST_HOD reviews
  → Cannot approve their own message
  → URGENT type: skips Level 1, goes directly to Admin
PENDING_ADMIN
  → Admin gives final approval or rejection
SENT
  → Delivered to selected recipients
```

Rejection at either level returns the message to the sender with the reason visible. The sender can edit and resubmit.

### 6.4 — Approval Queue (HOD / ASST_HOD only)

HOD and ASST_HOD see an additional **Approval Queue** tab in Messages showing messages from their department waiting for Level 1 review:

```
┌─────────────────────────┬──────────────┬──────────┬────────────┬────────────┐
│ Subject                 │ Submitted By │ Type     │ Date       │ Action     │
├─────────────────────────┼──────────────┼──────────┼────────────┼────────────┤
│ Saturday Rehearsal      │ PRO          │ REMINDER │ Today      │ ✅ ❌ View │
│ Welfare Check — J. Eze  │ WELFARE      │ WELFARE  │ Yesterday  │ ✅ ❌ View │
└─────────────────────────┴──────────────┴──────────┴────────────┴────────────┘
```

---

## 7. NOTIFICATIONS (Bell Icon)

The bell icon sits in the header with an unread count badge. Clicking it navigates to a **dedicated Notifications page** — a full-screen list of all notifications, not a dropdown panel.

### Notifications Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                          [Mark All Read] [Filter] │
├──────────────────────────────────────────────────────────────────┤
│  TODAY                                                           │
│  ● New member Ada Okafor added to your dept    09:14 AM  [View] │
│  ● Message "Rehearsal Reminder" was approved   08:30 AM  [View] │
├──────────────────────────────────────────────────────────────────┤
│  YESTERDAY                                                       │
│  ○ Message rejected — "Welfare Check" (L1)     04:20 PM  [View] │
│  ○ Absence alert: Chioma Eze missed 3 sessions 02:10 PM  [View] │
├──────────────────────────────────────────────────────────────────┤
│  EARLIER                                                         │
│  ○ Tunde Bello marked absent (5 in a row)      3 days ago [View]│
└──────────────────────────────────────────────────────────────────┘
● = Unread   ○ = Read
```

Notification types Department Users receive:
- New member added to their department
- Absence alert (member missed 3+ sessions)
- Message approved and sent
- Message rejected (with reason shown inline)
- Message submitted and awaiting their Level 1 review (HOD/ASST_HOD)
- Admin approved or rejected at Level 2

Clicking any notification marks it as read and navigates directly to the relevant section.

---

## 8. ROLE PERMISSION MATRIX

| Action | HOD | ASST_HOD | WELFARE | PRO |
|--------|:---:|:--------:|:-------:|:---:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View dept Members list | ✅ | ✅ | ✅ | ✅ |
| View member detail panel | ✅ | ✅ | ✅ | ✅ |
| Add member to department | ✅ | ✅ | ✅ | ✅ |
| Remove member | ✅ | ✅ | ❌ | ❌ |
| View Attendance section | ✅ | ✅ | ✅ | ❌ |
| Create attendance session | ✅ | ✅ | ✅ | ❌ |
| Mark attendance | ✅ | ✅ | ✅ | ❌ |
| View attendance history | ✅ | ✅ | ✅ | ❌ |
| Draft a message | ✅ | ✅ | ✅ | ✅ |
| Submit message for approval | ✅ | ✅ | ✅ | ✅ |
| Approve message (Level 1) | ✅ | ✅ | ❌ | ❌ |
| Send message without approval | ❌ | ❌ | ❌ | ❌ |
| View absence alerts | ✅ | ✅ | ✅ | ❌ |
| Search full church DB (when adding) | ✅ | ✅ | ✅ | ✅ |
| See other departments | ❌ | ❌ | ❌ | ❌ |
| See full church member list freely | ❌ | ❌ | ❌ | ❌ |
| Create new church members | ❌ | ❌ | ❌ | ❌ |
| Access medical records | ❌ | ❌ | ❌ | ❌ |
| Access HR records | ❌ | ❌ | ❌ | ❌ |
| Access Admin dashboard | ❌ | ❌ | ❌ | ❌ |
| Grant or revoke any access | ❌ | ❌ | ❌ | ❌ |
| Disband department | ❌ | ❌ | ❌ | ❌ |
