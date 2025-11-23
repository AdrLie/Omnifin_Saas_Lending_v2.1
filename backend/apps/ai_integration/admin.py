from django.contrib import admin
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'version', 'is_active', 'created_by', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'content']
    readonly_fields = ['version', 'created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            # Check if prompt with same name exists
            existing = Prompt.objects.filter(name=obj.name)
            if existing.exists():
                latest = existing.latest('version')
                obj.version = latest.version + 1
        super().save_model(request, obj, form, change)


@admin.register(Knowledge)
class KnowledgeAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'created_by', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'is_voice_chat', 'status', 'started_at']
    list_filter = ['is_voice_chat', 'status', 'started_at']
    search_fields = ['session_id', 'user__email']
    readonly_fields = ['session_id', 'started_at', 'ended_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'sender', 'message_type', 'created_at']
    list_filter = ['sender', 'message_type', 'created_at']
    search_fields = ['conversation__session_id', 'content']
    readonly_fields = ['created_at']