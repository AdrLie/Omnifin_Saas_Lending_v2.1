"""
WSGI configuration for Omnifin Platform
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'omnifin.settings')

application = get_wsgi_application()