"""
Documents Services for Omnifin Platform
"""

import os
import uuid
import hashlib
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from apps.documents.models import Document, DocumentVerification
from apps.authentication.models import User
from apps.loans.models import Application

logger = logging.getLogger('omnifin')


class DocumentService:
    """Service for managing documents"""
    
    def __init__(self):
        self.allowed_file_types = settings.ALLOWED_FILE_TYPES
        self.max_file_size = settings.MAX_UPLOAD_SIZE
    
    def upload_document(self, file, application: Application, uploader: User, document_type: str) -> Document:
        """Upload and store a document"""
        try:
            # Validate file
            self._validate_file(file)
            
            # Generate file hash
            file_hash = self._generate_file_hash(file)
            
            # Check for duplicate
            existing_doc = Document.objects.filter(
                application=application,
                file_hash=file_hash
            ).first()
            
            if existing_doc:
                logger.info(f"Duplicate document detected for application {application.application_number}")
                return existing_doc
            
            # Generate storage path
            storage_path = self._generate_storage_path(application, file.name)
            
            # Save file
            saved_path = default_storage.save(storage_path, ContentFile(file.read()))
            
            # Create document record
            document = Document.objects.create(
                application=application,
                uploader=uploader,
                document_type=document_type,
                file_name=file.name,
                file_size=file.size,
                file_hash=file_hash,
                mime_type=file.content_type or 'application/octet-stream',
                storage_path=saved_path,
                is_encrypted=True
            )
            
            logger.info(f"Uploaded document {document.file_name} for application {application.application_number}")
            return document
            
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            raise
    
    def _validate_file(self, file):
        """Validate uploaded file"""
        # Check file size
        if file.size > self.max_file_size:
            raise ValueError(f"File size exceeds maximum allowed size of {self.max_file_size} bytes")
        
        # Check file type
        if file.content_type not in self.allowed_file_types:
            raise ValueError(f"File type {file.content_type} is not allowed")
    
    def _generate_file_hash(self, file) -> str:
        """Generate SHA-256 hash of file content"""
        hasher = hashlib.sha256()
        for chunk in file.chunks():
            hasher.update(chunk)
        return hasher.hexdigest()
    
    def _generate_storage_path(self, application: Application, filename: str) -> str:
        """Generate secure storage path for document"""
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        return f"documents/{application.application_number}/{unique_filename}"
    
    def get_application_documents(self, application: Application) -> List[Document]:
        """Get all documents for an application"""
        return Document.objects.filter(application=application).order_by('-uploaded_at')
    
    def get_documents_by_type(self, application: Application, document_type: str) -> List[Document]:
        """Get documents of specific type for an application"""
        return Document.objects.filter(
            application=application,
            document_type=document_type
        ).order_by('-uploaded_at')
    
    def delete_document(self, document: Document) -> bool:
        """Delete a document"""
        try:
            # Delete file from storage
            if default_storage.exists(document.storage_path):
                default_storage.delete(document.storage_path)
            
            # Delete document record
            document.delete()
            
            logger.info(f"Deleted document {document.file_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False


class DocumentVerificationService:
    """Service for document verification"""
    
    def verify_document(self, document: Document, verified_by: User, status: str, notes: str = None) -> DocumentVerification:
        """Verify a document"""
        try:
            # Create verification record
            verification = DocumentVerification.objects.create(
                document=document,
                status=status,
                notes=notes,
                verified_by=verified_by
            )
            
            # Update document status
            document.verified = (status == 'verified')
            document.verified_by = verified_by
            document.verified_at = timezone.now()
            document.save()
            
            logger.info(f"Verified document {document.file_name} with status {status}")
            return verification
            
        except Exception as e:
            logger.error(f"Error verifying document: {str(e)}")
            raise
    
    def get_verification_history(self, document: Document) -> List[DocumentVerification]:
        """Get verification history for a document"""
        return DocumentVerification.objects.filter(document=document).order_by('-created_at')
    
    def get_pending_verifications(self) -> List[Document]:
        """Get documents pending verification"""
        return Document.objects.filter(verified=False).order_by('-uploaded_at')


class DocumentIntelligenceService:
    """Service for intelligent document processing"""
    
    def extract_document_info(self, document: Document) -> Dict[str, Any]:
        """Extract information from document using AI"""
        try:
            # In production, integrate with document AI services
            # For now, return placeholder data
            
            extraction_result = {
                'document_type': document.document_type,
                'confidence': 0.85,
                'extracted_fields': {},
                'validation_issues': [],
                'recommendations': []
            }
            
            # Simulate extraction based on document type
            if document.document_type == 'identification':
                extraction_result['extracted_fields'] = {
                    'document_number': '***-**-****',
                    'expiry_date': '2025-12-31',
                    'issuing_country': 'US'
                }
            elif document.document_type == 'proof_of_income':
                extraction_result['extracted_fields'] = {
                    'employer': 'Sample Employer Inc.',
                    'annual_income': '$50,000',
                    'pay_period': 'Monthly'
                }
            
            return extraction_result
            
        except Exception as e:
            logger.error(f"Error extracting document info: {str(e)}")
            return {
                'document_type': document.document_type,
                'confidence': 0.0,
                'extracted_fields': {},
                'validation_issues': ['Extraction failed'],
                'recommendations': ['Manual review required']
            }
    
    def validate_document_completeness(self, application: Application) -> Dict[str, Any]:
        """Validate that all required documents are present"""
        try:
            required_documents = {
                'identification': 1,
                'proof_of_income': 1,
                'proof_of_address': 1
            }
            
            uploaded_documents = Document.objects.filter(application=application)
            
            validation_result = {
                'is_complete': True,
                'missing_documents': [],
                'document_summary': {},
                'completion_percentage': 0
            }
            
            # Count documents by type
            doc_counts = {}
            for doc in uploaded_documents:
                doc_type = doc.document_type
                doc_counts[doc_type] = doc_counts.get(doc_type, 0) + 1
            
            # Check for missing documents
            for doc_type, required_count in required_documents.items():
                uploaded_count = doc_counts.get(doc_type, 0)
                validation_result['document_summary'][doc_type] = {
                    'required': required_count,
                    'uploaded': uploaded_count,
                    'verified': Document.objects.filter(
                        application=application,
                        document_type=doc_type,
                        verified=True
                    ).count()
                }
                
                if uploaded_count < required_count:
                    validation_result['missing_documents'].append(doc_type)
                    validation_result['is_complete'] = False
            
            # Calculate completion percentage
            total_required = sum(required_documents.values())
            total_uploaded = sum(doc_counts.values())
            validation_result['completion_percentage'] = min(100, (total_uploaded / total_required) * 100)
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating document completeness: {str(e)}")
            return {
                'is_complete': False,
                'missing_documents': ['validation_error'],
                'document_summary': {},
                'completion_percentage': 0
            }