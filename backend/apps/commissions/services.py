"""
Commissions Services for Omnifin Platform
"""

import uuid
import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from apps.commissions.models import Commission, Payout, CommissionRule
from apps.authentication.models import TPBProfile
from apps.loans.models import Application

logger = logging.getLogger('omnifin')


class CommissionService:
    """Service for managing commissions"""
    
    def calculate_commission(self, application: Application, trigger_event: str) -> Optional[Commission]:
        """Calculate commission for TPB based on trigger event"""
        try:
            if not application.tpb:
                logger.info(f"No TPB associated with application {application.application_number}")
                return None
            
            # Get applicable commission rules
            rules = CommissionRule.objects.filter(
                trigger_event=trigger_event,
                is_active=True
            )
            
            if not rules.exists():
                logger.info(f"No commission rules found for trigger {trigger_event}")
                return None
            
            rule = rules.first()
            
            # Calculate commission amount
            base_amount = application.loan_amount
            commission_amount = base_amount * (rule.commission_rate / 100)
            
            # Apply limits
            if rule.minimum_amount and commission_amount < rule.minimum_amount:
                commission_amount = rule.minimum_amount
            
            if rule.maximum_amount and commission_amount > rule.maximum_amount:
                commission_amount = rule.maximum_amount
            
            # Create commission record
            commission = Commission.objects.create(
                tpb=application.tpb,
                application=application,
                commission_amount=commission_amount,
                commission_rate=rule.commission_rate,
                status='pending',
                metadata={
                    'trigger_event': trigger_event,
                    'rule_id': str(rule.id),
                    'base_amount': float(base_amount)
                }
            )
            
            logger.info(f"Calculated commission {commission.id} for TPB {application.tpb.company_name}: ${commission_amount}")
            return commission
            
        except Exception as e:
            logger.error(f"Error calculating commission: {str(e)}")
            return None
    
    def approve_commission(self, commission: Commission, approved_by: str = None) -> bool:
        """Approve a commission for payment"""
        try:
            if commission.status != 'pending':
                logger.warning(f"Commission {commission.id} is not in pending status")
                return False
            
            commission.status = 'approved'
            commission.approved_at = timezone.now()
            commission.metadata['approved_by'] = approved_by
            commission.save()
            
            logger.info(f"Approved commission {commission.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error approving commission: {str(e)}")
            return False
    
    def get_tpb_commissions(self, tpb: TPBProfile, status: str = None) -> List[Commission]:
        """Get commissions for a TPB"""
        commissions = Commission.objects.filter(tpb=tpb)
        
        if status:
            commissions = commissions.filter(status=status)
        
        return commissions.order_by('-calculated_at')
    
    def get_tpb_earnings_summary(self, tpb: TPBProfile) -> Dict[str, Any]:
        """Get earnings summary for TPB"""
        commissions = Commission.objects.filter(tpb=tpb)
        
        summary = {
            'total_commissions': commissions.count(),
            'pending_amount': Decimal('0.00'),
            'approved_amount': Decimal('0.00'),
            'paid_amount': Decimal('0.00'),
            'total_earnings': Decimal('0.00')
        }
        
        for commission in commissions:
            if commission.status == 'pending':
                summary['pending_amount'] += commission.commission_amount
            elif commission.status == 'approved':
                summary['approved_amount'] += commission.commission_amount
            elif commission.status == 'paid':
                summary['paid_amount'] += commission.commission_amount
            
            if commission.status in ['paid', 'approved']:
                summary['total_earnings'] += commission.commission_amount
        
        return summary


class PayoutService:
    """Service for managing TPB payouts"""
    
    def create_payout_batch(self, tpb: TPBProfile, commission_ids: List[str]) -> Optional[Payout]:
        """Create a payout batch for approved commissions"""
        try:
            # Get approved commissions
            commissions = Commission.objects.filter(
                id__in=commission_ids,
                tpb=tpb,
                status='approved'
            )
            
            if not commissions.exists():
                logger.info(f"No approved commissions found for TPB {tpb.company_name}")
                return None
            
            # Calculate total amount
            total_amount = sum(commission.commission_amount for commission in commissions)
            
            # Create payout batch
            payout_batch_id = f"PAYOUT{uuid.uuid4().hex[:8].upper()}"
            payout = Payout.objects.create(
                tpb=tpb,
                payout_batch_id=payout_batch_id,
                total_amount=total_amount,
                commission_count=commissions.count()
            )
            
            # Update commissions to paid status
            commissions.update(
                status='paid',
                paid_at=timezone.now(),
                payment_reference=payout_batch_id
            )
            
            logger.info(f"Created payout batch {payout_batch_id} for TPB {tpb.company_name}: ${total_amount}")
            return payout
            
        except Exception as e:
            logger.error(f"Error creating payout batch: {str(e)}")
            return None
    
    def process_payout(self, payout: Payout) -> bool:
        """Process payout batch (integrate with payment provider)"""
        try:
            # In production, integrate with payment provider (Stripe, PayPal, etc.)
            # For now, simulate successful processing
            
            payout.status = 'completed'
            payout.completed_at = timezone.now()
            payout.save()
            
            logger.info(f"Processed payout batch {payout.payout_batch_id}")
            return True
            
        except Exception as e:
            payout.status = 'failed'
            payout.failure_reason = str(e)
            payout.save()
            
            logger.error(f"Error processing payout batch {payout.payout_batch_id}: {str(e)}")
            return False
    
    def get_payout_history(self, tpb: TPBProfile) -> List[Payout]:
        """Get payout history for TPB"""
        return Payout.objects.filter(tpb=tpb).order_by('-initiated_at')
    
    def get_pending_payouts(self) -> List[Payout]:
        """Get all pending payouts"""
        return Payout.objects.filter(status='processing')


class CommissionRuleService:
    """Service for managing commission rules"""
    
    def create_rule(self, rule_data: Dict[str, Any]) -> CommissionRule:
        """Create a new commission rule"""
        try:
            rule = CommissionRule.objects.create(
                name=rule_data['name'],
                description=rule_data.get('description', ''),
                trigger_event=rule_data['trigger_event'],
                commission_rate=Decimal(str(rule_data['commission_rate'])),
                minimum_amount=Decimal(str(rule_data.get('minimum_amount', 0))),
                maximum_amount=Decimal(str(rule_data['maximum_amount'])) if rule_data.get('maximum_amount') else None
            )
            
            logger.info(f"Created commission rule {rule.name}")
            return rule
            
        except Exception as e:
            logger.error(f"Error creating commission rule: {str(e)}")
            raise
    
    def update_rule(self, rule_id: str, rule_data: Dict[str, Any]) -> bool:
        """Update an existing commission rule"""
        try:
            rule = CommissionRule.objects.get(id=rule_id)
            
            for key, value in rule_data.items():
                if hasattr(rule, key):
                    if key in ['commission_rate', 'minimum_amount', 'maximum_amount'] and value is not None:
                        value = Decimal(str(value))
                    setattr(rule, key, value)
            
            rule.save()
            logger.info(f"Updated commission rule {rule.name}")
            return True
            
        except CommissionRule.DoesNotExist:
            logger.error(f"Commission rule {rule_id} not found")
            return False
        except Exception as e:
            logger.error(f"Error updating commission rule: {str(e)}")
            return False
    
    def deactivate_rule(self, rule_id: str) -> bool:
        """Deactivate a commission rule"""
        try:
            rule = CommissionRule.objects.get(id=rule_id)
            rule.is_active = False
            rule.save()
            
            logger.info(f"Deactivated commission rule {rule.name}")
            return True
            
        except CommissionRule.DoesNotExist:
            logger.error(f"Commission rule {rule_id} not found")
            return False
        except Exception as e:
            logger.error(f"Error deactivating commission rule: {str(e)}")
            return False