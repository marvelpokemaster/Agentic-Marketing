import re
from urllib.parse import urlparse

def clean_string(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())

def extract_domain(url: str | None) -> str | None:
    if not url:
        return None
    if "justdial.com" in url:
        return None
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc or parsed.path
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.lower().strip()
    except Exception:
        return None

def merge_leads(primary: dict, secondary: dict) -> dict:
    merged = primary.copy()

    for key in ["phone", "website", "address", "rating", "open_status", "category", "business_type", "search_query"]:
        if not merged.get(key) and secondary.get(key):
            merged[key] = secondary[key]

    sources = set(primary.get("source", "").split(", "))
    sources.update(secondary.get("source", "").split(", "))
    merged["source"] = ", ".join(sorted(filter(None, sources)))

    r1 = primary.get("rating")
    r2 = secondary.get("rating")
    if r1 is not None and r2 is not None:
        merged["rating"] = round((r1 + r2) / 2, 1)

    return merged

def deduplicate_leads(leads: list[dict]) -> list[dict]:
    unique_leads = []
    phone_index = {}
    domain_index = {}
    name_addr_index = {}

    for lead in leads:
        matched_idx = None

        phone = lead.get("phone")
        if phone:
            cleaned_phone = re.sub(r"\D", "", phone)
            if len(cleaned_phone) >= 7 and cleaned_phone in phone_index:
                matched_idx = phone_index[cleaned_phone]

        if matched_idx is None:
            domain = extract_domain(lead.get("website"))
            if domain and domain in domain_index:
                matched_idx = domain_index[domain]

        if matched_idx is None:
            c_name = clean_string(lead.get("name"))
            c_addr = clean_string(lead.get("address"))[:15]
            name_addr_key = f"{c_name}|{c_addr}"
            if c_name and name_addr_key in name_addr_index:
                matched_idx = name_addr_index[name_addr_key]

        if matched_idx is not None:
            unique_leads[matched_idx] = merge_leads(unique_leads[matched_idx], lead)
        else:
            new_idx = len(unique_leads)
            unique_leads.append(lead)

            if phone:
                cleaned_phone = re.sub(r"\D", "", phone)
                if len(cleaned_phone) >= 7:
                    phone_index[cleaned_phone] = new_idx

            domain = extract_domain(lead.get("website"))
            if domain:
                domain_index[domain] = new_idx

            c_name = clean_string(lead.get("name"))
            c_addr = clean_string(lead.get("address"))[:15]
            name_addr_key = f"{c_name}|{c_addr}"
            if c_name:
                name_addr_index[name_addr_key] = new_idx

    return unique_leads
