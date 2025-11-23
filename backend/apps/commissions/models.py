"""
Commissions models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import TPBProfile
from apps.loans.models import Application


class Commission(models.Model):
    """Commission tracking for TPB referrals"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('paid', _('Paid')),
        ('cancelled', _('Cancelled')),
        ('disputed', _('Disputed')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tpb = models.ForeignKey(TPBProfile, on_delete=models.CASCADE, related_name='commissions')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='commissions')
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    calculated_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'commissions_commission'
        indexes = [
            models.Index(fields=['tpb']),
            models.Index(fields=['status']),
            models.Index(fields=['calculated_at']),
        ]
    
    def __str__(self):
        return f"Commission {self.id} - {self.tpb.company_name} - {self.commission_amount}"


class Payout(models.Model):
    """TPB Payout batches"""
    
    STATUS_CHOICES = [
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tpb = models.ForeignKey(TPBProfile, on_delete=models.CASCADE, related_name='payouts')
    payout_batch_id = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_count = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'commissions_payout'
        indexes = [
            models.Index(fields=['tpb']),
            models.Index(fields=['payout_batch_id']),
            models.Index(fields=['status']),
            models.Index(fields=['initiated_at']),
        ]
    
    def __str__(self):
        return f"Payout {self.payout_batch_id} - {self.tpb.company_name} - {self.total_amount}"


class CommissionRule(models.Model):
    """Commission calculation rules"""
    
    TRIGGER_CHOICES = [
        ('application_submitted', _('Application Submitted')),
        ('application_approved', _('Application Approved')),
        ('loan_funded', _('Loan Funded')),
        ('loan_repaid', _('Loan Repaid')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)
    minimum_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    maximum_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commissions_commissionrule'
        indexes = [
            models.Index(fields=['trigger_event']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.trigger_event}"