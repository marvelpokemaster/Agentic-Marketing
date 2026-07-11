import os
import psycopg

db_url = "postgresql://postgres:6Kui6oesHRTBJtwv@db.ughladkskmwfgeadjhvt.supabase.co:5432/postgres"

def main():
    print("Connecting to DB...")
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            print("Fetching campaigns...")
            cur.execute("SELECT id, user_id, product_name, workflow, status, created_at FROM campaigns LIMIT 10;")
            campaigns = cur.fetchall()
            print(f"Found {len(campaigns)} campaigns:")
            for c in campaigns:
                print(f"ID: {c[0]}, User ID: {c[1]}, Product: {c[2]}, Workflow: {c[3]}, Status: {c[4]}, Created: {c[5]}")

            print("\nFetching campaign assets...")
            cur.execute("SELECT id, campaign_id, platform, headline, body, hashtags, status FROM campaign_assets LIMIT 5;")
            assets = cur.fetchall()
            print(f"Found {len(assets)} assets:")
            for a in assets:
                print(f"ID: {a[0]}, Campaign ID: {a[1]}, Platform: {a[2]}, Headline: {a[3]}, Body: {a[4][:30]}..., Hashtags: {a[5]}, Status: {a[6]}")

if __name__ == "__main__":
    main()
