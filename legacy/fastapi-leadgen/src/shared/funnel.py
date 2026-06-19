"""
src/shared/funnel.py
────────────────────
Lead funnel state transitions.
"""

FUNNEL_ORDER = ("scraped", "scored", "outreached", "opened", "replied", "converted")


def can_advance(current: str, new: str) -> bool:
    try:
        return FUNNEL_ORDER.index(new) > FUNNEL_ORDER.index(current)
    except ValueError:
        return False


def advance(current: str, new: str) -> str:
    return new if can_advance(current, new) else current
