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


class ApplicationProgress(models.Model):
    """Track application workflow progress through steps"""
    
    STEP_CHOICES = [
        (0, _('Application Submitted')),
        (1, _('Initial Review')),
        (2, _('Document Verification')),
        (3, _('Credit Check')),
        (4, _('Final Approval')),
        (5, _('Funding')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='progress')
    current_step = models.IntegerField(choices=STEP_CHOICES, default=0)
    step_0_completed = models.BooleanField(default=True)  # Auto-completed on submission
    step_0_completed_at = models.DateTimeField(auto_now_add=True)
    step_0_notes = models.TextField(blank=True, null=True)
    
    step_1_completed = models.BooleanField(default=False)
    step_1_completed_at = models.DateTimeField(blank=True, null=True)
    step_1_completed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='step_1_completions')
    step_1_notes = models.TextField(blank=True, null=True)
    
    step_2_completed = models.BooleanField(default=False)
    step_2_completed_at = models.DateTimeField(blank=True, null=True)
    step_2_completed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='step_2_completions')
    step_2_notes = models.TextField(blank=True, null=True)
    step_2_documents_verified = models.JSONField(default=dict, blank=True)  # Track which docs are verified
    
    step_3_completed = models.BooleanField(default=False)
    step_3_completed_at = models.DateTimeField(blank=True, null=True)
    step_3_completed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='step_3_completions')
    step_3_notes = models.TextField(blank=True, null=True)
    step_3_credit_check_result = models.JSONField(default=dict, blank=True)
    
    step_4_completed = models.BooleanField(default=False)
    step_4_completed_at = models.DateTimeField(blank=True, null=True)
    step_4_completed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='step_4_completions')
    step_4_notes = models.TextField(blank=True, null=True)
    step_4_decision = models.CharField(max_length=20, blank=True, null=True)  # 'approved' or 'rejected'
    
    step_5_completed = models.BooleanField(default=False)
    step_5_completed_at = models.DateTimeField(blank=True, null=True)
    step_5_completed_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='step_5_completions')
    step_5_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loans_applicationprogress'
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['current_step']),
        ]
    
    def __str__(self):
        return f"{self.application.application_number} - Step {self.current_step}"
    
    def get_step_status(self, step):
        """Get completion status for a specific step"""
        return getattr(self, f'step_{step}_completed', False)
    
    def complete_step(self, step, user=None, notes=None, **kwargs):
        """Mark a step as completed"""
        from django.utils import timezone
        
        setattr(self, f'step_{step}_completed', True)
        setattr(self, f'step_{step}_completed_at', timezone.now())
        
        if user:
            completed_by_field = f'step_{step}_completed_by'
            if hasattr(self, completed_by_field):
                setattr(self, completed_by_field, user)
        
        if notes:
            setattr(self, f'step_{step}_notes', notes)
        
        # Handle step-specific data
        for key, value in kwargs.items():
            field_name = f'step_{step}_{key}'
            if hasattr(self, field_name):
                setattr(self, field_name, value)
        
        # Auto-advance to next step if not already past it
        if self.current_step == step and step < 5:
            self.current_step = step + 1
        
        self.save()
        return True


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