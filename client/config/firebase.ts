import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "",
  authDomain: "spectra-app-f6cdf.firebaseapp.com",
  projectId: "spectra-app-f6cdf",
  storageBucket: "spectra-app-f6cdf.firebasestorage.app",
  messagingSenderId: "478124783057",
  appId: "1:478124783057:web:606b1828342a93a5375cf0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
