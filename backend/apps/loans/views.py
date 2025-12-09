from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory, ApplicationProgress
from apps.loans.pagination import CustomPageNumberPagination
from apps.loans.serializers import (
    ApplicationSerializer, ApplicationCreateSerializer, ApplicationStatusUpdateSerializer,
    LenderSerializer, LenderCreateSerializer, LoanOfferSerializer,
    ApplicationStatusHistorySerializer, ApplicationProgressSerializer, StepCompletionSerializer
)
from apps.loans.services import ApplicationService, LenderService, OfferService
from apps.authentication.permissions import IsSystemAdmin, IsTPBManager, IsTPBWorkspaceUser, HasActiveSubscription
from django.db import models


class ApplicationViewSet(viewsets.ModelViewSet):
    """Application ViewSet"""
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]
    queryset = Application.objects.all().order_by('-created_at')
    pagination_class = CustomPageNumberPagination

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
        if user.is_system_admin:
            queryset = Application.objects.all()
        elif user.is_tpb_manager or user.is_tpb_staff:
            # TPB managers/staff only see loans from their organization
            queryset = Application.objects.filter(group_id=user.group_id)
        elif user.role == 'tpb_customer':
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
        
        # Status filter (case-insensitive)
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter.strip())
        
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
        
        # Auto-assign group_id from applicant's group
        if not application.group_id and application.applicant and application.applicant.user:
            application.group_id = application.applicant.user.group_id
            application.save()
        
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
        if self.request.user.is_tpb_manager or self.request.user.is_tpb_staff or self.request.user.is_system_admin:
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
        if request.user.is_tpb_manager or request.user.is_tpb_staff or request.user.is_system_admin:
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
        
        # Check permissions - only system_admin/tpb_manager/tpb_staff can complete steps
        if not (request.user.is_system_admin or request.user.is_tpb_manager or request.user.is_tpb_staff):
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
            # Update application status based on decision using service for history
            app_service = ApplicationService()
            app_service.update_application_status(application, serializer.validated_data['decision'], notes, request.user)
        
        # Complete the step
        progress.complete_step(step, user=request.user, notes=notes, **step_data)
        
        # Log activity for TPB user
        if request.user.is_tpb_manager or request.user.is_tpb_staff or request.user.is_system_admin:
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
        
        # Return updated progress and application data
        from apps.loans.serializers import ApplicationSerializer
        return Response({
            'progress': ApplicationProgressSerializer(progress).data,
            'application': ApplicationSerializer(application).data
        })
    
    @action(detail=True, methods=['post'], url_path='progress/set-step')
    def set_current_step(self, request, pk=None):
        """Manually set current step (admin/TPB only)"""
        if not (request.user.is_system_admin or request.user.is_tpb_manager or request.user.is_tpb_staff):
            return Response(
                {'error': 'Only admins and TPB users can manually set steps'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application = self.get_object()
        progress, created = ApplicationProgress.objects.get_or_create(application=application)
        
        step = int(request.data.get('step')) if request.data.get('step') is not None else None
        decision = request.data.get('decision')
        if step is None or not (0 <= int(step) <= 5):
            return Response(
                {'error': 'Invalid step value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_step = progress.current_step
        progress.current_step = int(step)
        progress.save()

        # Update application status based on the step (and optional decision)
        # Mapping: step 1 -> 'under_review', step 2 -> 'documents_verified', step 3 -> 'credit_check',
        # step 4 -> 'approved' or 'rejected' depending on decision, step 5 -> 'funded'
        app_service = ApplicationService()
        notes = request.data.get('notes')
        if step == 1:
            app_service.update_application_status(application, 'under_review', notes, request.user)
        elif step == 2:
            app_service.update_application_status(application, 'documents_verified', notes, request.user)
        elif step == 3:
            app_service.update_application_status(application, 'credit_check', notes, request.user)
        elif step == 4:
            if decision in ['approved', 'rejected']:
                app_service.update_application_status(application, decision, notes, request.user)
            else:
                # If no decision provided, set to under_review (final approval pending)
                app_service.update_application_status(application, 'under_review', notes, request.user)
        elif step == 5:
            app_service.update_application_status(application, 'funded', notes, request.user)
        
        # Log activity for TPB user when navigating steps
        if request.user.is_tpb_manager or request.user.is_tpb_staff or request.user.is_system_admin:
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
        
        from apps.loans.serializers import ApplicationSerializer
        return Response({
            'progress': ApplicationProgressSerializer(progress).data,
            'application': ApplicationSerializer(application).data
        })

    def destroy(self, request, *args, **kwargs):
        """Delete a loan application"""
        application = self.get_object()
        
        # Only allow deletion if status is pending or the user is admin
        if application.status not in ['pending', 'cancelled'] and not (request.user.is_tpb_manager or request.user.is_system_admin):
            return Response(
                {'error': 'Cannot delete application that is not in pending status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application.delete()
        return Response(
            {'message': 'Application deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['post'], url_path='clear-all')
    def clear_all(self, request):
        """Bulk deletion of all loan application data (admin/superadmin only).

        Request body must include a confirmation string to avoid accidental deletion:
          { "confirm": "DELETE_ALL_LOANS", "dry_run": false }

        If `dry_run` is true or omitted, endpoint returns the counts that would be deleted.
        """
        # Permission check: only admin / superadmin can do this
        user = request.user
        if not (user.is_system_admin or user.is_tpb_manager):
            return Response({'error': 'Only admins and superadmins can clear all loans'}, status=status.HTTP_403_FORBIDDEN)

        confirm = request.data.get('confirm')
        dry_run = bool(request.data.get('dry_run', False))
        if confirm != 'DELETE_ALL_LOANS':
            return Response({'error': 'Missing or invalid confirmation string. Use confirm: DELETE_ALL_LOANS'}, status=status.HTTP_400_BAD_REQUEST)

        # Compute counts to show or for logging
        offers_count = LoanOffer.objects.count()
        progress_count = ApplicationProgress.objects.count()
        history_count = ApplicationStatusHistory.objects.count()
        app_count = Application.objects.count()

        if dry_run:
            return Response({
                'ok': True,
                'dry_run': True,
                'counts': {
                    'applications': app_count,
                    'offers': offers_count,
                    'progress': progress_count,
                    'history': history_count
                }
            })

        # Perform deletion inside a single transaction
        from django.db import transaction
        with transaction.atomic():
            # Delete in specific order to avoid cascade issues
            # First, delete child records
            LoanOffer.objects.all().delete()
            ApplicationProgress.objects.all().delete()
            ApplicationStatusHistory.objects.all().delete()
            
            # Then use raw SQL to delete applications to avoid cascade checks for missing tables
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM loans_application")
                app_count = cursor.rowcount

        # Log this action as an admin activity
        try:
            from apps.authentication.activity_utils import log_activity
            log_activity(
                user=request.user,
                activity_type='loan_management',
                description='Bulk deletion of all loan records by admin',
                metadata={'applications_deleted': app_count, 'offers_deleted': offers_count},
                request=request,
            )
        except Exception:
            # If logging fails, do not fail the operation
            pass

        return Response({
            'ok': True,
            'counts_deleted': {
                'applications': app_count,
                'offers': offers_count,
                'progress': progress_count,
                'history': history_count
            }
        })


class LenderViewSet(viewsets.ModelViewSet):
    """Lender ViewSet"""
    permission_classes = [IsSystemAdmin]
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
        if user.is_system_admin or user.is_tpb_manager or user.is_tpb_staff:
            return LoanOffer.objects.all()
        elif user.role == 'tpb_customer':
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
    
    if user.is_system_admin or user.is_tpb_manager or user.is_tpb_staff:
        applications = Application.objects.all()
    elif user.role == 'tpb_customer':
        applications = Application.objects.filter(applicant=user.applicant_profile)
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