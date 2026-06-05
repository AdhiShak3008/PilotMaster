from fastapi import APIRouter

from pilotcore.models.registry import get_models

router = APIRouter()


@router.get("/")
def list_models():
    return get_models()
