from django.contrib import admin
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory, ApplicationProgress


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


@admin.register(ApplicationProgress)
class ApplicationProgressAdmin(admin.ModelAdmin):
    list_display = ['application', 'current_step', 'get_completion_status', 'updated_at']
    list_filter = ['current_step', 'step_1_completed', 'step_2_completed', 'step_3_completed', 'step_4_completed', 'step_5_completed']
    search_fields = ['application__application_number']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_completion_status(self, obj):
        completed = sum([
            obj.step_0_completed,
            obj.step_1_completed,
            obj.step_2_completed,
            obj.step_3_completed,
            obj.step_4_completed,
            obj.step_5_completed
        ])
        return f"{completed}/6 steps completed"
    get_completion_status.short_description = 'Progress'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('application', 'current_step', 'created_at', 'updated_at')
        }),
        ('Step 0: Application Submitted', {
            'fields': ('step_0_completed', 'step_0_completed_at', 'step_0_notes'),
            'classes': ('collapse',)
        }),
        ('Step 1: Initial Review', {
            'fields': ('step_1_completed', 'step_1_completed_at', 'step_1_completed_by', 'step_1_notes'),
            'classes': ('collapse',)
        }),
        ('Step 2: Document Verification', {
            'fields': ('step_2_completed', 'step_2_completed_at', 'step_2_completed_by', 'step_2_notes', 'step_2_documents_verified'),
            'classes': ('collapse',)
        }),
        ('Step 3: Credit Check', {
            'fields': ('step_3_completed', 'step_3_completed_at', 'step_3_completed_by', 'step_3_notes', 'step_3_credit_check_result'),
            'classes': ('collapse',)
        }),
        ('Step 4: Final Approval', {
            'fields': ('step_4_completed', 'step_4_completed_at', 'step_4_completed_by', 'step_4_notes', 'step_4_decision'),
            'classes': ('collapse',)
        }),
        ('Step 5: Funding', {
            'fields': ('step_5_completed', 'step_5_completed_at', 'step_5_completed_by', 'step_5_notes'),
            'classes': ('collapse',)
        }),
    )