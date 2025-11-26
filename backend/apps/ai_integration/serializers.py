"""
AI Integration serializers for Omnifin Platform
"""

from rest_framework import serializers
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message


class PromptSerializer(serializers.ModelSerializer):
    """Prompt serializer"""
    
    class Meta:
        model = Prompt
        fields = ['id', 'name', 'category', 'content', 'version', 'is_active',
                 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version', 'created_at', 'updated_at']


class PromptCreateSerializer(serializers.ModelSerializer):
    """Prompt creation serializer"""
    
    class Meta:
        model = Prompt
        fields = ['name', 'category', 'content']
    
    def create(self, validated_data):
        # Check if prompt with same name exists
        existing_prompts = Prompt.objects.filter(name=validated_data['name'])
        if existing_prompts.exists():
            # Increment version
            latest_version = existing_prompts.latest('version')
            validated_data['version'] = latest_version.version + 1
        
        return Prompt.objects.create(**validated_data)


class KnowledgeSerializer(serializers.ModelSerializer):
    """Knowledge serializer"""
    
    class Meta:
        model = Knowledge
        fields = ['id', 'category', 'title', 'content', 'tags', 'is_active',
                 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class KnowledgeCreateSerializer(serializers.ModelSerializer):
    """Knowledge creation serializer"""
    
    class Meta:
        model = Knowledge
        fields = ['category', 'title', 'content', 'tags']


class MessageSerializer(serializers.ModelSerializer):
    """Message serializer"""
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'message_type', 'content',
                 'audio_url', 'audio_duration', 'created_at']
        read_only_fields = ['id', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Conversation serializer"""
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'user', 'application', 'session_id', 'is_voice_chat',
                 'status', 'started_at', 'ended_at', 'messages', 'metadata']
        read_only_fields = ['id', 'session_id', 'started_at']


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Conversation creation serializer"""
    
    class Meta:
        model = Conversation
        fields = ['application', 'is_voice_chat']
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Generate session ID
        import time
        session_id = f"conv_{user.id}_{int(time.time())}"
        
        conversation = Conversation.objects.create(
            user=user,
            session_id=session_id,
            **validated_data
        )
        
        return conversation


class ChatMessageSerializer(serializers.Serializer):
    """Chat message serializer"""
    message = serializers.CharField()
    session_id = serializers.CharField()
    is_voice = serializers.BooleanField(default=False)
    context = serializers.JSONField(required=False)


class VoiceUploadSerializer(serializers.Serializer):
    """Voice upload serializer"""
    audio_file = serializers.FileField()
    session_id = serializers.CharField()
    context = serializers.JSONField(required=False)