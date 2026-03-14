# FOLLOW-UP USER SPECIFICATION
## GG Steward — Follow-Up Team Role, Navigation & Dashboard

---

## 1. WHO THE FOLLOW-UP USER IS

The **Follow-Up User** is a member of the church's pastoral outreach team. Their job is to ensure no one who enters the church system is forgotten — from first contact all the way to full integration into a department or cell group.

Follow-Up Users are assigned the `FOLLOWUP` role by Admin, which automatically creates a system login for them. They log into the **Follow-Up Hub** — a data-rich interface with full access to all member contact details, full member profiles, and a dedicated dashboard filled with outreach metrics.

---

## 2. WHAT FOLLOW-UP USERS CAN AND CANNOT SEE

### CAN SEE
- All church members — full contact details (name, phone, email, address)
- Full member profiles (status, source, join date, baptism, emergency contact)
- All new members added from any source in real time
- Their follow-up task queue — all tasks, assigned and unassigned
- Full contact log history (all attempts, outcomes, notes)
- All follow-up dashboard metrics
- Department names (for placement referral only)
- Cell group names (for placement referral only)

### CANNOT SEE
- Medical records of any member
- HR or worker employment records
- Department internal dashboards, attendance, or member-level dept data
- Cell group internal rosters or activity logs
- Admin-level settings, system users, or audit logs
- Other Follow-Up users' private notes

---

## 3. FOLLOW-UP HUB — NAVIGATION

```
┌──────────────────────────────────────────────────────────────────┐
│  [GG Steward]                           [🔔 Notifications]       │
│  Follow-Up Hub                          [Avatar] [Name]          │
├──────────────────────────────────────────────────────────────────┤
│  SIDEBAR:                                                        │
│  ▸ Dashboard        ← Metrics, pipeline, team performance       │
│  ▸ Task Queue       ← All outreach tasks — assign, log, complete│
│  ▸ All Members      ← Full member database with contact details │
│  ▸ New Members      ← Only new/uncontacted members              │
│  ▸ Contact Log      ← Full history of all contact attempts      │
│  ▸ My Profile                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. FOLLOW-UP DASHBOARD

The dashboard is the most metric-rich view in the Follow-Up Hub. Every panel answers a specific question the pastoral team needs answered daily.

### 4.1 — KPI Cards Row 1

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  New This Week   │ │  Total in Queue  │ │  Contacted Today │ │  Conversion Rate │
│       14         │ │       87         │ │        8         │ │     62%          │
│  ▲ 3 vs last wk  │ │  23 unassigned   │ │  ▲ 2 vs yest.   │ │  ▲ 4% this month │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 4.2 — KPI Cards Row 2

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Overdue Tasks   │ │  Placed in Dept  │ │  Placed in Cell  │ │  Lost/Inactive   │
│        5         │ │  This Month: 12  │ │  This Month: 8   │ │  This Month: 3   │
│  ⚠ needs action  │ │  ✅ progressing  │ │  ✅ progressing  │ │  🔴 review needed│
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 4.3 — New Member Pipeline (Funnel Chart)

The most important chart on the dashboard. Shows the full journey from first contact to integration:

```
┌──────────────────────────────────────────────────────────────────┐
│  NEW MEMBER PIPELINE — This Month                               │
│                                                                  │
│  ████████████████████████████████  47   Added to system         │
│  ████████████████████████████      38   First contact made      │
│  ████████████████████             28   Follow-up in progress    │
│  █████████████                    19   Placed in Dept or Cell   │
│  ████████                         12   Fully onboarded          │
│                                                                  │
│  Conversion Rate: 25.5%        Drop-off: 74.5%                 │
└──────────────────────────────────────────────────────────────────┘
```

**Answers:** Of everyone who enters the church system, how many do we successfully integrate?

### 4.4 — Source Breakdown (Bar Chart)

```
Medical      ████████████████  28  (48%)
Cell Group   ██████████        18  (31%)
Follow-Up    ████               8  (14%)
Admin        ██                 4   (7%)
```

**Answers:** Which touchpoint brings in the most new people?

### 4.5 — Task Status Donut

Segments: Unassigned (red) | Assigned (orange) | In Progress (blue) | Completed (green) | Closed (grey)
Center text: Total active tasks

**Answers:** What is the current workload and health of the queue?

### 4.6 — Response Rate by Day of Week (Bar Chart)

```
Monday    ████████   62%
Tuesday   ██████     48%
Wednesday ██████████ 71%
Thursday  █████████  67%
Friday    ████       35%
Saturday  ███████    54%
Sunday    █████████  69%
```

**Answers:** Which days are best for reaching out to new members?

### 4.7 — Average Time to First Contact

```
┌──────────────────────────────────────────────────────────────────┐
│  AVG TIME TO FIRST CONTACT                                      │
│                                                                  │
│  This Month:   1.4 days   ▼ improved from 2.1 days last month  │
│  This Week:    0.8 days   ✅ excellent                          │
│  Slowest case: 6 days — John Afolabi (assigned, not contacted)  │
└──────────────────────────────────────────────────────────────────┘
```

**Answers:** How quickly are we reaching new members after they appear in the system?

### 4.8 — 12-Month Integration Trend (Line Chart)

```
X-axis: Last 12 months
Y-axis: Count

Lines:
  Blue  — New members added
  Green — Placed in department
  Orange— Placed in cell group
  Red   — Lost / went inactive (dashed)
```

**Answers:** Are we getting better at integrating people over time?

### 4.9 — Team Performance Leaderboard

```
┌──────┬───────────────────┬────────────┬────────────┬─────────────┐
│ Rank │ Team Member       │ Completed  │ In Progress│ Avg Days    │
├──────┼───────────────────┼────────────┼────────────┼─────────────┤
│  🥇  │ Ada Okafor        │     24     │     3      │  1.2 days   │
│  🥈  │ Tunde Bello       │     19     │     5      │  1.8 days   │
│  🥉  │ Grace Mensah      │     15     │     4      │  2.1 days   │
└──────┴───────────────────┴────────────┴────────────┴─────────────┘
```

**Answers:** Who is most effective? Who might need support?

### 4.10 — Overdue Tasks Panel

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠ OVERDUE TASKS                                                   │
├──────────────────┬─────────────────┬─────────────┬────────────────┤
│ Person           │ Assigned To     │ Due Date    │ Days Overdue   │
├──────────────────┼─────────────────┼─────────────┼────────────────┤
│ John Afolabi     │ T. Bello        │ 06 Mar 26   │ 6 days         │
│ Chioma Eze       │ Unassigned      │ 04 Mar 26   │ 8 days         │
└──────────────────┴─────────────────┴─────────────┴────────────────┘
```

### 4.11 — New Members Alert Feed

```
┌──────────────────────────────────────────────────────────────────┐
│  🔔 RECENTLY ADDED — Needs Follow-Up                            │
├──────────────────────────────────────────────────────────────────┤
│  ⚕️  John Afolabi    added by Medical      2 hrs ago   [Assign]  │
│  🏘️  Grace Mensah   added by Cell Group   5 hrs ago   [Assign]  │
│  👤  Emeka Nwosu    added by Admin        Yesterday   [Assign]  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. TASK QUEUE

### 5.1 — Task Status Flow

```
UNASSIGNED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
```

| Status | Meaning |
|--------|---------|
| `UNASSIGNED` | Created, no team member assigned |
| `ASSIGNED` | Assigned to someone, not yet contacted |
| `IN_PROGRESS` | First contact made, follow-up continuing |
| `COMPLETED` | Member placed in dept/cell — task done |
| `CLOSED` | Member went inactive, task ended without placement |

### 5.2 — Task List View

```
Filters: Status | Priority | Assigned To | Source | Date Range
Search: Person name | Phone

┌─────────────────┬──────────────┬──────────┬──────────────┬──────────┬──────────┐
│ Person          │ Source       │ Priority │ Assigned To  │ Due Date │ Status   │
├─────────────────┼──────────────┼──────────┼──────────────┼──────────┼──────────┤
│ John Afolabi    │ Medical      │ 🔴 HIGH  │ T. Bello     │ 06 Mar   │ Overdue  │
│ Grace Mensah    │ Cell Group   │ 🟡 NORM  │ Unassigned   │ 14 Mar   │ Pending  │
│ Emeka Nwosu     │ Admin        │ 🟡 NORM  │ A. Okafor    │ 16 Mar   │ Active   │
└─────────────────┴──────────────┴──────────┴──────────────┴──────────┴──────────┘
```

### 5.3 — Task Detail & Contact Log

```
┌──────────────────────────────────────────────────────────────────┐
│  TASK — John Afolabi                        🔴 HIGH PRIORITY     │
│  Source: Medical  |  Added: 6 Mar 2026  |  Due: 10 Mar 2026     │
│  Assigned to: Tunde Bello                                        │
├──────────────────────────────────────────────────────────────────┤
│  CONTACT DETAILS                                                 │
│  Phone:   0812 345 678     Email: john@email.com                │
│  Status:  NEW_MEMBER       Source: Medical                       │
│  Address: 15 Broad Street, Lagos                                 │
├──────────────────────────────────────────────────────────────────┤
│  CONTACT LOG                                                     │
│  08 Mar, 10:14 AM — Called. No answer. Left voicemail.          │
│  07 Mar, 02:30 PM — Called. Line busy.                          │
│  ─────────────────────────────────────────────────────────────  │
│  [+ Log Contact Attempt]                                        │
├──────────────────────────────────────────────────────────────────┤
│  [Mark In Progress]    [Mark Completed]    [Close Task]          │
│  [Reassign to →]       [Place in Dept →]   [Place in Cell →]    │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 — Log a Contact Attempt

```
Contact Method: ○ Phone Call  ○ WhatsApp  ○ In-Person  ○ Email  ○ Other

Outcome:
  ○ Reached — spoke to person
  ○ No Answer
  ○ Busy / Call Failed
  ○ Wrong Number
  ○ Number Not Reachable

Notes: [free text]
Next Follow-Up Date: [date picker]

[Save Contact Log]
```

### 5.5 — Auto Priority Rules

| Condition | Auto Priority |
|-----------|--------------|
| Added from Medical | HIGH |
| In system 7+ days, no contact | HIGH |
| Normal new member (0–7 days) | NORMAL |
| Inactive 30+ days | NORMAL |
| Inactive 60+ days | HIGH |
| Admin manual override | Overrides auto |

### 5.6 — Placing a Member

```
[Place in Department] or [Place in Cell Group]
         │
         ▼
Dropdown of department or cell group names
Select destination
         │
         ▼
System logs placement in task
Marks task COMPLETED
Notifies relevant HOD or Cell Leader
Member's profile updated
```

---

## 6. ALL MEMBERS VIEW

### 6.1 — Full Member List

```
Filters: Status | Source | Joined Date | Has been contacted | Dept | Cell
Search: Name | Phone | Email

Columns: Photo | Name | Phone | Email | Status | Source | Last Contacted | Actions
```

### 6.2 — Member Detail (Follow-Up Scope)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Photo]  John Afolabi                       [NEW_MEMBER badge]  │
│           08012345678  |  john@email.com                         │
│           Added: 6 Mar 2026  |  Source: Medical                  │
├──────────────────────────────────────────────────────────────────┤
│  CONTACT DETAILS             │  FOLLOW-UP STATUS                 │
│  Address: 15 Broad St        │  Task: IN_PROGRESS                │
│  State: Lagos                │  Assigned: T. Bello               │
│  Emergency: 0803 xxx xxxx    │  Last contact: 2 days ago         │
├──────────────────────────────────────────────────────────────────┤
│  CHURCH INFO                                                     │
│  Status: NEW_MEMBER  |  Baptized: No  |  Source: Medical        │
│  Joined: 6 Mar 2026  |  Department: None  |  Cell Group: None   │
├──────────────────────────────────────────────────────────────────┤
│  CONTACT LOG (last 3 entries)                                    │
│  08 Mar — Called, no answer                                      │
│  07 Mar — Called, busy                                           │
├──────────────────────────────────────────────────────────────────┤
│  [Log Contact]   [Assign Task]   [Place in Dept/Cell]            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. NEW MEMBER CREATION (Pending Admin Approval)

```
[Register New Member]
         │
         ▼
Form:
  First Name, Last Name (required)
  Phone Number (required — duplicate check runs immediately)
  Gender, Email (optional)
  How found: Outreach / Personal Contact / Referral / Other
  Notes
         │
         ▼
[Submit for Approval]
Status set: PENDING_APPROVAL  |  Source: FOLLOWUP
Admin notified: "Follow-Up registered new member — approval needed"
         │
    ┌────┴────┐
APPROVED   REJECTED
    │           │
    ▼           ▼
NEW_MEMBER  Follow-Up user
status      notified with reason
    │
    ▼
Auto-added to Follow-Up queue
```

---

## 8. NOTIFICATIONS

Follow-Up Users receive real-time notifications:

| Event | Notification |
|-------|-------------|
| New member added (any source) | "New member [Name] added by [source] — assign a task" |
| Task overdue | "[Name]'s task is now [X] days overdue" |
| Member inactive 30 days | "[Name] has been inactive for 30 days" |
| Admin approves their submission | "Your submitted member [Name] has been approved" |
| Admin rejects their submission | "Your submitted member [Name] was rejected — [reason]" |
| Placement confirmed | "[Name] placed in [Dept/Cell name] — task completed" |

---

## 9. PERMISSIONS SUMMARY

| Action | Follow-Up User |
|--------|:--------------:|
| View all member contact details | ✅ |
| View full member profiles (within scope) | ✅ |
| View and manage task queue | ✅ |
| Log contact attempts | ✅ |
| Assign tasks to team members | ✅ |
| Place members in departments / cell groups | ✅ |
| Register new members (pending Admin approval) | ✅ |
| View all Follow-Up dashboard metrics | ✅ |
| Search full member database | ✅ |
| View department names (referral only) | ✅ |
| View cell group names (referral only) | ✅ |
| Access medical records | ❌ |
| Access HR / worker records | ❌ |
| Access department internal data | ❌ |
| Access cell group internal data | ❌ |
| Approve their own member submissions | ❌ |
| Send messages to members via the system | ❌ |
| Access Admin dashboard | ❌ |
| Access audit logs | ❌ |
| Grant or revoke any system access | ❌ |
| Access system settings | ❌ |
