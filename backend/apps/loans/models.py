"""
Loans models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import ApplicantProfile, TPBProfile


class Lender(models.Model):
    """Lender/Financial Institution"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    api_endpoint = models.URLField(blank=True, null=True)
    api_key_encrypted = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    minimum_loan_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    maximum_loan_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    supported_loan_types = models.JSONField(default=dict, blank=True)
    requirements = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loans_lender'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name


class Application(models.Model):
    """Loan Application"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('submitted', _('Submitted')),
        ('under_review', _('Under Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('funded', _('Funded')),
        ('cancelled', _('Cancelled')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(ApplicantProfile, on_delete=models.CASCADE, related_name='applications')
    tpb = models.ForeignKey(TPBProfile, on_delete=models.SET_NULL, null=True, blank=True)
    application_number = models.CharField(max_length=50, unique=True)
    loan_purpose = models.CharField(max_length=100)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    loan_term = models.IntegerField(blank=True, null=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    submission_date = models.DateTimeField(blank=True, null=True)
    decision_date = models.DateTimeField(blank=True, null=True)
    funding_date = models.DateTimeField(blank=True, null=True)
    lender = models.ForeignKey(Lender, on_delete=models.SET_NULL, null=True, blank=True)
    lender_response = models.TextField(blank=True, null=True)
    ai_conversation_id = models.UUIDField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loans_application'
        indexes = [
            models.Index(fields=['applicant']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['application_number']),
        ]
    
    def __str__(self):
        return f"Application {self.application_number} - {self.applicant.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.application_number:
            self.application_number = f"APP{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class ApplicationStatusHistory(models.Model):
    """Track application status changes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'loans_applicationstatushistory'
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.application.application_number} - {self.status}"


class LoanOffer(models.Model):
    """Loan offers from lenders"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='offers')
    lender = models.ForeignKey(Lender, on_delete=models.CASCADE)
    offer_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    loan_term = models.IntegerField()
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    fees = models.JSONField(default=dict, blank=True)
    terms = models.TextField()
    expiration_date = models.DateTimeField()
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'loans_loanoffer'
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['lender']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Offer from {self.lender.name} - {self.application.application_number}"