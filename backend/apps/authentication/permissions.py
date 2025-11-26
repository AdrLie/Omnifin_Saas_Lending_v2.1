from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Custom permission to only allow admins to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsSuperAdmin(permissions.BasePermission):
    """Custom permission to only allow superadmins to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superadmin


class IsTPB(permissions.BasePermission):
    """Custom permission to only allow TPB users to access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_tpb


class IsOwnerOrAdmin(permissions.BasePermission):
    """Custom permission to only allow owners or admins to access"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to the owner or admins
        return obj.user == request.user or request.user.is_admin


class IsGroupAdmin(permissions.BasePermission):
    """Custom permission to allow admins to manage users in their group"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        # Admins can only manage users in their own group
        return obj.group_id == request.user.group_id or request.user.is_superadmin