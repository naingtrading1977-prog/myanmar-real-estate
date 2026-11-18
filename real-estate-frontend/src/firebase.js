// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMOl9XqZJp_hwK43eHQ3y95X18cqyCCWw",
  authDomain: "myanmar-real-estate-aa2de.firebaseapp.com",
  projectId: "myanmar-real-estate-aa2de",
  storageBucket: "myanmar-real-estate-aa2de.firebasestorage.app",
  messagingSenderId: "756417776493",
  appId: "1:756417776493:web:0cc7f87ebf7126125c6864",
  measurementId: "G-1FLP339ZKZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
