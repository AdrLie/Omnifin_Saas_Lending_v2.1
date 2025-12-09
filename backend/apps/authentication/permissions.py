from rest_framework import permissions


class IsSystemAdmin(permissions.BasePermission):
    """Custom permission to only allow system admins to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_system_admin


class IsTPBManager(permissions.BasePermission):
    """Custom permission to only allow TPB managers to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_tpb_manager


class IsTPBStaff(permissions.BasePermission):
    """Custom permission to only allow TPB staff to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_tpb_staff


class IsTPBCustomer(permissions.BasePermission):
    """Custom permission to only allow TPB customers to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_tpb_customer


class HasActiveSubscription(permissions.BasePermission):
    """Custom permission to check if TPB Manager has active subscription"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # System admins and TPB customers can always access
        if request.user.is_system_admin or request.user.is_tpb_customer:
            return True
        
        # TPB Managers and Staff need active subscription
        if request.user.is_tpb_manager or request.user.is_tpb_staff:
            from apps.subscriptions.models import Subscription
            try:
                subscription = Subscription.objects.get(group_id=request.user.group_id)
                if subscription.status == 'active':
                    return True
                # Allow access if in trial period
                if subscription.status == 'trialing':
                    return True
            except Subscription.DoesNotExist:
                # No subscription yet - deny access (need to activate trial or purchase)
                return False
        
        return False



class IsTPBWorkspaceUser(permissions.BasePermission):
    """Custom permission to allow TPB workspace users (manager, staff, customer) to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['tpb_manager', 'tpb_staff', 'tpb_customer']


class IsOwnerOrSystemAdmin(permissions.BasePermission):
    """Custom permission to only allow owners or system admins to access"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to the owner or system admins
        return obj.user == request.user or request.user.is_system_admin


class IsTPBManagerForGroup(permissions.BasePermission):
    """Custom permission to allow TPB managers to manage their workspace"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_tpb_manager
    
    def has_object_permission(self, request, view, obj):
        # TPB managers can only manage users in their own group
        return obj.group_id == request.user.group_id or request.user.is_system_admin