from django.core.management.base import BaseCommand
from apps.sponsors.services import SponsorService


class Command(BaseCommand):
    help = 'Send monthly greeting SMS to all active sponsors.'

    def handle(self, *args, **options):
        self.stdout.write('Sending monthly greeting messages to active sponsors…')
        result = SponsorService.bulk_send_greetings()
        self.stdout.write(
            self.style.SUCCESS(
                f"Done — sent: {result['sent']}, failed: {result['failed']}, "
                f"skipped (no phone): {result['skipped']}"
            )
        )
