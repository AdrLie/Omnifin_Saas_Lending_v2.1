from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authentication.models import User


class Command(BaseCommand):
    help = 'Create a default system admin user if one does not exist'

    def handle(self, *args, **options):
        # Check if any system admin exists
        if User.objects.filter(role='system_admin').exists():
            self.stdout.write(
                self.style.SUCCESS('✓ System admin user already exists')
            )
            return

        try:
            with transaction.atomic():
                admin = User.objects.create_user(
                    email='admin@omnifin.com',
                    password='adminpassword',
                    first_name='System',
                    last_name='Administrator',
                    role='system_admin',
                    is_active=True,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created system admin user: {admin.email}'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Failed to create system admin: {str(e)}')
            )
