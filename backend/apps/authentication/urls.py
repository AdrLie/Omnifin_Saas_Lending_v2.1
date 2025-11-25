"""
Authentication URLs for Omnifin Platform
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.authentication.views import (
    UserRegistrationView, UserLoginView, UserLogoutView, PasswordChangeView,
    UserProfileView, TPBProfileView, ApplicantProfileView, UserManagementView,
    UserDetailView, get_user_info, verify_email, password_reset_request,
    password_reset_confirm
)

app_name = 'authentication'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),  # Explicit API login endpoint
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/', password_reset_request, name='password_reset'),
    path('password/reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    
    # Profile management
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/tpb/', TPBProfileView.as_view(), name='tpb_profile'),
    path('profile/applicant/', ApplicantProfileView.as_view(), name='applicant_profile'),
    
    # User management (admin)
    path('users/', UserManagementView.as_view(), name='user_management'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user_detail'),
    
    # Utility endpoints
    path('me/', get_user_info, name='user_info'),
    path('verify-email/', verify_email, name='verify_email'),
]