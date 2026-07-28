import logging
from typing import Optional, Dict, Any
from firebase_admin import firestore
from google.cloud.firestore_v1.client import Client

logger = logging.getLogger(__name__)

class CampaignRepository:
    def __init__(self, db: Client):
        self.db = db

    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection('campaigns').document(campaign_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = campaign_id
        return data
        
    def get_product(self, product_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not product_id:
            return None
        doc_ref = self.db.collection('products').document(product_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = product_id
        return data

    def update_campaign(self, campaign_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection('campaigns').document(campaign_id)
        if not doc_ref.get().exists:
            return None
        
        # Firestore expects a dict for updates
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        if update_data:
            doc_ref.update(update_data)
        
        return self.get_campaign(campaign_id)

    def save_results(self, campaign_id: str, results: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection('campaigns').document(campaign_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
            
        current_data = doc.to_dict()
        current_results = current_data.get("results", {})
        current_results.update(results)
        
        doc_ref.update({"results": current_results})
        return self.get_campaign(campaign_id)
