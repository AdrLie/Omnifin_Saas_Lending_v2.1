"""
Backend apps package initializer.

This file ensures `backend.apps` is an explicit package and provides
an explicit `__all__` list for clarity. It also helps some tools that
require an `__init__.py` at each package level.
"""

__all__ = ["ai_integration", "analytics", "authentication", "commissions", "documents", "loans"]
