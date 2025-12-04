"""
Activity serializers
"""

from rest_framework import serializers
from apps.authentication.models import UserActivity


class UserActivitySerializer(serializers.ModelSerializer):
    """User activity serializer"""
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'user_name', 'user_email', 'activity_type', 
            'activity_type_display', 'description', 'metadata', 
            'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'Unknown'


class CreateActivitySerializer(serializers.ModelSerializer):
    """Serializer for creating activity logs"""
    
    class Meta:
        model = UserActivity
        fields = ['activity_type', 'description', 'metadata']
