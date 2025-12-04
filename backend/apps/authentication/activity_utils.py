"""
Activity logging utilities
"""

from apps.authentication.models import UserActivity


def log_activity(user, activity_type, description, metadata=None, request=None):
    """
    Log user activity
    
    Args:
        user: User instance
        activity_type: Type of activity (from UserActivity.ACTIVITY_TYPES)
        description: Description of the activity
        metadata: Optional dict with additional data
        request: Optional request object to capture IP and user agent
    """
    ip_address = None
    user_agent = None
    
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    UserActivity.objects.create(
        user=user,
        activity_type=activity_type,
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent
    )
