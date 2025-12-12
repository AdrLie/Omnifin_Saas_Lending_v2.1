"""
AI Integration URLs for Omnifin Platform
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ai_integration.views import (
    PromptViewSet, KnowledgeViewSet, ConversationViewSet,
    chat_message, voice_message, get_active_prompts, get_knowledge,
    create_conversation, get_conversation_history, ai_dashboard,
    get_user_conversations, get_conversation_messages, delete_conversation
)

app_name = 'ai_integration'

router = DefaultRouter()
router.register(r'prompts', PromptViewSet)
router.register(r'knowledge', KnowledgeViewSet)
router.register(r'conversations', ConversationViewSet)

urlpatterns = [
    # Chat endpoints
    path('chat/', chat_message, name='chat_message'),
    path('voice/', voice_message, name='voice_message'),
    
    # Conversation history endpoints
    path('conversations/list/', get_user_conversations, name='user_conversations'),
    path('conversations/<uuid:conversation_id>/messages/', get_conversation_messages, name='conversation_messages'),
    path('conversations/<uuid:conversation_id>/delete/', delete_conversation, name='delete_conversation'),
    path('conversations/history/<str:session_id>/', get_conversation_history, name='conversation_history'),
    path('conversations/create/', create_conversation, name='create_conversation'),
    
    # Utility endpoints
    path('prompts/active/', get_active_prompts, name='active_prompts'),
    path('knowledge/search/', get_knowledge, name='knowledge_search'),
    
    # Dashboard
    path('dashboard/', ai_dashboard, name='ai_dashboard'),
    
    path('', include(router.urls)),
]