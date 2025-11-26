from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.authentication.models import User, TPBProfile, ApplicantProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'created_at']
    list_filter = ['role', 'is_active', 'is_verified', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'is_verified', 'group_id', 'created_by')
        }),
    )


@admin.register(TPBProfile)
class TPBProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'tracking_id', 'commission_rate', 'total_earnings']
    search_fields = ['user__email', 'company_name', 'tracking_id']
    list_filter = ['commission_rate']


@admin.register(ApplicantProfile)
class ApplicantProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'employment_status', 'annual_income', 'credit_score', 'referred_by']
    search_fields = ['user__email', 'employment_status']
    list_filter = ['employment_status', 'referred_by']