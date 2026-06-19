"""
src/marketing/test_cases.py
───────────────────────────
Ready-made ad briefs for quickly testing the AI marketing flow.

Each brief is a full campaign request (product + settings). Selecting one in
the UI fills the form so you can generate an ad in one click. Add an entry
here and it shows up in the "Load a test case" dropdown automatically.
"""

TEST_CASES = [
    {
        "id": "abc_bakers",
        "label": "ABC Bakers — artisanal sourdough",
        "product": "Handcrafted sourdough bread, naturally fermented for 24 hours with no preservatives.",
        "objective": "Drive wholesale orders from cafes and restaurants",
        "audience": "Premium cafes and restaurants",
        "tone": "Premium",
        "platform": "Instagram",
        "branding": "Earthy tones, rustic bakery aesthetic, warm natural light",
    },
    {
        "id": "purefuel_snacks",
        "label": "PureFuel — high-protein snacks",
        "product": "High-protein snack bars with no added sugar, made for active lifestyles.",
        "objective": "Increase direct-to-consumer sales",
        "audience": "Gym-goers and health-conscious millennials",
        "tone": "Bold",
        "platform": "Instagram",
        "branding": "Vibrant energetic colors, dynamic action shots",
    },
    {
        "id": "loom_thread",
        "label": "Loom & Thread — sustainable apparel",
        "product": "Handwoven organic cotton apparel, ethically made by local artisans.",
        "objective": "Build brand awareness for a new collection",
        "audience": "Eco-conscious urban shoppers, 25-40",
        "tone": "Minimal",
        "platform": "Facebook",
        "branding": "Muted natural palette, clean editorial layout",
    },
    {
        "id": "flowdesk_saas",
        "label": "FlowDesk — helpdesk SaaS",
        "product": "An AI-powered customer-support helpdesk that automates ticket triage.",
        "objective": "Generate sign-ups for a free trial",
        "audience": "Startup founders and support team leads",
        "tone": "Professional",
        "platform": "LinkedIn",
        "branding": "Modern tech look, blue accent, clean dashboard mockup",
    },
    {
        "id": "learnleap_edtech",
        "label": "LearnLeap — tutoring platform",
        "product": "An online tutoring platform for K-12 students with live expert tutors.",
        "objective": "Drive parent enrollments before the new term",
        "audience": "Parents of school-age children",
        "tone": "Friendly",
        "platform": "Instagram",
        "branding": "Bright, cheerful, approachable; kids learning happily",
    },
    {
        "id": "brightclean_services",
        "label": "BrightClean — commercial cleaning",
        "product": "Professional deep-cleaning contracts for offices, gyms, and clinics.",
        "objective": "Book recurring cleaning contracts",
        "audience": "Office and facility managers",
        "tone": "Professional",
        "platform": "Generic",
        "branding": "Crisp, spotless interiors, fresh blue-and-white palette",
    },
]


def list_test_cases() -> list[dict]:
    return TEST_CASES
