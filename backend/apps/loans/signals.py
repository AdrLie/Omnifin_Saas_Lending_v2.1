"""
Signals for loans app
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.loans.models import Application, ApplicationProgress


@receiver(post_save, sender=Application)
def create_application_progress(sender, instance, created, **kwargs):
    """Create ApplicationProgress when a new Application is created"""
    if created:
        ApplicationProgress.objects.create(application=instance)
