def generate_outreach_message(lead: dict, company_input: dict) -> str:
    lead_name = lead.get("name", "there")
    business_type = lead.get("business_type", "business")
    keywords = lead.get("breakdown", {}).get("matched_keywords", [])
    rating = lead.get("rating")

    sender_name = company_input.get("sender_name", "Priya")
    company_name = company_input.get("company_name", "Artisan Loaf Bakery")
    product = company_input.get("product", "sourdough bread")
    location = company_input.get("seller_location", "Indiranagar, Bangalore")
    sender_email = company_input.get("sender_email", "sales@artisanloaf.com")

    if keywords:
        hook = f"We noticed {lead_name} serves {', '.join(keywords[:2])} — " \
               f"which pairs perfectly with freshly baked {product}."
    elif rating:
        hook = f"With a {rating} star rating, {lead_name} clearly has a great reputation — " \
               f"we'd love to be part of what makes it special."
    else:
        hook = f"We think {lead_name} could be a great fit for what we offer."

    proximity_line = f"We're based in {location} and deliver fresh every morning, " \
                     f"so logistics wouldn't be an issue."

    message = f"""Hi {lead_name} team,

My name is {sender_name} from {company_name}.

{hook}

We supply fresh {product} daily to {business_type}s across Bangalore. {proximity_line}

Would you be open to a quick call or a free sample drop this week?

Warm regards,
{sender_name}
{company_name}
{sender_email}"""

    return message.strip()

def generate_outreach_messages(leads: list[dict], company_input: dict) -> list[dict]:
    for lead in leads:
        lead["outreach_message"] = generate_outreach_message(lead, company_input)
    return leads
