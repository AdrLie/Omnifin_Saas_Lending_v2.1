from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory, ApplicationProgress
from apps.loans.serializers import (
    ApplicationSerializer, ApplicationCreateSerializer, ApplicationStatusUpdateSerializer,
    LenderSerializer, LenderCreateSerializer, LoanOfferSerializer,
    ApplicationStatusHistorySerializer, ApplicationProgressSerializer, StepCompletionSerializer
)
from apps.loans.services import ApplicationService, LenderService, OfferService
from apps.authentication.permissions import IsAdmin, IsSuperAdmin, IsTPB
from django.db import models


class ApplicationViewSet(viewsets.ModelViewSet):
    """Application ViewSet"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Application.objects.all().order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='apply')
    def apply(self, request):
        """Custom endpoint to apply for a loan"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED
        )

    def get_queryset(self):
        user = self.request.user
        
        # Base queryset based on user role
        if user.is_superadmin or user.is_admin or user.is_tpb:
            queryset = Application.objects.all()
        elif user.role == 'applicant':
            queryset = Application.objects.filter(applicant=user.applicant_profile)
        else:
            return Application.objects.none()
        
        # Apply filters from query parameters
        status_filter = self.request.query_params.get('status', None)
        loan_type = self.request.query_params.get('loan_type', None)
        search = self.request.query_params.get('search', None)
        tab = self.request.query_params.get('tab', None)
        
        # Tab-based filtering
        if tab == 'pending_review':
            queryset = queryset.filter(status__in=['pending', 'submitted', 'under_review'])
        elif tab == 'approved':
            queryset = queryset.filter(status='approved')
        elif tab == 'rejected':
            queryset = queryset.filter(status='rejected')
        
        # Status filter
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Loan type filter
        if loan_type:
            queryset = queryset.filter(loan_purpose__icontains=loan_type)
        
        # Enhanced search filter - searches across multiple fields
        if search:
            queryset = queryset.filter(
                models.Q(application_number__icontains=search) |
                models.Q(id__icontains=search) |
                models.Q(loan_purpose__icontains=search) |
                models.Q(status__icontains=search) |
                models.Q(applicant__user__email__icontains=search) |
                models.Q(applicant__user__first_name__icontains=search) |
                models.Q(applicant__user__last_name__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'apply']:
            return ApplicationCreateSerializer
        elif self.action == 'update_status':
            return ApplicationStatusUpdateSerializer
        return ApplicationSerializer

    def create(self, request, *args, **kwargs):
        """Create a new loan application"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        
        # Log activity
        from apps.authentication.activity_utils import log_activity
        log_activity(
            user=request.user,
            activity_type='loan_application',
            description=f'Applied for {application.loan_purpose} loan of ${application.loan_amount}',
            metadata={
                'application_id': str(application.id),
                'application_number': application.application_number,
                'loan_amount': str(application.loan_amount),
                'loan_purpose': application.loan_purpose
            },
            request=request
        )
        
        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED
        )
    
    def perform_update(self, serializer):
        """Log activity when TPB updates loan application"""
        from apps.authentication.activity_utils import log_activity
        
        application = self.get_object()
        old_data = {
            'loan_amount': str(application.loan_amount),
            'loan_purpose': application.loan_purpose,
            'interest_rate': str(application.interest_rate),
            'loan_term': application.loan_term
        }
        
        serializer.save()
        
        # Log activity for TPB user who updates the application
        if hasattr(self.request.user, 'tpb_profile'):
            updated_fields = list(serializer.validated_data.keys())
            
            log_activity(
                user=self.request.user,
                activity_type='loan_view',
                description=f'Updated loan application details',
                metadata={
                    'application_id': str(application.id),
                    'application_number': application.application_number,
                    'updated_fields': updated_fields,
                    'old_data': old_data,
                    'applicant_name': application.applicant.user.get_full_name(),
                    'applicant_email': application.applicant.user.email,
                    'loan_amount': str(application.loan_amount),
                    'loan_purpose': application.loan_purpose
                },
                request=self.request
            )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit application to lenders"""
        application = self.get_object()
        if application.status != 'pending':
            return Response(
                {'error': 'Application has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        service = ApplicationService()
        success = service.submit_application(application)
        if success:
            return Response({'message': 'Application submitted successfully'})
        else:
            return Response(
                {'error': 'Failed to submit application'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update application status"""
        application = self.get_object()
        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_status = application.status
        new_status = serializer.validated_data['status']
        
        service = ApplicationService()
        service.update_application_status(
            application,
            new_status,
            request.data.get('notes'),
            request.user
        )
        
        # Log activity for TPB user
        if hasattr(request.user, 'tpb_profile'):
            from apps.authentication.activity_utils import log_activity
            log_activity(
                user=request.user,
                activity_type='loan_status_change',
                description=f'Updated loan application status from {old_status} to {new_status}',
                metadata={
                    'application_id': str(application.id),
                    'application_number': application.application_number,
                    'old_status': old_status,
                    'new_status': new_status,
                    'notes': request.data.get('notes'),
                    'applicant_name': application.applicant.user.get_full_name(),
                    'applicant_email': application.applicant.user.email,
                    'loan_amount': str(application.loan_amount),
                    'loan_purpose': application.loan_purpose
                },
                request=request
            )
        
        return Response({'message': 'Status updated successfully'})

    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Get application status history"""
        application = self.get_object()
        history = ApplicationStatusHistory.objects.filter(application=application)
        serializer = ApplicationStatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def offers(self, request, pk=None):
        """Get offers for application"""
        application = self.get_object()
        offers = LoanOffer.objects.filter(application=application)
        serializer = LoanOfferSerializer(offers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='progress')
    def get_progress(self, request, pk=None):
        """Get application progress"""
        application = self.get_object()
        progress, created = ApplicationProgress.objects.get_or_create(application=application)
        serializer = ApplicationProgressSerializer(progress)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='progress/complete-step')
    def complete_step(self, request, pk=None):
        """Complete a specific step in the application process"""
        application = self.get_object()
        
        # Check permissions - only admin/superadmin/TPB can complete steps
        if not (request.user.is_admin or request.user.is_superadmin or hasattr(request.user, 'tpb_profile')):
            return Response(
                {'error': 'You do not have permission to complete steps'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress, created = ApplicationProgress.objects.get_or_create(application=application)
        
        serializer = StepCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        step = serializer.validated_data['step']
        notes = serializer.validated_data.get('notes')
        
        # Prepare step-specific data
        step_data = {}
        if step == 2 and 'documents_verified' in serializer.validated_data:
            step_data['documents_verified'] = serializer.validated_data['documents_verified']
        elif step == 3 and 'credit_check_result' in serializer.validated_data:
            step_data['credit_check_result'] = serializer.validated_data['credit_check_result']
        elif step == 4 and 'decision' in serializer.validated_data:
            step_data['decision'] = serializer.validated_data['decision']
            # Update application status based on decision
            if serializer.validated_data['decision'] == 'approved':
                application.status = 'approved'
            else:
                application.status = 'rejected'
            application.save()
        
        # Complete the step
        progress.complete_step(step, user=request.user, notes=notes, **step_data)
        
        # Log activity for TPB user
        if hasattr(request.user, 'tpb_profile'):
            from apps.authentication.activity_utils import log_activity
            
            step_names = {
                0: 'Application Submitted',
                1: 'Initial Review',
                2: 'Document Verification',
                3: 'Credit Check',
                4: 'Final Approval',
                5: 'Funding'
            }
            
            log_activity(
                user=request.user,
                activity_type='application_review',
                description=f'Completed step: {step_names.get(step, f"Step {step}")} for loan application',
                metadata={
                    'application_id': str(application.id),
                    'application_number': application.application_number,
                    'step': step,
                    'step_name': step_names.get(step, f"Step {step}"),
                    'notes': notes,
                    'step_data': step_data,
                    'applicant_name': application.applicant.user.get_full_name(),
                    'applicant_email': application.applicant.user.email,
                    'loan_amount': str(application.loan_amount),
                    'loan_purpose': application.loan_purpose
                },
                request=request
            )
        
        # Return updated progress
        return Response(ApplicationProgressSerializer(progress).data)
    
    @action(detail=True, methods=['post'], url_path='progress/set-step')
    def set_current_step(self, request, pk=None):
        """Manually set current step (admin/TPB only)"""
        if not (request.user.is_admin or request.user.is_superadmin or hasattr(request.user, 'tpb_profile')):
            return Response(
                {'error': 'Only admins and TPB users can manually set steps'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application = self.get_object()
        progress, created = ApplicationProgress.objects.get_or_create(application=application)
        
        step = request.data.get('step')
        if step is None or not (0 <= int(step) <= 5):
            return Response(
                {'error': 'Invalid step value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_step = progress.current_step
        progress.current_step = int(step)
        progress.save()
        
        # Log activity for TPB user when navigating steps
        if hasattr(request.user, 'tpb_profile'):
            from apps.authentication.activity_utils import log_activity
            
            step_names = {
                0: 'Application Submitted',
                1: 'Initial Review',
                2: 'Document Verification',
                3: 'Credit Check',
                4: 'Final Approval',
                5: 'Funding'
            }
            
            log_activity(
                user=request.user,
                activity_type='loan_view',
                description=f'Navigated to step: {step_names.get(int(step), f"Step {step}")} for loan application',
                metadata={
                    'application_id': str(application.id),
                    'application_number': application.application_number,
                    'old_step': old_step,
                    'new_step': int(step),
                    'step_name': step_names.get(int(step), f"Step {step}"),
                    'applicant_name': application.applicant.user.get_full_name(),
                    'applicant_email': application.applicant.user.email,
                    'loan_amount': str(application.loan_amount),
                    'loan_purpose': application.loan_purpose
                },
                request=request
            )
        
        return Response(ApplicationProgressSerializer(progress).data)

    def destroy(self, request, *args, **kwargs):
        """Delete a loan application"""
        application = self.get_object()
        
        # Only allow deletion if status is pending or the user is admin
        if application.status not in ['pending', 'cancelled'] and not (request.user.is_admin or request.user.is_superadmin):
            return Response(
                {'error': 'Cannot delete application that is not in pending status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application.delete()
        return Response(
            {'message': 'Application deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


class LenderViewSet(viewsets.ModelViewSet):
    """Lender ViewSet"""
    permission_classes = [IsSuperAdmin]
    queryset = Lender.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LenderCreateSerializer
        return LenderSerializer
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle lender status"""
        lender = self.get_object()
        service = LenderService()
        success = service.update_lender_status(str(lender.id), not lender.is_active)
        
        if success:
            return Response({'message': 'Lender status updated successfully'})
        else:
            return Response(
                {'error': 'Failed to update lender status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoanOfferViewSet(viewsets.ReadOnlyModelViewSet):
    """Loan Offer ViewSet"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LoanOfferSerializer
    queryset = LoanOffer.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin or user.is_admin:
            return LoanOffer.objects.all()
        elif hasattr(user, 'tpb_profile'):
            return LoanOffer.objects.filter(application__tpb=user.tpb_profile)
        elif hasattr(user, 'applicant_profile'):
            return LoanOffer.objects.filter(application__applicant=user.applicant_profile)
        else:
            return LoanOffer.objects.none()
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a loan offer"""
        offer = self.get_object()
        
        if offer.is_accepted:
            return Response(
                {'error': 'Offer has already been accepted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = OfferService()
        success = service.accept_offer(offer)
        
        if success:
            return Response({'message': 'Offer accepted successfully'})
        else:
            return Response(
                {'error': 'Failed to accept offer'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def application_dashboard(request):
    """Get application dashboard data"""
    user = request.user
    
    if user.is_superadmin or user.is_admin:
        applications = Application.objects.all()
    elif user.is_tpb:
        applications = Application.objects.filter(tpb=user.tpb_profile)
    else:
        applications = Application.objects.filter(applicant=user.applicant_profile)
    
    # Status counts
    status_counts = applications.values('status').annotate(count=models.Count('status'))
    
    # Recent applications
    recent_applications = applications.order_by('-created_at')[:10]
    
    data = {
        'total_applications': applications.count(),
        'status_counts': {item['status']: item['count'] for item in status_counts},
        'recent_applications': ApplicationSerializer(recent_applications, many=True).data
    }
    
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def lender_performance(request):
    """Get lender performance metrics"""
    # In production, implement detailed lender performance metrics
    lenders = Lender.objects.filter(is_active=True)
    
    performance_data = []
    for lender in lenders:
        applications = Application.objects.filter(lender=lender)
        
        performance_data.append({
            'lender': LenderSerializer(lender).data,
            'total_applications': applications.count(),
            'approved_applications': applications.filter(status='approved').count(),
            'funded_applications': applications.filter(status='funded').count(),
            'approval_rate': 0,  # Calculate in production
            'funding_rate': 0   # Calculate in production
        })
    
    return Response(performance_data)