"""
Compatibility shim package for editor import resolution.

This package makes `import apps.xxx` resolve to the real apps located
under `backend/apps`. It updates the `__path__` to include the
`backend/apps` directory so static analyzers and the runtime can find
subpackages without changing PYTHONPATH in the editor.
"""
import os

# Insert the real apps directory (../backend/apps) at the front of __path__
_real_apps = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'apps'))
if os.path.isdir(_real_apps):
    __path__.insert(0, _real_apps)
