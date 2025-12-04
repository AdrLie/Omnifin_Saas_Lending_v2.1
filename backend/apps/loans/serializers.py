"""
Loans serializers for Omnifin Platform
"""

from rest_framework import serializers
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory, ApplicationProgress
from apps.authentication.models import User


class LenderSerializer(serializers.ModelSerializer):
    """Lender serializer"""
    
    class Meta:
        model = Lender
        fields = ['id', 'name', 'api_endpoint', 'is_active', 'commission_rate',
                 'minimum_loan_amount', 'maximum_loan_amount', 'supported_loan_types',
                 'requirements', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LenderCreateSerializer(serializers.ModelSerializer):
    """Lender creation serializer"""
    
    class Meta:
        model = Lender
        fields = ['name', 'api_endpoint', 'api_key', 'commission_rate',
                 'minimum_loan_amount', 'maximum_loan_amount', 'supported_loan_types',
                 'requirements']
    
    def create(self, validated_data):
        # Encrypt API key
        api_key = validated_data.pop('api_key', None)
        if api_key:
            validated_data['api_key_encrypted'] = api_key  # In production, use proper encryption
        
        return Lender.objects.create(**validated_data)


class ApplicationSerializer(serializers.ModelSerializer):
    """Application serializer"""
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    applicant_phone = serializers.SerializerMethodField()
    credit_score = serializers.SerializerMethodField()
    annual_income = serializers.SerializerMethodField()
    tpb_name = serializers.SerializerMethodField()
    lender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = ['id', 'application_number', 'applicant', 'applicant_name', 'applicant_email',
                 'applicant_phone', 'credit_score', 'annual_income', 'tpb', 'tpb_name',
                 'loan_purpose', 'loan_amount', 'loan_term', 'interest_rate', 'status',
                 'submission_date', 'decision_date', 'funding_date', 'lender', 'lender_name',
                 'lender_response', 'created_at', 'updated_at']
        read_only_fields = ['id', 'application_number', 'created_at', 'updated_at']
    
    def get_applicant_name(self, obj):
        return obj.applicant.user.get_full_name() if obj.applicant else None
    
    def get_applicant_email(self, obj):
        return obj.applicant.user.email if obj.applicant else None
    
    def get_applicant_phone(self, obj):
        return obj.applicant.user.phone if obj.applicant else None
    
    def get_credit_score(self, obj):
        return obj.applicant.credit_score if obj.applicant else None
    
    def get_annual_income(self, obj):
        return obj.applicant.annual_income if obj.applicant else None
    
    def get_tpb_name(self, obj):
        return obj.tpb.company_name if obj.tpb else None
    
    def get_lender_name(self, obj):
        return obj.lender.name if obj.lender else None


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Application creation serializer"""
    
    class Meta:
        model = Application
        fields = ['loan_purpose', 'loan_amount', 'loan_term', 'interest_rate']
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Ensure user has applicant profile
        if not hasattr(user, 'applicant_profile'):
            raise serializers.ValidationError("User must have an applicant profile to apply for loans")
        
        applicant = user.applicant_profile
        
        # Get TPB if user was referred
        tpb = None
        if hasattr(applicant, 'referred_by') and applicant.referred_by:
            tpb = applicant.referred_by
        
        application = Application.objects.create(
            applicant=applicant,
            tpb=tpb,
            **validated_data
        )
        
        return application


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """Application status update serializer"""
    
    class Meta:
        model = Application
        fields = ['status']


class LoanOfferSerializer(serializers.ModelSerializer):
    """Loan offer serializer"""
    
    class Meta:
        model = LoanOffer
        fields = ['id', 'application', 'lender', 'offer_amount', 'interest_rate',
                 'loan_term', 'monthly_payment', 'fees', 'terms', 'expiration_date',
                 'is_accepted', 'created_at']
        read_only_fields = ['id', 'created_at']


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    """Application status history serializer"""
    
    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'application', 'status', 'notes', 'changed_by', 'created_at']
        read_only_fields = ['id', 'created_at']


class ApplicationProgressSerializer(serializers.ModelSerializer):
    """Application progress serializer"""
    application_number = serializers.CharField(source='application.application_number', read_only=True)
    steps = serializers.SerializerMethodField()
    
    class Meta:
        model = ApplicationProgress
        fields = [
            'id', 'application', 'application_number', 'current_step', 'steps',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_steps(self, obj):
        """Return detailed step information"""
        steps = []
        for i in range(6):
            step_data = {
                'step': i,
                'completed': obj.get_step_status(i),
                'completed_at': getattr(obj, f'step_{i}_completed_at', None),
                'notes': getattr(obj, f'step_{i}_notes', None),
            }
            
            # Add step-specific fields
            if i == 2:
                step_data['documents_verified'] = obj.step_2_documents_verified
            elif i == 3:
                step_data['credit_check_result'] = obj.step_3_credit_check_result
            elif i == 4:
                step_data['decision'] = obj.step_4_decision
            
            # Add completed_by info
            completed_by_field = f'step_{i}_completed_by'
            if hasattr(obj, completed_by_field):
                completed_by = getattr(obj, completed_by_field)
                if completed_by:
                    step_data['completed_by'] = {
                        'id': completed_by.id,
                        'name': completed_by.get_full_name(),
                        'email': completed_by.email
                    }
            
            steps.append(step_data)
        
        return steps


class StepCompletionSerializer(serializers.Serializer):
    """Serializer for completing a step"""
    step = serializers.IntegerField(min_value=0, max_value=5)
    notes = serializers.CharField(required=False, allow_blank=True)
    documents_verified = serializers.JSONField(required=False)
    credit_check_result = serializers.JSONField(required=False)
    decision = serializers.ChoiceField(choices=['approved', 'rejected'], required=False)
    
    def validate_step(self, value):
        if value == 0:
            raise serializers.ValidationError("Step 0 is auto-completed on submission")
        return value