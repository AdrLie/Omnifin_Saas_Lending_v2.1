"""
Management command to populate group_id for existing applications
"""
from django.core.management.base import BaseCommand
from apps.loans.models import Application


class Command(BaseCommand):
    help = 'Populate group_id for existing applications from applicant user group_id'

    def handle(self, *args, **options):
        # Get all applications without group_id
        apps_to_update = Application.objects.filter(group_id__isnull=True)
        count = 0
        
        for app in apps_to_update:
            if app.applicant and app.applicant.user:
                app.group_id = app.applicant.user.group_id
                app.save()
                count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {count} applications with group_id')
        )
