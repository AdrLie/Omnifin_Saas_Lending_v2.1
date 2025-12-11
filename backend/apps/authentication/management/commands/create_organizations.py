"""
Management command to create organizations for TPB managers
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authentication.models import User, Organization
import uuid


class Command(BaseCommand):
    help = 'Create organizations for TPB managers that don\'t have one'

    def handle(self, *args, **options):
        tpb_managers = User.objects.filter(role='tpb_manager')
        created_count = 0
    
        for manager in tpb_managers:
            # Check if manager already has an organization
            existing_org = Organization.objects.filter(owner=manager).exists()
            if not existing_org:
                try:
                    with transaction.atomic():
                        org = Organization.objects.create(
                            group_id=uuid.uuid4(),
                            name=f"{manager.get_full_name() or manager.email}'s Organization",
                            owner=manager,
                            description=f"Organization owned by {manager.email}",
                            is_active=True
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ Created organization "{org.name}" (ID: {org.id})'
                            )
                        )
                        created_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Failed to create org for {manager.email}: {str(e)}')
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Organization already exists for {manager.email}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal organizations created: {created_count}')
        )
