"""Lead scoring (Gemini with heuristic fallback)."""

from src.lead_generation.scoring.scorer import score_lead, score_leads

__all__ = ["score_lead", "score_leads"]
