from django.utils import timezone
from .models import FollowUpTask


class FollowUpService:

    @staticmethod
    def create_task(person, task_type='NEW_MEMBER_OUTREACH', triggered_by='AUTO',
                    source_id=None, created_by=None) -> FollowUpTask:
        return FollowUpTask.objects.create(
            person=person,
            task_type=task_type,
            triggered_by=triggered_by,
            source_id=source_id,
            created_by=created_by,
            status=FollowUpTask.Status.UNASSIGNED,
        )

    @staticmethod
    def assign_task(task: FollowUpTask, assigned_to, assigned_by) -> FollowUpTask:
        task.assigned_to = assigned_to
        task.assigned_at = timezone.now()
        task.status      = FollowUpTask.Status.ASSIGNED
        task.save(update_fields=['assigned_to', 'assigned_at', 'status', 'updated_at'])
        return task

    @staticmethod
    def complete_task(task: FollowUpTask, outcome: str, completed_by) -> FollowUpTask:
        task.outcome      = outcome
        task.status       = FollowUpTask.Status.COMPLETED
        task.completed_at = timezone.now()
        task.save(update_fields=['outcome', 'status', 'completed_at', 'updated_at'])
        return task
