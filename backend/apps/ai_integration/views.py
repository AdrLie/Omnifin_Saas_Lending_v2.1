"""
AI Integration views for Omnifin Platform
"""

from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message
from apps.ai_integration.serializers import (
    PromptSerializer, PromptCreateSerializer, KnowledgeSerializer, KnowledgeCreateSerializer,
    ConversationSerializer, ConversationCreateSerializer, MessageSerializer,
    ChatMessageSerializer, VoiceUploadSerializer
)
from apps.ai_integration.services import AIChatService, VoiceService
from apps.authentication.permissions import IsAdmin, IsSuperAdmin
import traceback
import logging

logger = logging.getLogger(__name__)


class PromptViewSet(viewsets.ModelViewSet):
    """Prompt management ViewSet"""
    permission_classes = [IsSuperAdmin]
    
    queryset = Prompt.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PromptCreateSerializer
        return PromptSerializer
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a prompt"""
        prompt = self.get_object()
        prompt.is_active = True
        prompt.save()
        return Response({'message': 'Prompt activated successfully'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a prompt"""
        prompt = self.get_object()
        prompt.is_active = False
        prompt.save()
        return Response({'message': 'Prompt deactivated successfully'})


class KnowledgeViewSet(viewsets.ModelViewSet):
    """Knowledge base management ViewSet"""
    permission_classes = [IsSuperAdmin]
    
    queryset = Knowledge.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return KnowledgeCreateSerializer
        return KnowledgeSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search knowledge base"""
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', '')
        
        knowledge = Knowledge.objects.filter(is_active=True)
        
        if query:
            knowledge = knowledge.filter(content__icontains=query)
        
        if category:
            knowledge = knowledge.filter(category=category)
        
        serializer = KnowledgeSerializer(knowledge, many=True)
        return Response(serializer.data)


class ConversationViewSet(viewsets.ModelViewSet):
    """Conversation management ViewSet"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Conversation.objects.all()
    
    def get_queryset(self):
        user = self.request.user    
        if hasattr(user, 'is_superadmin') and user.is_superadmin or hasattr(user, 'is_admin') and user.is_admin:
            return Conversation.objects.all()
        else:
            return Conversation.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'create_conversation':
            return ConversationCreateSerializer
        return ConversationSerializer
    
    @action(detail=False, methods=['post'], url_path='create')
    def create_conversation(self, request):
        """Create a new conversation (custom action)"""
        serializer = ConversationCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get conversation messages"""
        conversation = self.get_object()
        messages = Message.objects.filter(conversation=conversation).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End a conversation"""
        conversation = self.get_object()
        conversation.status = 'completed'
        conversation.ended_at = timezone.now()
        conversation.save()
        return Response({'message': 'Conversation ended successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chat_message(request):
    """Process chat message"""
    try:
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session_id = serializer.validated_data['session_id']
        message = serializer.validated_data['message']
        is_voice = serializer.validated_data.get('is_voice', False)
        context = serializer.validated_data.get('context', {})
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(
            session_id=session_id,
            defaults={
                'user': request.user,
                'is_voice_chat': is_voice
            }
        )
        
        # Process message with AI
        ai_service = AIChatService()
        response = ai_service.process_message(conversation, message, context)
        
        return Response({
            'response': response,
            'session_id': session_id,
            'conversation_id': conversation.id
        })
        
    except Exception as e:
        logger.error(f"Chat message error: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {
                'error': str(e),
                'message': 'An error occurred while processing your message. Please try again.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def voice_message(request):
    """Process voice message"""
    try:
        serializer = VoiceUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session_id = serializer.validated_data['session_id']
        audio_file = serializer.validated_data['audio_file']
        context = serializer.validated_data.get('context', {})
        
        # Convert speech to text
        voice_service = VoiceService()
        text = voice_service.speech_to_text(audio_file)
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(
            session_id=session_id,
            defaults={
                'user': request.user,
                'is_voice_chat': True
            }
        )
        
        # Process message with AI
        ai_service = AIChatService()
        response = ai_service.process_message(conversation, text, context)
        
        # Convert response to speech
        audio_response = voice_service.text_to_speech(response)
        
        return Response({
            'text': text,
            'response': response,
            'audio_response': audio_response,
            'session_id': session_id,
            'conversation_id': conversation.id
        })
        
    except Exception as e:
        logger.error(f"Voice message error: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {
                'error': str(e),
                'message': 'An error occurred while processing your voice message. Please try again.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_active_prompts(request):
    """Get active AI prompts"""
    try:
        category = request.query_params.get('category')
        
        prompts = Prompt.objects.filter(is_active=True)
        if category:
            prompts = prompts.filter(category=category)
        
        serializer = PromptSerializer(prompts, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Get active prompts error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve prompts'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_knowledge(request):
    """Get knowledge base entries"""
    try:
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        
        knowledge = Knowledge.objects.filter(is_active=True)
        
        if category:
            knowledge = knowledge.filter(category=category)
        
        if search:
            knowledge = knowledge.filter(content__icontains=search)
        
        serializer = KnowledgeSerializer(knowledge, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Get knowledge error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve knowledge base entries'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_conversation(request):
    """Create a new conversation"""
    try:
        serializer = ConversationCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        conversation = serializer.save()
        return Response(
            ConversationSerializer(conversation).data,
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        logger.error(f"Create conversation error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_conversation_history(request, session_id):
    """Get conversation history"""
    try:
        conversation = Conversation.objects.get(session_id=session_id, user=request.user)
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data)
    
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Conversation not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        logger.error(f"Get conversation history error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve conversation history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_dashboard(request):
    """Get AI dashboard data"""
    try:
        user = request.user
        
        # Filter conversations based on user role
        if hasattr(user, 'is_superadmin') and user.is_superadmin:
            conversations = Conversation.objects.all()
            messages = Message.objects.all()
        elif hasattr(user, 'is_admin') and user.is_admin:
            conversations = Conversation.objects.all()
            messages = Message.objects.all()
        else:
            conversations = Conversation.objects.filter(user=user)
            messages = Message.objects.filter(conversation__user=user)
        
        # Get conversation statistics
        total_conversations = conversations.count()
        active_conversations = conversations.filter(status='active').count()
        completed_conversations = conversations.filter(status='completed').count()
        
        # Get message statistics
        total_messages = messages.count()
        user_messages = messages.filter(sender='user').count()
        ai_messages = messages.filter(sender='assistant').count()
        
        # Get voice vs text statistics
        voice_conversations = conversations.filter(is_voice_chat=True).count()
        text_conversations = conversations.filter(is_voice_chat=False).count()
        
        data = {
            'conversations': {
                'total': total_conversations,
                'active': active_conversations,
                'completed': completed_conversations
            },
            'messages': {
                'total': total_messages,
                'user': user_messages,
                'ai': ai_messages
            },
            'chat_types': {
                'voice': voice_conversations,
                'text': text_conversations
            }
        }
        
        return Response(data)
    
    except Exception as e:
        logger.error(f"AI dashboard error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve dashboard data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )