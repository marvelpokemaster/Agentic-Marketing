"""Unit tests for SerpApi parser and domain dedupe."""

from src.lead_generation.scrapers.serpapi_parser import (
    dedupe_by_domain,
    parse_response,
    parse_pages,
)

ORGANIC_FIXTURE = {
    "organic_results": [
        {
            "title": "Toit Brewpub",
            "link": "https://toit.in/",
            "displayed_link": "toit.in",
            "snippet": "Craft beer brewpub",
            "position": 1,
        },
        {
            "title": "Facebook Page",
            "link": "https://facebook.com/toit",
            "snippet": "skip",
            "position": 2,
        },
    ],
    "local_results": {
        "places": [
            {"title": "Local Cafe", "phone": "+91 98765 43210", "address": "Indiranagar"}
        ]
    },
    "knowledge_graph": {"title": "ABC Corp", "website": "https://abc.com", "phone": "+91 90000 11111"},
    "search_information": {"total_results": 1000},
}


def test_parse_organic_skips_social():
    r = parse_response(ORGANIC_FIXTURE)
    assert len(r.organic_candidates) == 1
    assert r.organic_candidates[0]["name"] == "Toit Brewpub"


def test_parse_direct_leads():
    r = parse_response(ORGANIC_FIXTURE)
    assert len(r.direct_leads) == 2


def test_dedupe_by_domain():
    rows = [
        {"name": "A", "website": "https://example.com/page1"},
        {"name": "B", "website": "https://www.example.com/page2"},
    ]
    assert len(dedupe_by_domain(rows)) == 1


def test_missing_sections():
    r = parse_response({})
    assert r.organic_candidates == []
    assert r.direct_leads == []


def test_parse_pages_merges():
    r = parse_pages([ORGANIC_FIXTURE, {"organic_results": []}])
    assert len(r.organic_candidates) >= 1


def test_website_enricher_extracts_contact():
    from src.lead_generation.scrapers import website_enricher as we

    html = """
    <html><head><title>Acme Cafe | Home</title></head>
    <body>Call us at +91 98765 43210 or email
    <a href="mailto:hello@acme.in">hello@acme.in</a></body></html>
    """
    row = {"name": "Acme", "website": "https://acme.in"}
    we._fetch_html = lambda url: html
    enriched = we.enrich_row(row)
    assert enriched.get("email") == "hello@acme.in"
    assert enriched.get("phone")


def test_website_enricher_fetches_contact_page():
    from src.lead_generation.scrapers import website_enricher as we

    pages = {
        "https://shop.example.com/": "<html><body>Welcome to our store</body></html>",
        "https://shop.example.com/contact": (
            '<html><body>Email <a href="mailto:sales@shop.example.com">sales@shop.example.com</a></body></html>'
        ),
    }
    we._fetch_html = lambda url: pages.get(url, "")
    enriched = we.enrich_row({"name": "Shop", "website": "https://shop.example.com/"})
    assert enriched.get("email") == "sales@shop.example.com"
    assert enriched["metadata"].get("pages_fetched", 0) >= 2


def test_website_enricher_cloudflare_email():
    from src.lead_generation.scrapers import website_enricher as we

    encoded = "5724363b322417243f3827793e39"  # sales@shop.in
    html = f'<span class="__cf_email__" data-cfemail="{encoded}"></span>'
    assert we._extract_email(html, "shop.in") == "sales@shop.in"


def test_website_enricher_json_ld():
    from src.lead_generation.scrapers import website_enricher as we

    html = """
    <script type="application/ld+json">
    {"@type":"LocalBusiness","email":"bookings@cafe.in","telephone":"+91 91234 56789"}
    </script>
    """
    assert we._extract_email(html, "cafe.in") == "bookings@cafe.in"
    assert we._extract_phone(html)
