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
        message.save()
        return message

    @staticmethod
    def admin_approve(message, admin_user):
        """Admin gives final approval and triggers delivery."""
        if message.approval_stage != DepartmentMessage.ApprovalStage.PENDING_ADMIN:
            raise ValueError("Message is not pending Admin approval.")

        message.admin_reviewed_by = admin_user
        message.admin_reviewed_at = timezone.now()
        message.approval_stage    = DepartmentMessage.ApprovalStage.APPROVED
        message.save()
        MessageService._deliver(message, sent_by=admin_user)
        return message

    @staticmethod
    def admin_reject(message, admin_user, reason):
        """Admin rejects — both HOD and original sender are notified."""
        message.admin_reviewed_by      = admin_user
        message.admin_reviewed_at      = timezone.now()
        message.admin_rejection_reason = reason
        message.approval_stage         = DepartmentMessage.ApprovalStage.REJECTED_ADMIN
        message.save()
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
        """
        cutoff   = date.today() - relativedelta(months=months)
        sessions = DepartmentSession.objects.filter(
            department_id=department_id, session_date__gte=cutoff
        )
        if session_type:
            sessions = sessions.filter(session_type=session_type)

        session_ids    = list(sessions.values_list('id', flat=True))
        total_sessions = len(session_ids)

        if total_sessions == 0:
            return []

        records = (
            AttendanceRecord.objects
            .filter(session_id__in=session_ids)
            .values('person_id')
            .annotate(
                present_count=Count('id', filter=Q(status__in=['PRESENT', 'LATE'])),
                total_count=Count('id'),
            )
            .order_by('-present_count')[:limit]
        )

        from apps.persons.models import Person
        person_map = {
            str(p.pk): p
            for p in Person.objects.filter(
                pk__in=[r['person_id'] for r in records]
            )
        }

        results = []
        for i, record in enumerate(records, 1):
            pid    = str(record['person_id'])
            person = person_map.get(pid)
            if not person:
                continue
            results.append({
                'rank':          i,
                'person_id':     pid,
                'full_name':     person.full_name,
                'profile_photo': person.profile_photo.url if person.profile_photo else None,
                'attended':      record['present_count'],
                'total':         total_sessions,
                'rate':          round((record['present_count'] / total_sessions) * 100, 1),
                'streak':        LeaderboardService._streak(pid, session_ids),
            })
        return results

    @staticmethod
    def _streak(person_id, session_ids):
        """Count consecutive sessions attended (most recent first)."""
        records = (
            AttendanceRecord.objects
            .filter(person_id=person_id, session_id__in=session_ids)
            .select_related('session')
            .order_by('-session__session_date')
        )
        streak = 0
        for rec in records:
            if rec.status in ('PRESENT', 'LATE'):
                streak += 1
            else:
                break
        return streak

    @staticmethod
    def absence_alerts(department_id, threshold=3):
        """
        Returns members with `threshold` or more consecutive absences.
        Sorted by most missed first.
        """
        members = DepartmentMember.objects.filter(
            department_id=department_id, is_active=True
        ).select_related('person')

        alerts = []
        for member in members:
            recent = (
                AttendanceRecord.objects
                .filter(person_id=member.person_id, department_id=department_id)
                .select_related('session')
                .order_by('-session__session_date')[:12]
            )
            consecutive = 0
            for rec in recent:
                if rec.status == 'ABSENT':
                    consecutive += 1
                else:
                    break

            if consecutive >= threshold:
                last_seen = LeaderboardService._last_present(
                    member.person_id, department_id
                )
                alerts.append({
                    'person_id':  str(member.person_id),
                    'full_name':  member.person.full_name,
                    'phone':      member.person.phone,
                    'missed':     consecutive,
                    'last_seen':  str(last_seen) if last_seen else None,
                })

        return sorted(alerts, key=lambda x: x['missed'], reverse=True)

    @staticmethod
    def _last_present(person_id, department_id):
        rec = (
            AttendanceRecord.objects
            .filter(
                person_id=person_id,
                department_id=department_id,
                status__in=['PRESENT', 'LATE'],
            )
            .select_related('session')
            .order_by('-session__session_date')
            .first()
        )
        return rec.session.session_date if rec else None

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

        # Attendance trend: last 8 sessions
        recent_sessions = list(
            DepartmentSession.objects.filter(department=department)
            .order_by('-session_date')[:8]
        )
        trend = []
        for s in reversed(recent_sessions):
            recs   = AttendanceRecord.objects.filter(session=s)
            total  = recs.count()
            present = recs.filter(status__in=['PRESENT', 'LATE']).count()
            absent  = recs.filter(status='ABSENT').count()
            excused = recs.filter(status='EXCUSED').count()
            late    = recs.filter(status='LATE').count()
            trend.append({
                'label':   f"{s.session_date.strftime('%d %b')} · {s.session_name[:12]}",
                'date':    str(s.session_date),
                'type':    s.session_type,
                'total':   total,
                'present': present,
                'absent':  absent,
                'excused': excused,
                'late':    late,
            })

        # Attendance rate donut (all time)
        all_records = AttendanceRecord.objects.filter(department=department)
        total_all   = all_records.count()
        donut = {
            'present': all_records.filter(status='PRESENT').count(),
            'late':    all_records.filter(status='LATE').count(),
            'excused': all_records.filter(status='EXCUSED').count(),
            'absent':  all_records.filter(status='ABSENT').count(),
            'total':   total_all,
            'rate':    round(
                (all_records.filter(status__in=['PRESENT', 'LATE']).count() / total_all * 100)
                if total_all else 0,
                1,
            ),
        }

        # Member growth: last 6 months
        growth = []
        for i in range(5, -1, -1):
            m_start = (today - relativedelta(months=i)).replace(day=1)
            m_end   = (m_start + relativedelta(months=1))
            count   = active_members.filter(
                joined_date__gte=m_start, joined_date__lt=m_end
            ).count()
            growth.append({'month': m_start.strftime('%b %Y'), 'count': count})

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
