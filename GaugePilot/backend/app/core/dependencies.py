from fastapi import Depends

# Reuse DocPilot's auth/db wiring if available in this monorepo.
# This keeps GaugePilot thin while preserving existing behavior.
from DocPilot.backend.app.core.dependencies import get_current_user  # noqa: F401
