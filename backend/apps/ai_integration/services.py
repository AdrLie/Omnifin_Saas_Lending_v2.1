"""
AI Integration Services for Omnifin Platform
"""

import openai
import requests
import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message

logger = logging.getLogger('omnifin')


class AIChatService:
    """Service for handling AI chat interactions"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.AI_MODEL
        self.conversation_cache_timeout = 3600  # 1 hour
    
    def get_active_prompts(self, category: str = None) -> List[Prompt]:
        """Get active prompts for AI interactions"""
        prompts = Prompt.objects.filter(is_active=True)
        if category:
            prompts = prompts.filter(category=category)
        return prompts.order_by('category', 'name')
    
    def get_relevant_knowledge(self, query: str, limit: int = 5) -> List[str]:
        """Get relevant knowledge base entries for context"""
        # Simple keyword matching - in production, use vector search
        knowledge_entries = Knowledge.objects.filter(
            is_active=True,
            content__icontains=query.lower()
        )[:limit]
        
        return [entry.content for entry in knowledge_entries]
    
    def create_conversation(self, user, is_voice_chat: bool = False, application_id: str = None) -> Conversation:
        """Create a new conversation session"""
        session_id = f"conv_{user.id}_{int(time.time())}"
        
        conversation = Conversation.objects.create(
            user=user,
            session_id=session_id,
            is_voice_chat=is_voice_chat,
            application_id=application_id
        )
        
        return conversation
    
    def process_message(self, conversation: Conversation, user_message: str, context: Dict[str, Any] = None) -> str:
        """Process user message and generate AI response"""
        try:
            # Save user message
            Message.objects.create(
                conversation=conversation,
                sender='user',
                content=user_message
            )
            
            # Build conversation history
            messages = self._build_conversation_history(conversation)
            
            # Add system context and prompts
            system_prompt = self._build_system_prompt(context)
            messages.insert(0, {"role": "system", "content": system_prompt})
            
            # Add relevant knowledge
            knowledge = self.get_relevant_knowledge(user_message)
            if knowledge:
                knowledge_context = "\n\nRelevant information:\n" + "\n".join(knowledge)
                messages.append({"role": "system", "content": knowledge_context})
            
            # Generate AI response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content
            
            # Save AI message
            Message.objects.create(
                conversation=conversation,
                sender='ai',
                content=ai_response
            )
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error processing AI message: {str(e)}")
            return "I apologize, but I'm having trouble processing your request. Please try again."
    
    def _build_conversation_history(self, conversation: Conversation) -> List[Dict[str, str]]:
        """Build conversation history for context"""
        messages = []
        
        # Get recent messages (last 10)
        recent_messages = conversation.messages.all().order_by('-created_at')[:10]
        
        for message in reversed(recent_messages):
            role = 'user' if message.sender == 'user' else 'assistant'
            messages.append({
                "role": role,
                "content": message.content
            })
        
        return messages
    
    def _build_system_prompt(self, context: Dict[str, Any] = None) -> str:
        """Build system prompt with context"""
        base_prompt = """You are a helpful AI loan assistant for Omnifin Platform. 
        Your role is to guide users through the loan application process, gather necessary information,
        and provide helpful information about loan options and requirements.
        
        Guidelines:
        - Be professional, friendly, and helpful
        - Ask for information in a conversational manner
        - Provide clear explanations when needed
        - Guide users through the application process step by step
        - If you don't understand something, ask for clarification
        - Never provide financial advice or make loan decisions
        """
        
        if context:
            context_str = "\n\nCurrent context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
            base_prompt += context_str
        
        return base_prompt


class VoiceService:
    """Service for handling voice interactions"""
    
    def __init__(self):
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.ultravox_api_key = settings.ULTRAVOX_API_KEY
    
    def speech_to_text(self, audio_file) -> str:
        """Convert speech to text using Ultravox"""
        try:
            # In production, integrate with Ultravox API
            # For now, return placeholder
            return "[Transcribed text from audio]"
        except Exception as e:
            logger.error(f"Error in speech to text: {str(e)}")
            raise
    
    def text_to_speech(self, text: str, voice_id: str = None) -> bytes:
        """Convert text to speech using ElevenLabs"""
        try:
            # In production, integrate with ElevenLabs API
            # For now, return placeholder
            return b"[Audio data]"
        except Exception as e:
            logger.error(f"Error in text to speech: {str(e)}")
            raise


class LoanMatchingService:
    """Service for matching applicants with suitable lenders"""
    
    def __init__(self):
        self.cache_timeout = 3600  # 1 hour
    
    def match_applicant_to_lenders(self, applicant_data: Dict[str, Any]) -> List[str]:
        """Match applicant with suitable lenders based on criteria"""
        # This would integrate with the lender matching algorithm
        # For now, return all active lenders
        from apps.loans.models import Lender
        
        suitable_lenders = Lender.objects.filter(is_active=True)
        
        # Apply basic filtering based on loan amount
        loan_amount = applicant_data.get('loan_amount', 0)
        if loan_amount:
            suitable_lenders = suitable_lenders.filter(
                minimum_loan_amount__lte=loan_amount,
                maximum_loan_amount__gte=loan_amount
            )
        
        return [lender.id for lender in suitable_lenders]
    
    def get_lender_requirements(self, lender_id: str) -> Dict[str, Any]:
        """Get requirements for a specific lender"""
        cache_key = f"lender_requirements_{lender_id}"
        cached_requirements = cache.get(cache_key)
        
        if cached_requirements:
            return cached_requirements
        
        from apps.loans.models import Lender
        
        try:
            lender = Lender.objects.get(id=lender_id)
            requirements = lender.requirements or {}
            
            cache.set(cache_key, requirements, self.cache_timeout)
            return requirements
        except Lender.DoesNotExist:
            return {}


class DocumentIntelligenceService:
    """Service for intelligent document processing"""
    
    def extract_document_info(self, document_path: str) -> Dict[str, Any]:
        """Extract information from uploaded documents"""
        # In production, integrate with document processing services
        # For now, return placeholder
        return {
            "document_type": "unknown",
            "extracted_text": "",
            "confidence": 0.0,
            "fields": {}
        }
    
    def verify_document(self, document_info: Dict[str, Any]) -> Dict[str, Any]:
        """Verify document authenticity and completeness"""
        # In production, implement document verification logic
        return {
            "is_verified": False,
            "verification_notes": "Manual verification required",
            "required_fields": [],
            "missing_fields": []
        }