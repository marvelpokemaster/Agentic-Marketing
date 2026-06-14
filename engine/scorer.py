import config

def score_lead(lead: dict, company_input: dict = None) -> dict:
    if company_input is None:
        company_input = {}

    weights = company_input.get("scoring_weights", config.DEFAULT_SCORING_WEIGHTS)
    keywords = company_input.get("menu_alignment_keywords", config.DEFAULT_MENU_ALIGNMENT_KEYWORDS)

    score = 0
    breakdown = {}

    has_phone = bool(lead.get("phone"))
    pts = weights.get("has_phone", 20) if has_phone else 0
    score += pts
    breakdown["has_phone"] = pts

    has_website = bool(lead.get("website"))
    pts = weights.get("has_website", 15) if has_website else 0
    score += pts
    breakdown["has_website"] = pts

    rating_val = lead.get("rating")
    if rating_val is None:
        rating_val = 0.0

    pts = round((min(max(rating_val, 0.0), 5.0) / 5.0) * weights.get("rating", 25))
    score += pts
    breakdown["rating"] = pts

    text_to_check = " ".join(filter(None, [
        lead.get("business_type"),
        lead.get("category"),
        lead.get("search_query"),
        lead.get("name"),
        lead.get("address")
    ])).lower()

    matched_keywords = [kw.lower() for kw in keywords if kw.lower() in text_to_check]
    alignment_ratio = min(len(matched_keywords) / 3, 1.0)
    pts = round(alignment_ratio * weights.get("menu_alignment", 25))
    score += pts
    breakdown["menu_alignment"] = pts
    breakdown["matched_keywords"] = matched_keywords

    open_text = (lead.get("open_status") or "").lower()
    is_open = "open" in open_text and "closed" not in open_text
    pts = weights.get("open_status", 15) if is_open else 0
    score += pts
    breakdown["open_status"] = pts

    if score >= 70:
        priority = "high"
    elif score >= 45:
        priority = "medium"
    else:
        priority = "low"

    scored_lead = lead.copy()
    scored_lead["score"] = score
    scored_lead["breakdown"] = breakdown
    scored_lead["priority"] = priority

    return scored_lead

def score_leads(leads: list[dict], company_input: dict = None) -> list[dict]:
    scored = [score_lead(lead, company_input) for lead in leads]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored
