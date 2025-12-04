from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
# CSRF token endpoint for frontend
@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from apps.authentication.models import User, TPBProfile, ApplicantProfile
from apps.authentication.serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    PasswordChangeSerializer, TPBProfileSerializer, TPBProfileCreateSerializer,
    ApplicantProfileSerializer, ApplicantProfileCreateSerializer
)
from apps.authentication.permissions import IsAdmin, IsSuperAdmin, IsTPB


@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(generics.CreateAPIView):
    """User registration view"""
    serializer_class = UserRegistrationSerializer
    authentication_classes = [] 
    
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(generics.GenericAPIView):
    """User login view"""
    serializer_class = UserLoginSerializer
    authentication_classes = [] 
    
    # This alone is not enough if a bad token is sent!
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        # 1. Custom Validation Handling
        if not serializer.is_valid():
            # Create a clean error message from the serializer errors
            error_messages = []
            for field, errors in serializer.errors.items():
                error_messages.append(f"{field}: {errors[0]}")
            
            return Response({
                'success': False,
                'message': 'Validation Failed',
                'error': error_messages[0] if error_messages else 'Invalid data', # robust for your frontend
                'errors': serializer.errors # Full details if needed
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Success Logic
        user = serializer.validated_data['user']
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        # Log activity
        from apps.authentication.activity_utils import log_activity
        log_activity(
            user=user,
            activity_type='login',
            description=f'{user.get_full_name() or user.email} logged in',
            metadata={'login_method': 'email'},
            request=request
        )
        
        # 3. Standard Success Response
        return Response({
            'success': True,
            'message': 'Login Successful',
            'data': {
                'user': UserSerializer(user).data,
                'token': token.key
            }
        }, status=status.HTTP_200_OK)

class UserLogoutView(generics.GenericAPIView):
    """User logout view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        # Log activity before logout
        from apps.authentication.activity_utils import log_activity
        log_activity(
            user=request.user,
            activity_type='logout',
            description=f'{request.user.get_full_name() or request.user.email} logged out',
            request=request
        )
        
        # Delete token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        logout(request)
        return Response({'message': 'Successfully logged out'})


class PasswordChangeView(generics.GenericAPIView):
    """Password change view"""
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        from apps.authentication.activity_utils import log_activity
        
        user = serializer.save()
        
        # Log profile update activity
        updated_fields = list(serializer.validated_data.keys())
        log_activity(
            user=user,
            activity_type='profile_update',
            description=f"Updated profile information",
            metadata={
                'updated_fields': updated_fields,
                'profile_type': 'user'
            },
            request=self.request
        )


class TPBProfileView(generics.RetrieveUpdateAPIView):
    """TPB Profile view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TPBProfileSerializer
        return TPBProfileCreateSerializer
    
    def get_object(self):
        try:
            return self.request.user.tpb_profile
        except TPBProfile.DoesNotExist:
            return None
    
    def perform_update(self, serializer):
        from apps.authentication.activity_utils import log_activity
        
        if not hasattr(self.request.user, 'tpb_profile'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()
        
        # Log profile update activity
        updated_fields = list(serializer.validated_data.keys())
        log_activity(
            user=self.request.user,
            activity_type='profile_update',
            description=f"Updated TPB profile information",
            metadata={
                'updated_fields': updated_fields,
                'profile_type': 'tpb'
            },
            request=self.request
        )


class ApplicantProfileView(generics.RetrieveUpdateAPIView):
    """Applicant Profile view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ApplicantProfileSerializer
        return ApplicantProfileCreateSerializer
    
    def get_object(self):
        try:
            return self.request.user.applicant_profile
        except ApplicantProfile.DoesNotExist:
            return None
    
    def put(self, request, *args, **kwargs):
        """Handle PUT for both create and update"""
        if not hasattr(request.user, 'applicant_profile'):
            # Create new profile
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Update existing profile
            return self.update(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        """Handle PATCH for partial update"""
        if not hasattr(request.user, 'applicant_profile'):
            # Create new profile with partial data
            serializer = self.get_serializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Partial update existing profile
            return self.partial_update(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        from apps.authentication.activity_utils import log_activity
        
        serializer.save()
        
        # Log profile update activity
        updated_fields = list(serializer.validated_data.keys())
        log_activity(
            user=self.request.user,
            activity_type='profile_update',
            description=f"Updated applicant profile information",
            metadata={
                'updated_fields': updated_fields,
                'profile_type': 'applicant'
            },
            request=self.request
        )


class UserManagementView(generics.GenericAPIView):
    """User management view for admins"""
    permission_classes = [IsAdmin]
    
    def get(self, request, *args, **kwargs):
        # Get users in admin's group
        users = User.objects.filter(group_id=request.user.group_id)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        # Create new user
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        user.created_by = request.user
        user.group_id = request.user.group_id
        user.save()
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view for admins"""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        return User.objects.filter(group_id=self.request.user.group_id)
    
    def perform_destroy(self, instance):
        # Soft delete - deactivate user
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_info(request):
    """Get current user information"""
    user = request.user
    data = {
        'user': UserSerializer(user).data
    }
    
    # Add role-specific information
    if user.is_tpb and hasattr(user, 'tpb_profile'):
        data['tpb_profile'] = TPBProfileSerializer(user.tpb_profile).data
    elif user.role == 'applicant' and hasattr(user, 'applicant_profile'):
        data['applicant_profile'] = ApplicantProfileSerializer(user.applicant_profile).data
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_email(request):
    """Send email verification"""
    # In production, implement email verification
    return Response({'message': 'Email verification sent'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Request password reset"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # In production, implement password reset logic
    return Response({'message': 'Password reset email sent'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Confirm password reset"""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token or not new_password:
        return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # In production, implement password reset confirmation
    return Response({'message': 'Password reset successful'})


# Activity tracking views
from rest_framework import viewsets, filters
from apps.authentication.models import UserActivity
from apps.authentication.activity_serializers import UserActivitySerializer, CreateActivitySerializer
from django.db.models import Q


class UserActivityViewSet(viewsets.ModelViewSet):
    """ViewSet for user activities"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserActivitySerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    search_fields = ['description', 'activity_type']
    
    def get_queryset(self):
        user = self.request.user
        queryset = UserActivity.objects.select_related('user')
        
        # Apply filters
        activity_type = self.request.query_params.get('activity_type', None)
        user_id = self.request.query_params.get('user_id', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        # Admin/Superadmin can see all activities, others see only their own
        if not (user.is_admin or user.is_superadmin):
            queryset = queryset.filter(user=user)
        elif user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateActivitySerializer
        return UserActivitySerializer
    
    def perform_create(self, serializer):
        # Auto-set user and capture request metadata
        ip_address = self.get_client_ip()
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        
        serializer.save(
            user=self.request.user,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip