import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
} from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      email: string | null;
    }[];
  }
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Background fire and forget logging to system_logs if possible
  if (auth?.currentUser && db) {
    addDoc(collection(db, 'system_logs'), {
      level: 'error',
      source: `firestore/${operationType}`,
      message: `Error at path ${path}: ${errMessage}`,
      timestamp: new Date().toISOString(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      stack: error instanceof Error ? error.stack : undefined
    }).catch(e => console.error("Failed to write to system_logs", e));
  }

  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    
    // Handle specific common errors in the AI Studio environment
    if (error.code === 'auth/network-request-failed') {
      throw new Error("Network request failed. This is often caused by ad-blockers, strict privacy settings, or a VPN blocking Firebase domains. Please try disabling ad-blockers or using a different browser.");
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error("The sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error("The sign-in process was cancelled. Please try again.");
    }
    
    throw error;
  }
};

export const logout = async () => {
  return auth.signOut();
};
