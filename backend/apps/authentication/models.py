"""
Authentication models for Omnifin Platform
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as unique identifier"""
    ROLE_CHOICES = [
        ('applicant', _('Applicant')),
        ('tpb', _('Third-Party Broker')),
        ('admin', _('Admin')),
        ('superadmin', _('SuperAdmin')),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='applicant')
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    group_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self):
        """Returns the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self):
        """Returns the short name for the user."""
        return self.first_name or self.email

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


class UserActivity(models.Model):
    """Track user activities across the platform"""
    
    ACTIVITY_TYPES = [
        ('login', _('User Login')),
        ('logout', _('User Logout')),
        ('profile_update', _('Profile Updated')),
        ('loan_application', _('Loan Application Submitted')),
        ('loan_view', _('Loan Application Viewed')),
        ('loan_status_change', _('Loan Status Changed')),
        ('document_upload', _('Document Uploaded')),
        ('document_view', _('Document Viewed')),
        ('chat_message', _('Chat Message Sent')),
        ('voice_chat', _('Voice Chat Session')),
        ('payment', _('Payment Made')),
        ('commission_earned', _('Commission Earned')),
        ('user_created', _('User Account Created')),
        ('password_change', _('Password Changed')),
        ('settings_change', _('Settings Changed')),
        ('export_data', _('Data Exported')),
        ('other', _('Other Activity')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activity'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
    
    def __str__(self):
        return f"{self.user.email} - {self.get_activity_type_display()} - {self.created_at}"