import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsXWlJhe7qVNDWS3DpTxVKOJFqxcyJyMU",
  authDomain: "agnidrishti-f8bbb.firebaseapp.com",
  projectId: "agnidrishti-f8bbb",
  storageBucket: "agnidrishti-f8bbb.firebasestorage.app",
  messagingSenderId: "160771223247",
  appId: "1:160771223247:web:15cc21d769cd10be4751ba",
  measurementId: "G-1TWZK2TZ68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Configure Google Provider with proper scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ensure auth persistence is set to browser local storage so sessions persist
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});

// Optionally analytics
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { analytics };
