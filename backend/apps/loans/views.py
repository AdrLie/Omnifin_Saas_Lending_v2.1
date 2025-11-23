"""
Loans views for Omnifin Platform
"""

from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.loans.models import Application, Lender, LoanOffer, ApplicationStatusHistory
from apps.loans.serializers import (
    ApplicationSerializer, ApplicationCreateSerializer, ApplicationStatusUpdateSerializer,
    LenderSerializer, LenderCreateSerializer, LoanOfferSerializer,
    ApplicationStatusHistorySerializer
)
from apps.loans.services import ApplicationService, LenderService, OfferService
from apps.authentication.permissions import IsAdmin, IsSuperAdmin, IsTPB


class ApplicationViewSet(viewsets.ModelViewSet):
    """Application ViewSet"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Application.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin or user.is_admin:
            return Application.objects.all()
        elif hasattr(user, 'tpb_profile'):
            return Application.objects.filter(tpbs=user.tpb_profile)
        elif hasattr(user, 'applicant_profile'):
            return Application.objects.filter(applicant=user.applicant_profile)
        else:
            return Application.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        elif self.action == 'update_status':
            return ApplicationStatusUpdateSerializer
        return ApplicationSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new loan application"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        
        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED
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
        
        service = ApplicationService()
        service.update_application_status(
            application,
            serializer.validated_data['status'],
            request.data.get('notes'),
            request.user
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