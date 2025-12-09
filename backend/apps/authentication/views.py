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
from apps.authentication.models import User, TPBProfile, ApplicantProfile, Organization, InvitationCode
from apps.authentication.serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    PasswordChangeSerializer, TPBProfileSerializer, TPBProfileCreateSerializer,
    ApplicantProfileSerializer, ApplicantProfileCreateSerializer,
    InvitationCodeSerializer, InvitationCodeCreateSerializer
)
from apps.authentication.permissions import IsSystemAdmin, IsTPBManager, IsTPBStaff, IsTPBCustomer, IsTPBWorkspaceUser


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
        
        # Check if MFA is enabled
        if user.mfa_enabled and user.mfa_secret:
            # Return response indicating MFA is required
            return Response({
                'success': True,
                'mfa_required': True,
                'message': 'MFA verification required',
                'email': user.email
            }, status=status.HTTP_200_OK)
        
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
    """User management view for system admin and TPB managers"""
    permission_classes = [IsSystemAdmin | IsTPBManager]
    
    def get(self, request, *args, **kwargs):
        # System admin can see all users, TPB manager sees their workspace group
        if request.user.is_system_admin:
            users = User.objects.all()
        else:
            users = User.objects.filter(group_id=request.user.group_id)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        # Create new user
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        user.created_by = request.user
        
        # System admin creates standalone users, TPB manager creates for their workspace
        if not request.user.is_system_admin and request.user.group_id:
            user.group_id = request.user.group_id
        
        user.save()
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view for system admin and TPB managers"""
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin | IsTPBManager]
    
    def get_queryset(self):
        # System admin can see all users, TPB manager sees their workspace group
        if self.request.user.is_system_admin:
            return User.objects.all()
        return User.objects.filter(group_id=self.request.user.group_id)
    
    def perform_destroy(self, instance):
        # Hard delete - remove user from database
        instance.delete()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_info(request):
    """Get current user information"""
    user = request.user
    data = {
        'user': UserSerializer(user).data
    }
    
    # Add role-specific information
    if user.is_tpb_manager and hasattr(user, 'tpb_profile'):
        data['tpb_profile'] = TPBProfileSerializer(user.tpb_profile).data
    elif user.role == 'tpb_customer' and hasattr(user, 'applicant_profile'):
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


# Two-Factor Authentication views
import pyotp
import qrcode
import io
import base64
from django.http import HttpResponse


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enable_mfa(request):
    """Enable MFA for the current user"""
    user = request.user
    
    if user.mfa_enabled:
        return Response({'error': 'MFA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate a secret key for the user
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    user.save()
    
    # Generate provisioning URI for QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name='Omnifin Platform'
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Convert to base64 for frontend display
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'secret': secret,
        'qr_code': f'data:image/png;base64,{img_base64}',
        'provisioning_uri': provisioning_uri
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_mfa_setup(request):
    """Verify MFA setup with TOTP code"""
    user = request.user
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.mfa_secret:
        return Response({'error': 'MFA setup not initiated'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify the token
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(token, valid_window=1):
        user.mfa_enabled = True
        user.save()
        
        # Log activity
        from apps.authentication.activity_utils import log_activity
        log_activity(
            user=user,
            activity_type='settings_change',
            description='Two-factor authentication enabled',
            metadata={'mfa_enabled': True},
            request=request
        )
        
        return Response({
            'success': True,
            'message': 'MFA enabled successfully'
        })
    else:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def disable_mfa(request):
    """Disable MFA for the current user"""
    user = request.user
    password = request.data.get('password')
    token = request.data.get('token')
    
    if not password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify password
    if not user.check_password(password):
        return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
    
    # If MFA is enabled, verify token
    if user.mfa_enabled and user.mfa_secret:
        if not token:
            return Response({'error': 'MFA token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(token, valid_window=1):
            return Response({'error': 'Invalid MFA token'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.mfa_enabled = False
    user.mfa_secret = None
    user.save()
    
    # Log activity
    from apps.authentication.activity_utils import log_activity
    log_activity(
        user=user,
        activity_type='settings_change',
        description='Two-factor authentication disabled',
        metadata={'mfa_enabled': False},
        request=request
    )
    
    return Response({
        'success': True,
        'message': 'MFA disabled successfully'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_mfa_login(request):
    """Verify MFA token during login"""
    email = request.data.get('email')
    token = request.data.get('token')
    
    if not email or not token:
        return Response({'error': 'Email and token are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not user.mfa_enabled or not user.mfa_secret:
        return Response({'error': 'MFA is not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify the token
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(token, valid_window=1):
        # Create or get token
        auth_token, created = Token.objects.get_or_create(user=user)
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        # Log activity
        from apps.authentication.activity_utils import log_activity
        log_activity(
            user=user,
            activity_type='login',
            description=f'{user.get_full_name() or user.email} logged in with MFA',
            metadata={'login_method': 'email', 'mfa_verified': True},
            request=request
        )
        
        return Response({
            'success': True,
            'message': 'Login Successful',
            'data': {
                'user': UserSerializer(user).data,
                'token': auth_token.key
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid MFA token'}, status=status.HTTP_400_BAD_REQUEST)


# Activity tracking views
from rest_framework import viewsets, filters
from apps.authentication.models import UserActivity
from apps.authentication.activity_serializers import UserActivitySerializer, CreateActivitySerializer
from apps.authentication.pagination import CustomPageNumberPagination
from django.db.models import Q


class UserActivityViewSet(viewsets.ModelViewSet):
    """ViewSet for user activities"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserActivitySerializer
    pagination_class = CustomPageNumberPagination
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
        
        # Admin/System admin can see all activities, others see only their own
        if not (user.is_system_admin or user.is_tpb_manager):
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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_organizations(request):
    """List available organizations for applicants to join"""
    try:
        organizations = Organization.objects.filter(is_active=True).select_related('owner').values(
            'id', 'name', 'description', 'owner__email', 'owner__first_name', 'owner__last_name'
        )
        
        org_list = []
        for org in organizations:
            org_list.append({
                'id': str(org['id']),
                'name': org['name'],
                'description': org['description'],
                'owner': f"{org['owner__first_name']} {org['owner__last_name']}".strip(),
                'owner_email': org['owner__email'],
            })
        
        return Response({
            'success': True,
            'organizations': org_list
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class InvitationCodeCreateView(generics.CreateAPIView):
    """Generate invitation codes for organization (TPB Manager only)"""
    serializer_class = InvitationCodeCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTPBManager]
    
    def get_organization(self):
        """Get organization owned by current user"""
        try:
            return Organization.objects.get(owner=self.request.user)
        except Organization.DoesNotExist:
            raise serializers.ValidationError("You don't have an organization")
    
    def create(self, request, *args, **kwargs):
        organization = self.get_organization()
        serializer = self.get_serializer(data=request.data)
        serializer.context['organization'] = organization
        serializer.is_valid(raise_exception=True)
        inv_code = serializer.save()
        
        return Response(InvitationCodeSerializer(inv_code).data, status=status.HTTP_201_CREATED)


class InvitationCodeListView(generics.ListAPIView):
    """List all invitation codes for an organization (TPB Manager only)"""
    serializer_class = InvitationCodeSerializer
    permission_classes = [permissions.IsAuthenticated, IsTPBManager]
    
    def get_queryset(self):
        """Get codes for user's organization"""
        try:
            org = Organization.objects.get(owner=self.request.user)
            return InvitationCode.objects.filter(organization=org).order_by('-created_at')
        except Organization.DoesNotExist:
            return InvitationCode.objects.none()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_organization(request):
    """Get the current user's organization"""
    try:
        # Get organization by group_id
        organization = Organization.objects.get(group_id=request.user.group_id)
        return Response({
            'id': str(organization.id),
            'group_id': str(organization.group_id),
            'name': organization.name,
            'description': organization.description,
            'owner': organization.owner.email,
            'is_active': organization.is_active,
            'created_at': organization.created_at,
            'updated_at': organization.updated_at
        }, status=status.HTTP_200_OK)
    except Organization.DoesNotExist:
        # If no organization found by group_id, try to get by owner
        try:
            organization = Organization.objects.get(owner=request.user)
            return Response({
                'id': str(organization.id),
                'group_id': str(organization.group_id),
                'name': organization.name,
                'description': organization.description,
                'owner': organization.owner.email,
                'is_active': organization.is_active,
                'created_at': organization.created_at,
                'updated_at': organization.updated_at
            }, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response(
                {'error': 'No organization found'},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )