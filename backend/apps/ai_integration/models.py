"""
AI Integration models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User
from apps.loans.models import Application


class Prompt(models.Model):
    """AI Prompt templates"""
    
    CATEGORY_CHOICES = [
        ('greeting', _('Greeting')),
        ('information_gathering', _('Information Gathering')),
        ('document_collection', _('Document Collection')),
        ('loan_matching', _('Loan Matching')),
        ('closing', _('Closing')),
        ('system', _('System')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    content = models.TextField()
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_prompt'
        unique_together = ['name', 'version']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} v{self.version}"


class Knowledge(models.Model):
    """AI Knowledge Base"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_knowledge'
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['title']),
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = 'Knowledge entries'
    
    def __str__(self):
        return self.title


class Conversation(models.Model):
    """AI Conversation sessions"""
    
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('completed', _('Completed')),
        ('abandoned', _('Abandoned')),
        ('error', _('Error')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    is_voice_chat = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'ai_conversation'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
            models.Index(fields=['status']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"Conversation {self.session_id} - {self.user.email}"


class Message(models.Model):
    """AI Conversation messages"""
    
    SENDER_CHOICES = [
        ('user', _('User')),
        ('ai', _('AI')),
        ('system', _('System')),
    ]
    
    MESSAGE_TYPE_CHOICES = [
        ('text', _('Text')),
        ('voice', _('Voice')),
        ('document', _('Document')),
        ('system', _('System')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    content = models.TextField()
    audio_url = models.URLField(blank=True, null=True)
    audio_duration = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_message'
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Message {self.id} - {self.conversation.session_id}"