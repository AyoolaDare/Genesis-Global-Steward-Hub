"""Department business logic — MessageService, LeaderboardService."""
from datetime import date

from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    DepartmentMember, DepartmentSession, AttendanceRecord,
    DepartmentMessage, MessageRecipient, DepartmentExecutive,
)


# ── Message approval service ──────────────────────────────────────────────────

class MessageService:

    @staticmethod
    def submit(message, submitted_by):
        """Move a DRAFT message into the approval pipeline."""
        if message.created_by_id != submitted_by.pk:
            raise PermissionError("You can only submit your own messages.")
        if message.approval_stage != DepartmentMessage.ApprovalStage.DRAFT:
            raise ValueError("Only DRAFT messages can be submitted.")

        # URGENT priority or type skips Level 1 and goes straight to Admin
        if message.priority == 'URGENT' or message.message_type == 'URGENT':
            message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_ADMIN
        else:
            # HOD cannot approve their own message — check if they are HOD
            exec_qs = DepartmentExecutive.objects.filter(
                department=message.department,
                system_user=submitted_by,
                is_active=True,
                role=DepartmentExecutive.Role.HOD,
            )
            if exec_qs.exists():
                # HOD submitted — check if ASST_HOD exists to handle L1
                has_asst = DepartmentExecutive.objects.filter(
                    department=message.department, is_active=True,
                    role=DepartmentExecutive.Role.ASST_HOD,
                ).exists()
                if not has_asst:
                    # Skip straight to Admin
                    message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_ADMIN
                else:
                    message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_LEVEL1
            else:
                message.approval_stage = DepartmentMessage.ApprovalStage.PENDING_LEVEL1

        message.save(update_fields=['approval_stage', 'updated_at'])
        return message

    @staticmethod
    def level1_approve(message, approved_by):
        """HOD or ASST_HOD approves at Level 1."""
        if message.created_by_id == approved_by.pk:
            raise PermissionError("You cannot approve your own message.")
        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_LEVEL1:
            raise ValueError("Message is not pending Level 1 approval.")

        message.level1_reviewed_by = approved_by
        message.level1_reviewed_at = timezone.now()
        message.approval_stage     = DepartmentMessage.ApprovalStage.PENDING_ADMIN
        message.save(update_fields=[
            'level1_reviewed_by', 'level1_reviewed_at', 'approval_stage', 'updated_at'
        ])
        return message

    @staticmethod
    def level1_reject(message, rejected_by, reason):
        """HOD or ASST_HOD rejects at Level 1."""
        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_LEVEL1:
            raise ValueError("Message is not pending Level 1 approval.")

        message.level1_reviewed_by      = rejected_by
        message.level1_reviewed_at      = timezone.now()
        message.level1_rejection_reason = reason
        message.approval_stage          = DepartmentMessage.ApprovalStage.REJECTED_L1
        message.save(update_fields=[
            'level1_reviewed_by', 'level1_reviewed_at',
            'level1_rejection_reason', 'approval_stage', 'updated_at',
        ])
        return message

    @staticmethod
    def admin_approve(message, admin_user):
        """Admin gives final approval and triggers delivery."""
        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_ADMIN:
            raise ValueError("Message is not pending Admin approval.")

        message.admin_reviewed_by = admin_user
        message.admin_reviewed_at = timezone.now()
        message.approval_stage    = DepartmentMessage.ApprovalStage.APPROVED
        message.save(update_fields=[
            'admin_reviewed_by', 'admin_reviewed_at', 'approval_stage', 'updated_at',
        ])
        MessageService._deliver(message, sent_by=admin_user)
        return message

    @staticmethod
    def admin_reject(message, admin_user, reason):
        """Admin rejects — both HOD and original sender are notified."""
        message.admin_reviewed_by      = admin_user
        message.admin_reviewed_at      = timezone.now()
        message.admin_rejection_reason = reason
        message.approval_stage         = DepartmentMessage.ApprovalStage.REJECTED_ADMIN
        message.save(update_fields=[
            'admin_reviewed_by', 'admin_reviewed_at',
            'admin_rejection_reason', 'approval_stage', 'updated_at',
        ])
        return message

    @staticmethod
    def _deliver(message, sent_by):
        """Create MessageRecipient records and mark the message SENT."""
        dept  = message.department
        scope = message.recipient_scope

        members = DepartmentMember.objects.filter(department=dept, is_active=True)

        if scope == DepartmentMessage.RecipientScope.ABSENTEES:
            last_session = dept.sessions.order_by('-session_date').first()
            if last_session:
                absent_ids = AttendanceRecord.objects.filter(
                    session=last_session, status='ABSENT'
                ).values_list('person_id', flat=True)
                members = members.filter(person_id__in=absent_ids)

        with transaction.atomic():
            if scope != DepartmentMessage.RecipientScope.SPECIFIC:
                MessageRecipient.objects.bulk_create(
                    [MessageRecipient(message=message, person=m.person) for m in members],
                    ignore_conflicts=True,
                )

            message.approval_stage = DepartmentMessage.ApprovalStage.SENT
            message.sent_at        = timezone.now()
            message.save(update_fields=['approval_stage', 'sent_at'])


# ── Leaderboard & absence service ─────────────────────────────────────────────

class LeaderboardService:

    @staticmethod
    def top_attendance(department_id, session_type=None, limit=10, months=3):
        """
        Returns top members ranked by attendance rate.
        session_type=None → all types; 'TRAINING' → training only.

        Old code called _streak() once per ranked member (N extra queries).
        Now batches all streak records in one query.
        """
        from collections import defaultdict

        cutoff   = date.today() - relativedelta(months=months)
        sessions = DepartmentSession.objects.filter(
            department_id=department_id, session_date__gte=cutoff
        )
        if session_type:
            sessions = sessions.filter(session_type=session_type)

        # Keep sessions ordered newest-first for streak calculation
        session_ids    = list(sessions.order_by('-session_date').values_list('id', flat=True))
        total_sessions = len(session_ids)

        if total_sessions == 0:
            return []

        ranked = list(
            AttendanceRecord.objects
            .filter(session_id__in=session_ids)
            .values('person_id')
            .annotate(present_count=Count('id', filter=Q(status__in=['PRESENT', 'LATE'])))
            .order_by('-present_count')[:limit]
        )
        if not ranked:
            return []

        top_ids = [r['person_id'] for r in ranked]

        # Batch-fetch all attendance for streak in one query instead of one per person
        streak_records = list(
            AttendanceRecord.objects
            .filter(person_id__in=top_ids, session_id__in=session_ids)
            .select_related('session')
            .order_by('person_id', '-session__session_date')
        )
        streak_map: dict = defaultdict(list)
        for rec in streak_records:
            streak_map[rec.person_id].append(rec)

        def _compute_streak(pid):
            count = 0
            for rec in streak_map.get(pid, []):
                if rec.status in ('PRESENT', 'LATE'):
                    count += 1
                else:
                    break
            return count

        from apps.persons.models import Person
        person_map = {p.pk: p for p in Person.objects.filter(pk__in=top_ids)}

        results = []
        for i, record in enumerate(ranked, 1):
            pid    = record['person_id']
            person = person_map.get(pid)
            if not person:
                continue
            results.append({
                'rank':          i,
                'person_id':     str(pid),
                'full_name':     person.full_name,
                'profile_photo': person.profile_photo.url if person.profile_photo else None,
                'attended':      record['present_count'],
                'total':         total_sessions,
                'rate':          round((record['present_count'] / total_sessions) * 100, 1),
                'streak':        _compute_streak(pid),
            })
        return results

    @staticmethod
    def absence_alerts(department_id, threshold=3):
        """
        Returns members with `threshold` or more consecutive absences.
        Sorted by most missed first.

        Replaces the old O(N) per-member query loop with 3 total queries:
        1. Fetch active members
        2. Fetch last 12 session IDs for the department
        3. Bulk-fetch all attendance records for those sessions + those members
        """
        members = list(
            DepartmentMember.objects.filter(
                department_id=department_id, is_active=True
            ).select_related('person')
        )
        if not members:
            return []

        # Last 12 sessions for this department (ordered newest-first)
        recent_session_ids = list(
            DepartmentSession.objects
            .filter(department_id=department_id)
            .order_by('-session_date')
            .values_list('id', flat=True)[:12]
        )
        if not recent_session_ids:
            return []

        person_ids = [m.person_id for m in members]

        # One bulk query — all attendance for these sessions × these members
        all_records = list(
            AttendanceRecord.objects
            .filter(person_id__in=person_ids, session_id__in=recent_session_ids)
            .select_related('session')
            .order_by('person_id', '-session__session_date')
        )

        # Group records by person_id (already sorted newest-first per person)
        from collections import defaultdict
        person_records: dict = defaultdict(list)
        for rec in all_records:
            person_records[rec.person_id].append(rec)

        alerts = []
        for member in members:
            recs = person_records.get(member.person_id, [])

            consecutive = 0
            for rec in recs:
                if rec.status == 'ABSENT':
                    consecutive += 1
                else:
                    break

            if consecutive >= threshold:
                last_seen = next(
                    (r.session.session_date for r in recs if r.status in ('PRESENT', 'LATE')),
                    None,
                )
                alerts.append({
                    'person_id': str(member.person_id),
                    'full_name': member.person.full_name,
                    'phone':     member.person.phone,
                    'missed':    consecutive,
                    'last_seen': str(last_seen) if last_seen else None,
                })

        return sorted(alerts, key=lambda x: x['missed'], reverse=True)

    @staticmethod
    def dashboard_stats(department):
        """
        Returns all KPI data for the department dashboard in one query pass.
        """
        today      = date.today()
        month_start = today.replace(day=1)

        active_members  = DepartmentMember.objects.filter(
            department=department, is_active=True
        )
        member_count    = active_members.count()
        new_this_month  = active_members.filter(joined_date__gte=month_start).count()

        # Last session stats
        last_session = (
            DepartmentSession.objects.filter(department=department)
            .order_by('-session_date').first()
        )
        last_session_data = None
        if last_session:
            rec_qs = AttendanceRecord.objects.filter(session=last_session)
            total  = rec_qs.count()
            present = rec_qs.filter(status__in=['PRESENT', 'LATE']).count()
            last_session_data = {
                'id':           str(last_session.pk),
                'name':         last_session.session_name,
                'date':         str(last_session.session_date),
                'type':         last_session.session_type,
                'total':        total,
                'present':      present,
                'rate':         round((present / total * 100) if total else 0, 1),
            }

        # Absences this month
        month_sessions = DepartmentSession.objects.filter(
            department=department, session_date__gte=month_start
        ).values_list('id', flat=True)
        absences_this_month = AttendanceRecord.objects.filter(
            department=department,
            session_id__in=month_sessions,
            status='ABSENT',
        ).count()

        # Critical: members with 3+ consecutive absences
        critical_count = len(LeaderboardService.absence_alerts(department.pk, threshold=3))

        # Attendance trend: last 8 sessions — one query for all records, aggregate in Python
        recent_sessions = list(
            DepartmentSession.objects.filter(department=department)
            .order_by('-session_date')[:8]
        )
        trend = []
        if recent_sessions:
            trend_session_ids = [s.pk for s in recent_sessions]
            trend_raw = list(
                AttendanceRecord.objects
                .filter(session_id__in=trend_session_ids)
                .values('session_id', 'status')
                .annotate(cnt=Count('id'))
            )
            from collections import defaultdict
            trend_lookup: dict = defaultdict(lambda: defaultdict(int))
            for row in trend_raw:
                trend_lookup[row['session_id']][row['status']] = row['cnt']

            for s in reversed(recent_sessions):
                counts = trend_lookup[s.pk]
                total  = sum(counts.values())
                trend.append({
                    'label':   f"{s.session_date.strftime('%d %b')} · {s.session_name[:12]}",
                    'date':    str(s.session_date),
                    'type':    s.session_type,
                    'total':   total,
                    'present': counts.get('PRESENT', 0),
                    'absent':  counts.get('ABSENT', 0),
                    'excused': counts.get('EXCUSED', 0),
                    'late':    counts.get('LATE', 0),
                })

        # Attendance rate donut (all time) — one query instead of five
        donut_raw = dict(
            AttendanceRecord.objects.filter(department=department)
            .values('status')
            .annotate(cnt=Count('id'))
            .values_list('status', 'cnt')
        )
        total_all = sum(donut_raw.values())
        donut = {
            'present': donut_raw.get('PRESENT', 0),
            'late':    donut_raw.get('LATE', 0),
            'excused': donut_raw.get('EXCUSED', 0),
            'absent':  donut_raw.get('ABSENT', 0),
            'total':   total_all,
            'rate':    round(
                (donut_raw.get('PRESENT', 0) + donut_raw.get('LATE', 0)) / total_all * 100
                if total_all else 0,
                1,
            ),
        }

        # Member growth: last 6 months — one query with TruncMonth instead of 6 COUNTs
        from django.db.models.functions import TruncMonth
        six_months_ago = (today - relativedelta(months=5)).replace(day=1)
        growth_raw = dict(
            active_members
            .filter(joined_date__gte=six_months_ago)
            .annotate(month=TruncMonth('joined_date'))
            .values('month')
            .annotate(cnt=Count('id'))
            .values_list('month', 'cnt')
        )
        growth = []
        for i in range(5, -1, -1):
            m_start = (today - relativedelta(months=i)).replace(day=1)
            growth.append({
                'month': m_start.strftime('%b %Y'),
                'count': growth_raw.get(m_start, 0),
            })

        # Gender breakdown
        from apps.persons.models import Person
        person_ids = active_members.values_list('person_id', flat=True)
        gender_qs  = (
            Person.objects.filter(pk__in=person_ids)
            .values('gender')
            .annotate(count=Count('id'))
        )
        gender = {g['gender'] or 'UNSPECIFIED': g['count'] for g in gender_qs}

        # Session type breakdown
        session_type_qs = (
            DepartmentSession.objects.filter(department=department)
            .values('session_type')
            .annotate(count=Count('id'))
        )
        session_types = {s['session_type']: s['count'] for s in session_type_qs}

        # Executives
        executives = list(
            department.executives.filter(is_active=True).select_related('person')
        )
        exec_data = [
            {'role': e.role, 'name': e.person.full_name, 'person_id': str(e.person_id)}
            for e in executives
        ]

        return {
            'member_count':       member_count,
            'new_this_month':     new_this_month,
            'last_session':       last_session_data,
            'absences_this_month': absences_this_month,
            'critical_absences':  critical_count,
            'session_count':      DepartmentSession.objects.filter(department=department).count(),
            'attendance_trend':   trend,
            'attendance_donut':   donut,
            'member_growth':      growth,
            'gender_breakdown':   gender,
            'session_type_breakdown': session_types,
            'executives':         exec_data,
        }
