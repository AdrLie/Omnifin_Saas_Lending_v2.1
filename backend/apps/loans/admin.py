from django.contrib import admin
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'applicant', 'loan_purpose', 'loan_amount', 'status', 'created_at']
    list_filter = ['status', 'loan_purpose', 'created_at']
    search_fields = ['application_number', 'applicant__user__email']
    readonly_fields = ['application_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('application_number', 'applicant', 'tpb', 'created_at', 'updated_at')
        }),
        ('Loan Details', {
            'fields': ('loan_purpose', 'loan_amount', 'loan_term', 'interest_rate')
        }),
        ('Status & Timeline', {
            'fields': ('status', 'submission_date', 'decision_date', 'funding_date')
        }),
        ('Lender Information', {
            'fields': ('lender', 'lender_response')
        }),
    )


@admin.register(Lender)
class LenderAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'commission_rate', 'minimum_loan_amount', 'maximum_loan_amount']
    list_filter = ['is_active', 'commission_rate']
    search_fields = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active')
        }),
        ('API Configuration', {
            'fields': ('api_endpoint', 'api_key_encrypted'),
            'classes': ('collapse',)
        }),
        ('Commission & Limits', {
            'fields': ('commission_rate', 'minimum_loan_amount', 'maximum_loan_amount')
        }),
        ('Loan Types & Requirements', {
            'fields': ('supported_loan_types', 'requirements')
        }),
    )


@admin.register(LoanOffer)
class LoanOfferAdmin(admin.ModelAdmin):
    list_display = ['application', 'lender', 'offer_amount', 'interest_rate', 'is_accepted', 'created_at']
    list_filter = ['is_accepted', 'created_at']
    search_fields = ['application__application_number', 'lender__name']
    readonly_fields = ['created_at']


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'status', 'changed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['application__application_number']
    readonly_fields = ['created_at']