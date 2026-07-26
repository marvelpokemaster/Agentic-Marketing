import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        # Use default credential if available (e.g. Google Cloud Run)
        # or load from service account if needed.
        # Since this is a BFF/Backend, we can use the default GOOGLE_APPLICATION_CREDENTIALS
        default_app = firebase_admin.initialize_app()
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify the Firebase ID token and return the user's UID.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get('uid')
        if not uid:
            raise HTTPException(status_code=401, detail="UID missing from token")
        return uid
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase ID token has expired")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase ID token has been revoked")
    except Exception as e:
        logger.error(f"Error verifying Firebase ID token: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
