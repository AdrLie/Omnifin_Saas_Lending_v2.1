"""
AI Integration URLs for Omnifin Platform
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ai_integration.views import (
    PromptViewSet, KnowledgeViewSet, ConversationViewSet,
    chat_message, voice_message, get_active_prompts, get_knowledge,
    create_conversation, get_conversation_history, ai_dashboard
)

app_name = 'ai_integration'

router = DefaultRouter()
router.register(r'prompts', PromptViewSet)
router.register(r'knowledge', KnowledgeViewSet)
router.register(r'conversations', ConversationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Chat endpoints
    path('chat/', chat_message, name='chat_message'),
    path('voice/', voice_message, name='voice_message'),
    
    # Utility endpoints
    path('prompts/active/', get_active_prompts, name='active_prompts'),
    path('knowledge/search/', get_knowledge, name='knowledge_search'),
    path('conversations/create/', create_conversation, name='create_conversation'),
    path('conversations/history/<str:session_id>/', get_conversation_history, name='conversation_history'),
    
    # Dashboard
    path('dashboard/', ai_dashboard, name='ai_dashboard'),
]