"""
src/lead_generation/test_cases.py
─────────────────────────────────
Ready-made business briefs for quickly testing the lead generation flow.

Each brief is plain free text — exactly what a real user would type. The
requirement extractor infers the search intent from it. Add a new entry here
and it shows up automatically in the UI's "Load a test case" dropdown.
"""

TEST_CASES = [
    {
        "id": "abc_bakers",
        "label": "ABC Bakers — artisanal bread (B2B food supply)",
        "default_scrapers": ["serpapi_google"],
        "test_client_email": "yadhuvipin12@gmail.com",
        "marketer_email": "yadhuvipin12@gmail.com",
        "brief": (
            "I am ABC Bakers, based in Indiranagar, Bangalore. We specialize in "
            "sourdough and artisanal bread and want to sell to cafes and restaurants "
            "in Indiranagar and Koramangala, Bangalore. We prefer businesses that "
            "have good customer traffic and premium positioning, and that are likely "
            "to place regular wholesale orders."
        ),
    },
    {
        "id": "local_services",
        "label": "BrightClean — commercial cleaning (local services)",
        "default_scrapers": ["serpapi_google"],
        "brief": (
            "We are BrightClean, a commercial cleaning company in Whitefield, "
            "Bangalore. We want to reach offices, gyms, and clinics in Whitefield "
            "and Marathahalli, Bangalore that need regular deep-cleaning contracts. "
            "We do best with mid-sized businesses that value hygiene and have a "
            "physical premises."
        ),
    },
    {
        "id": "d2c_fashion",
        "label": "Loom & Thread — apparel (D2C / wholesale)",
        "default_scrapers": ["serpapi_google"],
        "brief": (
            "Loom & Thread makes handwoven cotton apparel. We're looking for "
            "boutiques and lifestyle stores in Bandra and Andheri, Mumbai that stock "
            "premium, sustainable fashion and would carry our line on a wholesale "
            "basis."
        ),
    },
    {
        "id": "saas_b2b",
        "label": "FlowDesk — SaaS helpdesk (B2B software)",
        "default_scrapers": ["serpapi_google"],
        "brief": (
            "FlowDesk is a customer-support helpdesk SaaS. We want to find growing "
            "startups and small IT companies in Koramangala and HSR Layout, Bangalore "
            "that handle a lot of customer tickets and would benefit from automation."
        ),
    },
    {
        "id": "edtech",
        "label": "LearnLeap — tutoring platform (EdTech)",
        "default_scrapers": ["serpapi_google"],
        "brief": (
            "LearnLeap offers an online tutoring platform for K-12 students. We want "
            "to partner with schools and coaching centers in Jayanagar and "
            "Basavanagudi, Bangalore that have strong enrollment and are open to "
            "digital learning tools."
        ),
    },
    {
        "id": "health_fitness",
        "label": "PureFuel — protein snacks (health & fitness)",
        "default_scrapers": ["serpapi_google"],
        "brief": (
            "PureFuel produces high-protein snacks with no added sugar. We want to "
            "supply gyms, fitness studios, and health cafes in Indiranagar and HSR "
            "Layout, Bangalore that have an active, health-conscious clientele and "
            "sell supplements or snacks at the counter."
        ),
    },
]


def list_test_cases() -> list[dict]:
    out = []
    for tc in TEST_CASES:
        row = dict(tc)
        row.setdefault("test_client_email", "")
        row.setdefault("marketer_email", "")
        out.append(row)
    return out


def get_test_case(case_id: str) -> dict | None:
    tc = next((c for c in TEST_CASES if c["id"] == case_id), None)
    if not tc:
        return None
    row = dict(tc)
    row.setdefault("test_client_email", "")
    row.setdefault("marketer_email", "")
    return row
