/**
 * lib/firebaseClient.ts
 *
 * Real Firebase initialisation. lib/firebase.ts is intentionally left as a
 * stub; all Firebase usage should import from HERE.
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID          (optional but recommended)
 *
 * NOTE: Firebase Auth is a client-only SDK. We guard initialisation behind
 * `typeof window !== "undefined"` so Next.js static pre-rendering never
 * calls getAuth() with missing env vars.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialise on the client — never during SSR / static generation.
let app:  FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== "undefined") {
  app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
export default app;

/** Sign in with a Google popup. Safe to call only on the client. */
export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error("Firebase Auth is not initialised.");
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

/** Sign the current user out. */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
