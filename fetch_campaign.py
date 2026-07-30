import json
import firebase_admin
from firebase_admin import credentials, initialize_app, firestore

def print_campaign():
    if not firebase_admin._apps:
        cred = credentials.Certificate("agentic-marketing-firebase-key.json")
        initialize_app(cred)
    db = firestore.client(database_id="marketing")
    
    # Get latest campaign that has assets
    docs = db.collection("campaigns").order_by("created_at", direction=firestore.Query.DESCENDING).limit(5).stream()
    for doc in docs:
        data = doc.to_dict()
        if "results" in data and "assets" in data["results"] and len(data["results"]["assets"]) > 0:
            print(f"--- Campaign {doc.id} ---")
            top_level = data.get("assets", [])
            results_assets = data["results"].get("assets", [])
            
            print(f"TOP-LEVEL assets: {len(top_level)}")
            if top_level:
                print(json.dumps(top_level, indent=2))
                
            print(f"RESULTS assets: {len(results_assets)}")
            if results_assets:
                print(json.dumps(results_assets, indent=2))
            return
            
    print("No campaign found with results.assets")

if __name__ == "__main__":
    print_campaign()
