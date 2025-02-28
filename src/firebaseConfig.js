// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "dotenv/config";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "featurerequest-549e3.firebaseapp.com",
    projectId: "featurerequest-549e3",
    storageBucket: "featurerequest-549e3.firebasestorage.app",
    messagingSenderId: "606009690697",
    appId: "1:606009690697:web:fc4023fe1ba0a7dae00d98",
    measurementId: "G-0XSVHWYZP1"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { db, auth, analytics };
