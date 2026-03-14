import json

from django.core.management.base import BaseCommand

from apps.notifications.providers.termii import TermiiProvider


class Command(BaseCommand):
    help = 'Check the active Termii configuration and fetch sender ID status.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sender-id',
            dest='sender_id',
            default='',
            help='Optional sender ID override to inspect.',
        )

    def handle(self, *args, **options):
        provider = TermiiProvider()
        sender_id = options.get('sender_id') or provider.sender_id

        summary = {
            'configured': provider.is_configured(),
            'base_url': provider.base_url,
            'sender_id': sender_id,
            'api_key_present': bool(provider.api_key),
        }
        self.stdout.write(self.style.NOTICE(json.dumps(summary, indent=2)))

        if not provider.api_key:
            self.stdout.write(self.style.ERROR('TERMII_API_KEY is missing.'))
            return

        try:
            status = provider.get_sender_status(sender_id=sender_id)
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Failed to query Termii: {exc}'))
            return

        if status.get('match'):
            self.stdout.write(self.style.SUCCESS('Sender ID found on Termii account.'))
        else:
            self.stdout.write(self.style.WARNING('Sender ID not found in Termii response.'))

        self.stdout.write(json.dumps(status, indent=2, default=str))
