"""
Analytics models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User
from apps.loans.models import Application


class Event(models.Model):
    """Analytics events tracking"""
    
    EVENT_TYPE_CHOICES = [
        ('page_view', _('Page View')),
        ('button_click', _('Button Click')),
        ('form_submit', _('Form Submit')),
        ('login', _('Login')),
        ('logout', _('Logout')),
        ('application_start', _('Application Start')),
        ('application_complete', _('Application Complete')),
        ('document_upload', _('Document Upload')),
        ('ai_interaction', _('AI Interaction')),
        ('error', _('Error')),
    ]
    
    EVENT_CATEGORY_CHOICES = [
        ('user', _('User')),
        ('application', _('Application')),
        ('document', _('Document')),
        ('ai', _('AI')),
        ('system', _('System')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    event_category = models.CharField(max_length=50, choices=EVENT_CATEGORY_CHOICES)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_event'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event_type']),
            models.Index(fields=['event_category']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.created_at}"


class AuditLog(models.Model):
    """Audit log for security and compliance"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField(blank=True, null=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_log'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['resource_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.resource_type} - {self.created_at}"