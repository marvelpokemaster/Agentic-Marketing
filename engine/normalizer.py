import re
from datetime import datetime

def normalize_rating(rating_val) -> float | None:
    if not rating_val:
        return None
    try:
        if isinstance(rating_val, (int, float)):
            return float(rating_val)

        rating_val = str(rating_val).strip()
        parts = rating_val.split()
        for part in parts:
            match = re.search(r"\d+(\.\d+)?", part)
            if match:
                return float(match.group())
    except Exception:
        pass
    return None

def normalize_lead(lead_dict: dict) -> dict:
    name = lead_dict.get("name")
    phone = lead_dict.get("phone")
    website = lead_dict.get("website")
    address = lead_dict.get("address")
    rating = normalize_rating(lead_dict.get("rating"))
    open_status = lead_dict.get("open_status")
    category = lead_dict.get("category")
    source = lead_dict.get("source", "unknown")
    business_type = lead_dict.get("business_type")
    search_query = lead_dict.get("search_query")
    scraped_at = lead_dict.get("scraped_at") or datetime.utcnow().isoformat()

    if phone:
        phone = phone.strip()
        if not phone:
            phone = None

    if website:
        website = website.strip()
        if website and not (website.startswith("http://") or website.startswith("https://")):
            if not website.startswith("/"):
                website = "http://" + website
            else:
                website = "https://www.justdial.com" + website
    else:
        website = None

    return {
        "name": name,
        "phone": phone,
        "website": website,
        "address": address,
        "rating": rating,
        "open_status": open_status,
        "category": category,
        "source": source,
        "business_type": business_type,
        "search_query": search_query,
        "scraped_at": scraped_at
    }

def normalize_leads(raw_leads: list[dict]) -> list[dict]:
    normalized = []
    for lead in raw_leads:
        if not lead.get("name"):
            continue
        normalized.append(normalize_lead(lead))
    return normalized
