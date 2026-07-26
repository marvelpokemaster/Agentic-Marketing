import * as admin from 'firebase-admin';
import { serverConfig, firebaseConfig } from './config';

export function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const credential = serverConfig.serviceAccount.privateKey 
    ? admin.credential.cert({
        projectId: serverConfig.serviceAccount.projectId,
        clientEmail: serverConfig.serviceAccount.clientEmail,
        privateKey: serverConfig.serviceAccount.privateKey,
      })
    : admin.credential.applicationDefault();

  return admin.initializeApp({
    credential,
    storageBucket: firebaseConfig.storageBucket,
  });
}
