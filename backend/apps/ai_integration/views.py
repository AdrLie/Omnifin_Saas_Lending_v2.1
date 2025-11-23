"""
AI Integration views for Omnifin Platform
"""

from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message
from apps.ai_integration.serializers import (
    PromptSerializer, PromptCreateSerializer, KnowledgeSerializer, KnowledgeCreateSerializer,
    ConversationSerializer, ConversationCreateSerializer, MessageSerializer,
    ChatMessageSerializer, VoiceUploadSerializer
)
from apps.ai_integration.services import AIChatService, VoiceService
from apps.authentication.permissions import IsAdmin, IsSuperAdmin


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
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get conversation messages"""
        conversation = self.get_object()
        messages = Message.objects.filter(conversation=conversation)
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
    serializer = ChatMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    message = serializer.validated_data['message']
    is_voice = serializer.validated_data.get('is_voice', False)
    context = serializer.validated_data.get('context', {})
    
    try:
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
            'session_id': session_id
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def voice_message(request):
    """Process voice message"""
    serializer = VoiceUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    audio_file = serializer.validated_data['audio_file']
    context = serializer.validated_data.get('context', {})
    
    try:
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
            'session_id': session_id
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_active_prompts(request):
    """Get active AI prompts"""
    category = request.query_params.get('category')
    
    prompts = Prompt.objects.filter(is_active=True)
    if category:
        prompts = prompts.filter(category=category)
    
    serializer = PromptSerializer(prompts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_knowledge(request):
    """Get knowledge base entries"""
    category = request.query_params.get('category')
    search = request.query_params.get('search')
    
    knowledge = Knowledge.objects.filter(is_active=True)
    
    if category:
        knowledge = knowledge.filter(category=category)
    
    if search:
        knowledge = knowledge.filter(content__icontains=search)
    
    serializer = KnowledgeSerializer(knowledge, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_conversation(request):
    """Create a new conversation"""
    serializer = ConversationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    conversation = serializer.save()
    return Response(ConversationSerializer(conversation).data)


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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_dashboard(request):
    """Get AI dashboard data"""
    # Get conversation statistics
    total_conversations = Conversation.objects.count()
    active_conversations = Conversation.objects.filter(status='active').count()
    completed_conversations = Conversation.objects.filter(status='completed').count()
    
    # Get message statistics
    total_messages = Message.objects.count()
    user_messages = Message.objects.filter(sender='user').count()
    ai_messages = Message.objects.filter(sender='ai').count()
    
    # Get voice vs text statistics
    voice_conversations = Conversation.objects.filter(is_voice_chat=True).count()
    text_conversations = Conversation.objects.filter(is_voice_chat=False).count()
    
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