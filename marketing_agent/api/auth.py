import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from marketing_agent.configs.settings import get_settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        settings = get_settings()
        if settings.firebase_project_id and settings.firebase_client_email and settings.firebase_private_key:
            logger.info("Initializing Firebase Admin with explicit service account credentials.")
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key_id": "",
                "private_key": settings.firebase_private_key.replace('\\n', '\n'),
                "client_email": settings.firebase_client_email,
                "client_id": "",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.firebase_client_email}"
            })
            default_app = firebase_admin.initialize_app(cred)
        else:
            logger.info("Initializing Firebase Admin with Application Default Credentials.")
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
