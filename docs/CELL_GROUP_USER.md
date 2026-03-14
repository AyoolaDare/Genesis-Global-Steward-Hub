# CELL GROUP USER SPECIFICATION
## GG Steward — Cell Leader & Cell Lead Assistant Role, Navigation & Access

---

## 1. WHO THE CELL GROUP USER IS

A **Cell Group User** is a church member who has been assigned either the **Cell Leader** or **Cell Lead Assistant** role by Admin. The moment their role is assigned, a system login is automatically created for them. They log into the **Cell Group Hub** — a focused four-section interface scoped entirely to their assigned cell group.

### Cell Group Roles

| Role Code | Title | Level |
|-----------|-------|-------|
| `CELL_LEADER` | Cell Leader | Full control of the cell group |
| `CELL_ASST` | Cell Lead Assistant | Full access except removing members and disbanding |

Both roles share the same navigation and see the same four sections. Their differences are in specific action permissions within those sections.

Cell Group Users **only see their own cell group's data**. Nothing outside their group is visible to them.

---

## 2. NAVIGATION STRUCTURE

The Cell Group Hub has exactly **four sections**. This is the complete navigation.

```
┌──────────────────────────────────────────────────────────────────┐
│  [GG Steward]          [Group Switcher ▼]   [🔔 Bell]  [Avatar] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SIDEBAR (desktop) / BOTTOM TAB BAR (mobile):                   │
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  Dashboard  │  ← Home — group metrics, charts, activity      │
│  ├─────────────┤                                                 │
│  │  Members    │  ← Cell group members ONLY (not all church)    │
│  ├─────────────┤                                                 │
│  │  Attendance │  ← Log activities, view presence history       │
│  ├─────────────┤                                                 │
│  │  Messages   │  ← View messages sent to the group             │
│  └─────────────┘                                                 │
│                                                                  │
│  Notifications: Bell icon in header — clicking opens a dedicated │
│  full Notifications page showing all unread and past alerts     │
│  Profile: Avatar dropdown in header                             │
└──────────────────────────────────────────────────────────────────┘
```

**Important:** The **Members** section shows **only members of this cell group**. Cell Group Users cannot browse all church members freely — they can only search the full church database when actively adding a new member to the group.

**Group Switcher** appears only if the user manages more than one cell group.

---

## 3. DASHBOARD

### 3.1 — Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  Welcome back, Emeka Nwosu            Cell Leader — Zone A Team     │
│  Thursday, 12 March 2026                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 — KPI Cards

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Total Members   │ │  Active Members  │ │  New This Month  │ │  Group Status    │
│       12         │ │      11          │ │       2          │ │  ACTIVE ✅       │
│  ▲ 2 this month  │ │  1 inactive      │ │  Added by search │ │  Since Jan 2026  │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 3.3 — Charts

| Chart | Type | What It Shows |
|-------|------|--------------|
| Member Growth | Bar chart | Members added per month since group was created |
| Gender Breakdown | Pie | Male / Female split in the group |
| Member Status | Donut | Active / Inactive members |
| Activity Type Breakdown | Donut | Meeting / Outreach / Prayer / Bible Study / Other |

### 3.4 — Activity Attendance Trend

Line chart showing presence count across the last 8 logged activities:

```
X-axis: Last 8 activities (labeled by name + date)
Y-axis: Number of members present
Single line: Attendance per activity
```

### 3.5 — Recent Activity Feed

```
┌─────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY                                        │
├─────────────────────────────────────────────────────────┤
│  ✅  Emeka Nwosu added to group             2 days ago  │
│  ✅  Lara Adeyemi added to group            2 days ago  │
│  📋  Saturday Outreach logged               3 days ago  │
│  🔍  Phone search: 08034567890 — not found  4 days ago  │
│  ✅  Group created by Admin                 Jan 2026    │
└─────────────────────────────────────────────────────────┘
```

### 3.6 — Group Info Panel

```
┌──────────────────────────────────────────────────────────┐
│  GROUP DETAILS                                           │
│  Name:     Zone A Outreach Team                          │
│  Purpose:  Community outreach — Lekki Phase 1            │
│  Schedule: Every Saturday, 9:00 AM                       │
│  Location: Community Centre, Block 4                     │
│  Created:  15 January 2026                               │
│  Status:   ACTIVE                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 4. MEMBERS SECTION

This section shows **only the members of this cell group**. It is not the full church member list.

### 4.1 — Group Member List

```
Filters: Status (Active/Inactive) | Joined Date
Search: Name | Phone (searches within group only)

┌──────────────┬──────────────────┬──────────────┬─────────────┬──────────┐
│ Photo        │ Name             │ Phone        │ Joined      │ Status   │
├──────────────┼──────────────────┼──────────────┼─────────────┼──────────┤
│ [avatar]     │ Emeka Nwosu      │ 0812 345 678 │ 12 Jan 26   │ Active   │
│ [avatar]     │ Lara Adeyemi     │ 0803 456 789 │ 12 Jan 26   │ Active   │
│ [avatar]     │ Kemi Fashola     │ 0901 234 567 │ 20 Jan 26   │ Inactive │
└──────────────┴──────────────────┴──────────────┴─────────────┴──────────┘

                                              [+ Add Members to Group]
```

### 4.2 — Member Detail Panel

Clicking a member opens a side panel with group-scoped information only:

```
┌──────────────────────────────────────────────┐
│  [Photo]  Emeka Nwosu                        │
│           Active — Zone A Outreach           │
│           Phone: 0812 345 678                │
│           Joined group: 12 Jan 2026          │
├──────────────────────────────────────────────┤
│  Church Status:  MEMBER                      │
│  Added via:      Phone Search                │
├──────────────────────────────────────────────┤
│  ACTIVITY PRESENCE (last 5)                  │
│  08 Mar — Saturday Outreach  ✅ Present      │
│  01 Mar — Weekly Meeting     ✅ Present      │
│  22 Feb — Prayer Night       ✅ Present      │
│  15 Feb — Weekly Meeting     ❌ Absent       │
│  08 Feb — Saturday Outreach  ✅ Present      │
├──────────────────────────────────────────────┤
│  Presence Rate: 80% (4/5 recent activities)  │
├──────────────────────────────────────────────┤
│  [Mark Inactive]                             │
│  [Remove from Group] ← Cell Leader only     │
└──────────────────────────────────────────────┘
```

What IS visible:
- Name, phone, photo, join date
- Church status badge (MEMBER / WORKER / NEW_MEMBER)
- How they were added (phone search / Admin add)
- Presence history within this group

What is NOT visible:
- Medical records
- HR details
- Department memberships
- Other cell group memberships
- Address or emergency contacts

### 4.3 — Add Members via Phone Search (Core Feature)

```
Cell Leader/Assistant clicks [+ Add Members to Group]
         │
         ▼
Step 1 — Enter Phone Numbers
  Text area with instruction:
  "Enter phone numbers — one per line or comma separated"

  Total church members shown: "3,842 total members" ← read-only
         │
         ▼
Step 2 — Batch Lookup
  Loading: "Searching database..."
  Backend normalizes numbers and runs batch findByPhone()
         │
         ▼
Step 3 — Results Split

  ✅ FOUND (3 matches):
  ┌──────────────────┬──────────────────┬─────────────┬────────────┐
  │ Phone            │ Name             │ Status      │ Verify     │
  ├──────────────────┼──────────────────┼─────────────┼────────────┤
  │ 08012345678      │ Emeka Nwosu      │ MEMBER      │ ☑ Confirm  │
  │ 08034567890      │ Lara Adeyemi     │ MEMBER      │ ☑ Confirm  │
  │ 07056789012      │ Kemi Fashola     │ WORKER      │ ☑ Confirm  │
  └──────────────────┴──────────────────┴─────────────┴────────────┘

  ⚠ NOT FOUND (1):
  ┌──────────────────┬──────────────────────────────────────────────┐
  │ Phone            │ Action                                       │
  ├──────────────────┼──────────────────────────────────────────────┤
  │ 08098765432      │ Not in database  [Flag to Admin]             │
  └──────────────────┴──────────────────────────────────────────────┘
         │
         ▼
Step 4 — Verify Matches
  Cell Leader confirms each found result is the correct person
  Unchecking a match removes them from the add action
         │
         ▼
Step 5 — Handle Not Found
  [Flag to Admin] → sends Admin a note:
  "Cell Leader [Name] searched for [phone] — not found.
   Possible new member to register."
  Cell Group Users CANNOT create new members directly
         │
         ▼
Step 6 — Confirm Add
  [Add X Confirmed Members]
  All verified members added to group in one action
  Summary shown: who was successfully added
```

### 4.4 — Remove Member (Cell Leader only)

- Requires confirmation modal with a required reason field
- Member's church-level profile is completely unaffected
- Activity presence history is preserved
- Admin is notified

---

## 5. ATTENDANCE SECTION

Cell Groups track attendance through **Activities** — any gathering the group holds. This is separate from department-level attendance.

### 5.1 — Activity Types

| Type | Description |
|------|-------------|
| `MEETING` | Regular weekly or periodic cell gathering |
| `OUTREACH` | Community or evangelism activity |
| `PRAYER` | Dedicated prayer session |
| `BIBLE_STUDY` | Bible study session |
| `OTHER` | Any other group activity |

### 5.2 — Activities List Page

```
┌────────────────────────┬───────────┬──────────┬──────────┬──────────┐
│ Activity               │ Date      │ Type     │ Present  │ Rate     │
├────────────────────────┼───────────┼──────────┼──────────┼──────────┤
│ Saturday Outreach      │ 08 Mar 26 │ OUTREACH │   9/12   │  75%     │
│ Weekly Meeting         │ 01 Mar 26 │ MEETING  │  11/12   │  92%     │
│ Prayer Night           │ 22 Feb 26 │ PRAYER   │  12/12   │ 100%     │
└────────────────────────┴───────────┴──────────┴──────────┴──────────┘

                                               [+ Log New Activity]
```

### 5.3 — Log an Activity Flow

```
Step 1 — Activity Details
  Name, Date (default today), Type, Location, Optional Notes

Step 2 — Mark Presence
  All active group members listed
  Default: Absent for all
  Toggle per person: [PRESENT] [ABSENT]
  Optional note per person

Step 3 — Review & Save
  Summary: X present | Y absent
  [Save Activity] → all presence records created
```

### 5.4 — Activity Detail View

Clicking an activity shows the full per-member breakdown:

```
Saturday Outreach — 08 March 2026 — OUTREACH

┌──────────────────┬──────────┬────────────────────────────┐
│ Member           │ Status   │ Notes                      │
├──────────────────┼──────────┼────────────────────────────┤
│ Emeka Nwosu      │ PRESENT  │                            │
│ Lara Adeyemi     │ PRESENT  │                            │
│ Kemi Fashola     │ ABSENT   │ Travelling                 │
└──────────────────┴──────────┴────────────────────────────┘
```

---

## 6. MESSAGES SECTION

Cell Group Users can **view messages** sent to their group by Admin. They do not have an independent outbound messaging system — all official communications go through Admin.

### 6.1 — Message History View

```
┌────────────────────────────────┬─────────────┬──────────────┬────────────┐
│ Subject                        │ From        │ Date         │ Type       │
├────────────────────────────────┼─────────────┼──────────────┼────────────┤
│ Zone A Meeting Rescheduled     │ Admin       │ 10 Mar 26    │ ANNOUNCE   │
│ Outreach Schedule Q2 2026      │ Admin       │ 02 Mar 26    │ REMINDER   │
│ Prayer Focus — March           │ Admin       │ 28 Feb 26    │ PRAYER     │
└────────────────────────────────┴─────────────┴──────────────┴────────────┘
```

Clicking a message opens the full message content.

### 6.2 — What Cell Group Users CANNOT Do in Messages

- Cannot draft or send messages to group members independently
- Cannot reply to messages
- Cannot message individual members through the system
- Cannot approve or submit messages for approval

If a Cell Leader needs to communicate something to their group, they must contact Admin who will send it through the main system.

---

## 7. NOTIFICATIONS (Bell Icon)

The bell icon sits in the header with an unread count badge. Clicking it navigates to a **dedicated Notifications page** — a full-screen list, not a dropdown.

### Notifications Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                          [Mark All Read] [Filter] │
├──────────────────────────────────────────────────────────────────┤
│  TODAY                                                           │
│  ● Emeka Nwosu added to Zone A Team        10:02 AM   [View]    │
│  ● Admin sent message: "Zone A Meeting"    08:45 AM   [View]    │
├──────────────────────────────────────────────────────────────────┤
│  YESTERDAY                                                       │
│  ○ Phone flag actioned by Admin            03:30 PM   [View]    │
└──────────────────────────────────────────────────────────────────┘
● = Unread   ○ = Read
```

Notification types Cell Group Users receive:
- New member successfully added to their group
- Admin sent a message to their group
- A phone flag submitted to Admin has been actioned
- Group status changed (suspended by Admin)
- Group has been disbanded

Clicking any notification marks it as read and navigates to the relevant section.

---

## 8. CELL GROUP LIFECYCLE

| Status | Meaning | Cell User Impact |
|--------|---------|-----------------|
| `ACTIVE` | Running normally | Full access |
| `SUSPENDED` | Temporarily paused by Admin | Read-only access, cannot add members |
| `DISBANDED` | Closed by Admin | Login deactivated, notified via email |

**Only Admin can disband a group.** Cell Group Users have no disband capability.

When disbanded:
- All members' church profiles remain intact
- Activity history is preserved
- Cell Group User login is deactivated immediately

---

## 9. ROLE PERMISSION MATRIX

**Cell Leader** has full control of the cell group.
**Cell Lead Assistant** can do everything except remove members from the group.

| Action | CELL_LEADER | CELL_ASST |
|--------|:-----------:|:---------:|
| View Dashboard | ✅ | ✅ |
| View group Members list | ✅ | ✅ |
| View member detail panel | ✅ | ✅ |
| Add members via phone search | ✅ | ✅ |
| Verify and confirm found matches | ✅ | ✅ |
| Flag not-found numbers to Admin | ✅ | ✅ |
| Mark member inactive | ✅ | ✅ |
| Remove member from group | ✅ | ❌ |
| View Attendance section | ✅ | ✅ |
| Log activities | ✅ | ✅ |
| Mark presence in activities | ✅ | ✅ |
| View activity history | ✅ | ✅ |
| View Messages section | ✅ | ✅ |
| Read messages sent to group | ✅ | ✅ |
| Send/draft messages independently | ❌ | ❌ |
| View Notifications page | ✅ | ✅ |
| See total church member count | ✅ | ✅ |
| Search church DB (when adding only) | ✅ | ✅ |
| Create new church members | ❌ | ❌ |
| See other cell groups | ❌ | ❌ |
| See department data | ❌ | ❌ |
| Access medical records | ❌ | ❌ |
| Access HR records | ❌ | ❌ |
| Disband own group | ❌ | ❌ |
| Grant any access to anyone | ❌ | ❌ |
| Access Admin dashboard | ❌ | ❌ |
| Access Follow-Up queue | ❌ | ❌ |
