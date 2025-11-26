"""
Loans Services for Omnifin Platform
"""

import uuid
import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory
from apps.authentication.models import User, ApplicantProfile, TPBProfile
from apps.ai_integration.services import LoanMatchingService

logger = logging.getLogger('omnifin')


class ApplicationService:
    """Service for managing loan applications"""
    
    def create_application(self, applicant: ApplicantProfile, loan_data: Dict[str, Any], tpb: TPBProfile = None) -> Application:
        """Create a new loan application"""
        try:
            application = Application.objects.create(
                applicant=applicant,
                tpb=tpb,
                loan_purpose=loan_data['loan_purpose'],
                loan_amount=Decimal(str(loan_data['loan_amount'])),
                loan_term=loan_data.get('loan_term'),
                interest_rate=loan_data.get('interest_rate')
            )
            
            # Create initial status history
            ApplicationStatusHistory.objects.create(
                application=application,
                status='pending',
                notes='Application created'
            )
            
            logger.info(f"Created application {application.application_number} for applicant {applicant.user.email}")
            return application
            
        except Exception as e:
            logger.error(f"Error creating application: {str(e)}")
            raise
    
    def submit_application(self, application: Application) -> bool:
        """Submit application to lenders"""
        try:
            # Update application status
            application.status = 'submitted'
            application.submission_date = timezone.now()
            application.save()
            
            # Create status history
            ApplicationStatusHistory.objects.create(
                application=application,
                status='submitted',
                notes='Application submitted to lenders'
            )
            
            # Match with lenders and submit
            matching_service = LoanMatchingService()
            suitable_lenders = matching_service.match_applicant_to_lenders({
                'loan_amount': float(application.loan_amount),
                'loan_purpose': application.loan_purpose,
                'applicant_id': str(application.applicant.id)
            })
            
            # Submit to each lender
            for lender_id in suitable_lenders:
                self.submit_to_lender(application, lender_id)
            
            logger.info(f"Submitted application {application.application_number} to {len(suitable_lenders)} lenders")
            return True
            
        except Exception as e:
            logger.error(f"Error submitting application: {str(e)}")
            return False
    
    def submit_to_lender(self, application: Application, lender_id: str) -> bool:
        """Submit application to a specific lender"""
        try:
            from apps.loans.models import Lender
            
            lender = Lender.objects.get(id=lender_id)
            
            # Prepare application data for lender API
            application_data = self._prepare_lender_payload(application, lender)
            
            # In production, make API call to lender
            # For now, simulate successful submission
            logger.info(f"Submitting application {application.application_number} to lender {lender.name}")
            
            # Simulate lender response
            self._handle_lender_response(application, lender, {
                'status': 'received',
                'lender_reference': f"LEND{uuid.uuid4().hex[:8].upper()}",
                'estimated_decision_time': '24-48 hours'
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error submitting to lender {lender_id}: {str(e)}")
            return False
    
    def _prepare_lender_payload(self, application: Application, lender: Lender) -> Dict[str, Any]:
        """Prepare application data for lender API"""
        applicant = application.applicant
        
        payload = {
            'application_reference': application.application_number,
            'applicant': {
                'first_name': applicant.user.first_name,
                'last_name': applicant.user.last_name,
                'email': applicant.user.email,
                'phone': applicant.user.phone,
                'date_of_birth': applicant.date_of_birth.isoformat() if applicant.date_of_birth else None,
                'address': {
                    'street': applicant.address,
                    'city': applicant.city,
                    'state': applicant.state,
                    'zip_code': applicant.zip_code,
                    'country': applicant.country
                }
            },
            'loan_details': {
                'purpose': application.loan_purpose,
                'amount': float(application.loan_amount),
                'term_months': application.loan_term,
                'requested_rate': float(application.interest_rate) if application.interest_rate else None
            },
            'financial_info': {
                'employment_status': applicant.employment_status,
                'annual_income': float(applicant.annual_income) if applicant.annual_income else None,
                'credit_score': applicant.credit_score
            }
        }
        
        return payload
    
    def _handle_lender_response(self, application: Application, lender: Lender, response: Dict[str, Any]):
        """Handle response from lender API"""
        try:
            # Update application with lender response
            application.lender = lender
            application.lender_response = json.dumps(response)
            
            if response.get('status') == 'approved':
                application.status = 'approved'
                application.decision_date = timezone.now()
            elif response.get('status') == 'rejected':
                application.status = 'rejected'
                application.decision_date = timezone.now()
            
            application.save()
            
            # Create status history
            ApplicationStatusHistory.objects.create(
                application=application,
                status=response.get('status', 'under_review'),
                notes=f"Response from {lender.name}: {response.get('message', 'No message')}"
            )
            
        except Exception as e:
            logger.error(f"Error handling lender response: {str(e)}")
    
    def update_application_status(self, application: Application, status: str, notes: str = None, user: User = None):
        """Update application status"""
        try:
            old_status = application.status
            application.status = status
            
            if status == 'approved':
                application.decision_date = timezone.now()
            elif status == 'funded':
                application.funding_date = timezone.now()
            
            application.save()
            
            # Create status history
            ApplicationStatusHistory.objects.create(
                application=application,
                status=status,
                notes=notes or f"Status changed from {old_status} to {status}",
                changed_by=user
            )
            
            logger.info(f"Updated application {application.application_number} status to {status}")
            
        except Exception as e:
            logger.error(f"Error updating application status: {str(e)}")
            raise


class LenderService:
    """Service for managing lender integrations"""
    
    def add_lender(self, lender_data: Dict[str, Any]) -> Lender:
        """Add a new lender to the platform"""
        try:
            lender = Lender.objects.create(
                name=lender_data['name'],
                api_endpoint=lender_data.get('api_endpoint'),
                api_key_encrypted=lender_data.get('api_key'),
                commission_rate=Decimal(str(lender_data.get('commission_rate', 0))),
                minimum_loan_amount=Decimal(str(lender_data.get('minimum_loan_amount', 0))),
                maximum_loan_amount=Decimal(str(lender_data.get('maximum_loan_amount', 0))) if lender_data.get('maximum_loan_amount') else None,
                supported_loan_types=lender_data.get('supported_loan_types', {}),
                requirements=lender_data.get('requirements', {})
            )
            
            logger.info(f"Added lender {lender.name}")
            return lender
            
        except Exception as e:
            logger.error(f"Error adding lender: {str(e)}")
            raise
    
    def update_lender_status(self, lender_id: str, is_active: bool) -> bool:
        """Update lender status"""
        try:
            lender = Lender.objects.get(id=lender_id)
            lender.is_active = is_active
            lender.save()
            
            logger.info(f"Updated lender {lender.name} status to {is_active}")
            return True
            
        except Lender.DoesNotExist:
            logger.error(f"Lender {lender_id} not found")
            return False
        except Exception as e:
            logger.error(f"Error updating lender status: {str(e)}")
            return False


class OfferService:
    """Service for managing loan offers"""
    
    def create_offer(self, application: Application, lender: Lender, offer_data: Dict[str, Any]) -> LoanOffer:
        """Create a loan offer"""
        try:
            offer = LoanOffer.objects.create(
                application=application,
                lender=lender,
                offer_amount=Decimal(str(offer_data['offer_amount'])),
                interest_rate=Decimal(str(offer_data['interest_rate'])),
                loan_term=offer_data['loan_term'],
                monthly_payment=Decimal(str(offer_data['monthly_payment'])),
                fees=offer_data.get('fees', {}),
                terms=offer_data.get('terms', ''),
                expiration_date=offer_data.get('expiration_date')
            )
            
            logger.info(f"Created offer {offer.id} for application {application.application_number}")
            return offer
            
        except Exception as e:
            logger.error(f"Error creating offer: {str(e)}")
            raise
    
    def accept_offer(self, offer: LoanOffer) -> bool:
        """Accept a loan offer"""
        try:
            offer.is_accepted = True
            offer.save()
            
            # Update application status
            application_service = ApplicationService()
            application_service.update_application_status(
                offer.application,
                'approved',
                f"Offer accepted from {offer.lender.name}"
            )
            
            # Reject other offers
            LoanOffer.objects.filter(application=offer.application).exclude(id=offer.id).update(
                is_accepted=False
            )
            
            logger.info(f"Accepted offer {offer.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error accepting offer: {str(e)}")
            return False