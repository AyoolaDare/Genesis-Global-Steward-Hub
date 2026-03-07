from django.utils import timezone


class SoftDeleteMixin:
    """Mixin to override destroy() with soft delete."""

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['deleted_at'])
