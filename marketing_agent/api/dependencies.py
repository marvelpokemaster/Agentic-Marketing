"""Shared FastAPI dependencies."""

from functools import lru_cache


from marketing_agent.orchestrator import MarketingOrchestrator
from firebase_admin import firestore


@lru_cache
def get_orchestrator() -> MarketingOrchestrator:
    """Singleton orchestrator injected into route handlers."""
    return MarketingOrchestrator()


def get_db():
    """Database session dependency (Firestore) for routing."""
    return firestore.client(database_id="marketing")

