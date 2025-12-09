"""
Management command to clear database for fresh start
Preserves: System Admin users and Subscription Plans
Deletes: All other users, organizations, loans, invitations, subscriptions
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Clear database for fresh start (preserves system admin and subscription plans)'

    def handle(self, *args, **options):
        # Get list of system admin user IDs to preserve
        from apps.authentication.models import User
        system_admin_ids = list(User.objects.filter(role='system_admin').values_list('id', flat=True))
        self.stdout.write(f"Preserving {len(system_admin_ids)} system admin user(s)")

        # Delete in correct order due to foreign key constraints
        try:
            self.stdout.write("Deleting loan-related data...")
            from apps.loans.models import Application, ApplicationStatusHistory, ApplicationProgress, Lender, LoanOffer
            Application.objects.all().delete()
            ApplicationStatusHistory.objects.all().delete()
            ApplicationProgress.objects.all().delete()
            LoanOffer.objects.all().delete()
            Lender.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Loan data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Loan data deletion: {str(e)}"))

        try:
            self.stdout.write("Deleting document data...")
            from apps.documents.models import Document
            Document.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Document data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Document data: {str(e)}"))

        try:
            self.stdout.write("Deleting subscription data...")
            from apps.subscriptions.models import Subscription, PaymentHistory
            Subscription.objects.all().delete()
            PaymentHistory.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Subscription data deleted (plans preserved)"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Subscription data: {str(e)}"))

        try:
            self.stdout.write("Deleting authentication data...")
            from apps.authentication.models import InvitationCode, Organization, ApplicantProfile, TPBProfile
            InvitationCode.objects.all().delete()
            Organization.objects.all().delete()
            ApplicantProfile.objects.all().delete()
            TPBProfile.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Authentication data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Authentication data: {str(e)}"))

        try:
            self.stdout.write("Deleting user activity...")
            from apps.authentication.models import UserActivity
            UserActivity.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Activity logs deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Activity logs: {str(e)}"))

        try:
            self.stdout.write("Deleting non-system-admin users...")
            deleted_count, _ = User.objects.exclude(id__in=system_admin_ids).delete()
            self.stdout.write(self.style.SUCCESS(f"✓ {deleted_count} non-admin users deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ User deletion: {str(e)}"))

        try:
            self.stdout.write("Deleting AI integration data...")
            from apps.ai_integration.models import ConversationMessage
            ConversationMessage.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ AI conversation data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ AI data: {str(e)}"))

        try:
            self.stdout.write("Deleting analytics data...")
            from apps.analytics.models import ApplicationMetrics
            ApplicationMetrics.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Analytics data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Analytics data: {str(e)}"))

        try:
            self.stdout.write("Deleting commission data...")
            from apps.commissions.models import Commission
            Commission.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Commission data deleted"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Commission data: {str(e)}"))

        self.stdout.write("\n" + self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("Database cleared successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"\nPreserved:")
        self.stdout.write(f"  • {len(system_admin_ids)} System Admin user(s)")
        self.stdout.write(f"  • All Subscription Plans")
        self.stdout.write(f"\nDatabase is ready for fresh start!")
