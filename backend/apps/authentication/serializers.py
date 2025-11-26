"""
Authentication serializers for Omnifin Platform
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from apps.authentication.models import User, TPBProfile, ApplicantProfile


class UserSerializer(serializers.ModelSerializer):
    """Base user serializer"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Ensure first_name and last_name are empty if not provided
        if 'first_name' not in validated_data:
            validated_data['first_name'] = ''
        if 'last_name' not in validated_data:
            validated_data['last_name'] = ''
        if 'phone' not in validated_data:
            validated_data['phone'] = ''
        user = User.objects.create_user(**validated_data)
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
                 'credit_score', 'referred_by', 'created_at']


class ApplicantProfileCreateSerializer(serializers.ModelSerializer):
    """Applicant Profile creation serializer"""
    
    class Meta:
        model = ApplicantProfile
        fields = ['date_of_birth', 'ssn_last_four', 'address', 'city', 'state', 
                 'zip_code', 'country', 'employment_status', 'annual_income', 'credit_score']