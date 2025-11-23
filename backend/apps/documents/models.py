"""
Documents models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User
from apps.loans.models import Application


class Document(models.Model):
    """Uploaded documents for loan applications"""
    
    DOCUMENT_TYPE_CHOICES = [
        ('identification', _('Identification')),
        ('proof_of_income', _('Proof of Income')),
        ('bank_statement', _('Bank Statement')),
        ('tax_return', _('Tax Return')),
        ('proof_of_address', _('Proof of Address')),
        ('business_license', _('Business License')),
        ('other', _('Other')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    uploader = models.ForeignKey(User, on_delete=models.CASCADE)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    file_hash = models.CharField(max_length=64)
    mime_type = models.CharField(max_length=100)
    storage_path = models.TextField()
    is_encrypted = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'documents_document'
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['uploader']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['verified']),
        ]
    
    def __str__(self):
        return f"{self.file_name} - {self.application.application_number}"


class DocumentVerification(models.Model):
    """Document verification history"""
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('verified', _('Verified')),
        ('rejected', _('Rejected')),
        ('needs_review', _('Needs Review')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='verification_history')
    status = models.CharField(max_length=50, choices=VERIFICATION_STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True)
    verified_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'documents_documentverification'
        indexes = [
            models.Index(fields=['document']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.document.file_name} - {self.status}"