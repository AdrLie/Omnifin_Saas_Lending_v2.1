"""
Authentication serializers for Omnifin Platform
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from apps.authentication.models import User, TPBProfile, ApplicantProfile, Organization, InvitationCode
from django.utils import timezone


class UserSerializer(serializers.ModelSerializer):
    """Base user serializer"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'is_verified', 'mfa_enabled', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    invitation_code = serializers.CharField(required=False, allow_blank=True, help_text="Invitation code for applicants to join organization")
    organization_name = serializers.CharField(required=False, allow_blank=True, help_text="Organization name for TPB Manager registration")
    organization_description = serializers.CharField(required=False, allow_blank=True, help_text="Organization description for TPB Manager registration")
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm', 'role', 'mfa_enabled', 'invitation_code', 'organization_name', 'organization_description']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # If registering as TPB Manager, organization_name is required
        if attrs.get('role') == 'tpb_manager':
            if not attrs.get('organization_name'):
                raise serializers.ValidationError("Organization name is required for TPB Manager registration")
        
        # If registering as applicant with invitation code
        invitation_code = attrs.get('invitation_code')
        if invitation_code and attrs.get('role') == 'tpb_customer':
            try:
                inv_code = InvitationCode.objects.get(code=invitation_code)
                
                # Check if code is valid
                if inv_code.is_used:
                    raise serializers.ValidationError("This invitation code has already been used")
                
                if inv_code.is_expired:
                    raise serializers.ValidationError("This invitation code has expired")
                
                # Check if email matches (if specified)
                if inv_code.email and inv_code.email != attrs.get('email'):
                    raise serializers.ValidationError("This invitation code is for a different email address")
                
            except InvitationCode.DoesNotExist:
                raise serializers.ValidationError("Invalid invitation code")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        invitation_code = validated_data.pop('invitation_code', None)
        organization_name = validated_data.pop('organization_name', None)
        organization_description = validated_data.pop('organization_description', None)
        
        # Ensure first_name and last_name are empty if not provided
        if 'first_name' not in validated_data:
            validated_data['first_name'] = ''
        if 'last_name' not in validated_data:
            validated_data['last_name'] = ''
        if 'phone' not in validated_data:
            validated_data['phone'] = ''
        
        # If applicant is joining via invitation code, set their group_id
        if invitation_code and validated_data.get('role') == 'tpb_customer':
            inv_code = InvitationCode.objects.get(code=invitation_code)
            org = inv_code.organization
            validated_data['group_id'] = org.group_id
            
            # Mark code as used
            inv_code.is_used = True
            inv_code.used_at = timezone.now()
        
        user = User.objects.create_user(**validated_data)
        
        # If TPB Manager, create organization and assign group_id
        if user.role == 'tpb_manager' and organization_name:
            from apps.authentication.models import Organization
            user.group_id = user.id
            user.save()
            
            Organization.objects.create(
                group_id=user.group_id,
                owner=user,
                name=organization_name,
                description=organization_description or ''
            )
        
        # Mark code as used by this user
        if invitation_code:
            inv_code.used_by = user
            inv_code.save()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """User login serializer"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled')
                attrs['user'] = user
                return attrs
            else:
                raise serializers.ValidationError('Invalid email or password')
        else:
            raise serializers.ValidationError('Email and password are required')


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class TPBProfileSerializer(serializers.ModelSerializer):
    """TPB Profile serializer"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TPBProfile
        fields = ['id', 'user', 'company_name', 'license_number', 'tracking_id', 
                 'commission_rate', 'total_earnings', 'payout_method', 'created_at']
        read_only_fields = ['tracking_id', 'total_earnings']


class TPBProfileCreateSerializer(serializers.ModelSerializer):
    """TPB Profile creation serializer"""
    
    class Meta:
        model = TPBProfile
        fields = ['company_name', 'license_number', 'commission_rate', 'payout_method', 'bank_account_info']


class ApplicantProfileSerializer(serializers.ModelSerializer):
    """Applicant Profile serializer"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ApplicantProfile
        fields = ['id', 'user', 'date_of_birth', 'ssn_last_four', 'address', 'city', 
                 'state', 'zip_code', 'country', 'employment_status', 'annual_income', 
                 'credit_score', 'referred_by']


class ApplicantProfileCreateSerializer(serializers.ModelSerializer):
    """Applicant Profile creation serializer"""
    
    class Meta:
        model = ApplicantProfile
        fields = ['date_of_birth', 'ssn_last_four', 'address', 'city', 'state', 
                 'zip_code', 'country', 'employment_status', 'annual_income', 'credit_score']


class InvitationCodeSerializer(serializers.ModelSerializer):
    """Invitation Code serializer for viewing"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = InvitationCode
        fields = ['id', 'code', 'email', 'is_used', 'used_by', 'used_at', 'expires_at', 'organization_name', 'created_at', 'is_valid']
        read_only_fields = ['id', 'code', 'used_by', 'used_at', 'created_at', 'is_valid']


class InvitationCodeCreateSerializer(serializers.ModelSerializer):
    """Create invitation codes"""
    days_valid = serializers.IntegerField(write_only=True, default=7, help_text="Number of days until code expires")
    
    class Meta:
        model = InvitationCode
        fields = ['email', 'days_valid']
    
    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        
        days_valid = validated_data.pop('days_valid', 7)
        organization = self.context.get('organization')
        
        if not organization:
            raise serializers.ValidationError("Organization context required")
        
        inv_code = InvitationCode.objects.create(
            organization=organization,
            code=InvitationCode.generate_code(),
            email=validated_data.get('email'),
            expires_at=timezone.now() + timedelta(days=days_valid)
        )
        return inv_code