import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// We only need basic initialization to verify ID tokens
// without a service account credential if we provide the projectId
if (!getApps().length) {
  try {
    initializeApp({
      projectId: "agnidrishti-f8bbb",
    });
  } catch (error) {
    console.error("Firebase admin init error", error);
  }
}

export const firebaseAuth = getAuth();
