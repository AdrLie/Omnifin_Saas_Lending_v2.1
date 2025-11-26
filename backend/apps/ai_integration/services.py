"""
AI Integration Services for Omnifin Platform
"""

from openai import OpenAI  # ✅ CORRECT IMPORT
import requests
import json
import logging
import time
import base64
import os
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
from apps.ai_integration.models import Prompt, Knowledge, Conversation, Message

logger = logging.getLogger('omnifin')


class AIChatService:
    """Service for handling AI chat interactions"""
    
    def __init__(self):
        # ✅ NEW SYNTAX - Create OpenAI client without proxies argument
        try:
            # Remove any proxy-related environment variables that might interfere
            client_kwargs = {
                'api_key': settings.OPENAI_API_KEY
            }
            
            # Only add timeout, max_retries if needed
            # client_kwargs['timeout'] = 60.0
            # client_kwargs['max_retries'] = 2
            
            self.client = OpenAI(**client_kwargs)
            self.model = settings.AI_MODEL
            self.conversation_cache_timeout = 3600  # 1 hour
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            raise
    
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
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # ✅ NEW SYNTAX - Generate AI response using new OpenAI API
            logger.info(f"Calling OpenAI API with model: {self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            # ✅ NEW SYNTAX - Extract AI response
            ai_response = response.choices[0].message.content
            
            # Save AI message
            Message.objects.create(
                conversation=conversation,
                sender='assistant',
                content=ai_response
            )
            
            logger.info(f"Successfully processed message for conversation {conversation.id}")
            return ai_response
            
        except Exception as e:
            logger.error(f"Error processing AI message: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "I apologize, but I'm having trouble processing your request. Please try again."
    
    def _build_conversation_history(self, conversation: Conversation) -> List[Dict[str, str]]:
        """Build conversation history for context"""
        messages = []
        
        # Get recent messages (last 10)
        recent_messages = Message.objects.filter(conversation=conversation).order_by('-created_at')[:10]
        
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
        # ✅ NEW SYNTAX - Create client without proxies
        try:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
            self.ultravox_api_key = settings.ULTRAVOX_API_KEY
        except Exception as e:
            logger.error(f"Error initializing VoiceService OpenAI client: {str(e)}")
            raise
    
    def speech_to_text(self, audio_file) -> str:
        """Convert speech to text using OpenAI Whisper"""
        try:
            logger.info("Starting speech to text conversion with Whisper")
            
            audio_file.seek(0)

            file_content = audio_file.read()

            openai_file_tuple = (audio_file.name, file_content)

            # ✅ NEW SYNTAX - Use OpenAI Whisper API
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=openai_file_tuple, 
                response_format="text"
            )
            
            logger.info(f"Successfully transcribed audio")
            return transcript
            
        except Exception as e:
            # LOG THE REAL ERROR
            # Since your View catches this exception and returns a generic message,
            # you must look at your console/logs to see this specific error.
            logger.error(f"Error in speech to text: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to transcribe audio: {str(e)}") # Return actual error for debugging
    
    def text_to_speech(self, text: str, voice_id: str = None) -> str:
        """Convert text to speech using OpenAI TTS"""
        try:
            logger.info("Starting text to speech conversion")
            
            # ✅ NEW SYNTAX - Use OpenAI TTS API
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice_id or "alloy",
                input=text,
                response_format="mp3"
            )
            
            # Get audio content as bytes
            audio_bytes = response.content
            
            # Encode to base64 for transmission
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            logger.info("Successfully converted text to speech")
            return audio_base64
            
        except Exception as e:
            logger.error(f"Error in text to speech: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise Exception("Failed to generate speech. Please try again.")
    
    def text_to_speech_elevenlabs(self, text: str, voice_id: str = None) -> str:
        """Convert text to speech using ElevenLabs (alternative)"""
        try:
            if not self.elevenlabs_api_key:
                raise Exception("ElevenLabs API key not configured")
            
            logger.info("Starting text to speech conversion with ElevenLabs")
            
            default_voice_id = "21m00Tcm4TlvDq8ikWAM"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id or default_voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5
                }
            }
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                audio_base64 = base64.b64encode(response.content).decode('utf-8')
                logger.info("Successfully converted text to speech with ElevenLabs")
                return audio_base64
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"Error in text_to_speech_elevenlabs: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise


class LoanMatchingService:
    """Service for matching applicants with suitable lenders"""
    
    def __init__(self):
        self.cache_timeout = 3600
    
    def match_applicant_to_lenders(self, applicant_data: Dict[str, Any]) -> List[str]:
        """Match applicant with suitable lenders based on criteria"""
        from apps.loans.models import Lender
        
        suitable_lenders = Lender.objects.filter(is_active=True)
        
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
    
    def __init__(self):
        # ✅ NEW SYNTAX
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def extract_document_info(self, document_path: str) -> Dict[str, Any]:
        """Extract information from uploaded documents using OpenAI Vision"""
        try:
            logger.info(f"Extracting info from document: {document_path}")
            return {
                "document_type": "unknown",
                "extracted_text": "",
                "confidence": 0.0,
                "fields": {}
            }
        except Exception as e:
            logger.error(f"Error extracting document info: {str(e)}")
            return {
                "document_type": "error",
                "extracted_text": "",
                "confidence": 0.0,
                "fields": {},
                "error": str(e)
            }
    
    def verify_document(self, document_info: Dict[str, Any]) -> Dict[str, Any]:
        """Verify document authenticity and completeness"""
        return {
            "is_verified": False,
            "verification_notes": "Manual verification required",
            "required_fields": [],
            "missing_fields": []
        }


class AIAnalyticsService:
    """Service for AI-powered analytics"""
    
    def __init__(self):
        # ✅ NEW SYNTAX
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def analyze_conversation(self, conversation: Conversation) -> Dict[str, Any]:
        """Analyze conversation for insights"""
        try:
            messages = Message.objects.filter(conversation=conversation).order_by('created_at')
            
            if not messages.exists():
                return {"error": "No messages to analyze"}
            
            conversation_text = ""
            for msg in messages:
                role = "User" if msg.sender == "user" else "Assistant"
                conversation_text += f"{role}: {msg.content}\n"
            
            # ✅ NEW SYNTAX
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI that analyzes conversations and provides insights about user intent, sentiment, and key topics."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this conversation and provide:\n1. Main intent\n2. Sentiment\n3. Key topics\n4. Summary\n\nConversation:\n{conversation_text}"
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            analysis = response.choices[0].message.content
            
            return {
                "conversation_id": str(conversation.id),
                "analysis": analysis,
                "message_count": messages.count()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing conversation: {str(e)}")
            return {"error": str(e)}