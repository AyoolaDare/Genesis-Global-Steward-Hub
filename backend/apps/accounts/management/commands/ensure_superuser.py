from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create or update a superuser from env vars.'

    def handle(self, *args, **options):
        from decouple import config
        from apps.accounts.models import SystemUser

        email = config('SUPERUSER_EMAIL', default='').strip().lower()
        username = config('SUPERUSER_USERNAME', default='').strip()
        password = config('SUPERUSER_PASSWORD', default='')

        if not email or not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    'Skipping superuser bootstrap: set SUPERUSER_EMAIL, SUPERUSER_USERNAME, SUPERUSER_PASSWORD.'
                )
            )
            return

        user, created = SystemUser.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            },
        )

        changed = False
        if user.username != username:
            user.username = username
            changed = True
        if user.role != 'ADMIN':
            user.role = 'ADMIN'
            changed = True
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True

        user.set_password(password)
        changed = True

        if changed:
            user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {email}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Superuser updated: {email}'))
