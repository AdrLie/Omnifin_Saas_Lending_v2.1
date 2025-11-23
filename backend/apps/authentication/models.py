"""
Authentication models for Omnifin Platform
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Extended User model with role-based permissions"""
    
    ROLE_CHOICES = [
        ('applicant', _('Applicant')),
        ('tpb', _('Third-Party Broker')),
        ('admin', _('Admin')),
        ('superadmin', _('SuperAdmin')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='applicant')
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    group_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    @property
    def is_tpb(self):
        return self.role == 'tpb'
    
    @property
    def is_admin(self):
        return self.role in ['admin', 'superadmin']
    
    @property
    def is_superadmin(self):
        return self.role == 'superadmin'


class TPBProfile(models.Model):
    """Third-Party Broker Profile"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tpb_profile')
    company_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    tracking_id = models.CharField(max_length=50, unique=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payout_method = models.CharField(max_length=50, blank=True, null=True)
    bank_account_info = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'users_tpbprofile'
        indexes = [
            models.Index(fields=['tracking_id']),
        ]
    
    def __str__(self):
        return f"{self.company_name} - {self.tracking_id}"
    
    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = f"TPB{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class ApplicantProfile(models.Model):
    """Loan Applicant Profile"""
    
    EMPLOYMENT_STATUS_CHOICES = [
        ('employed', _('Employed')),
        ('self_employed', _('Self-Employed')),
        ('unemployed', _('Unemployed')),
        ('retired', _('Retired')),
        ('student', _('Student')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='applicant_profile')
    date_of_birth = models.DateField(blank=True, null=True)
    ssn_last_four = models.CharField(max_length=4, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=50, default='US')
    employment_status = models.CharField(max_length=50, choices=EMPLOYMENT_STATUS_CHOICES, blank=True, null=True)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    credit_score = models.IntegerField(blank=True, null=True)
    referred_by = models.ForeignKey(TPBProfile, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'users_applicantprofile'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Applicant"