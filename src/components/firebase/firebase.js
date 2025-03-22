import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDGmK74g3VNcAxirm-XVKa6UCUgLiu7SiA",
  authDomain: "chattz-43e18.firebaseapp.com",
  projectId: "chattz-43e18",
  storageBucket: "chattz-43e18.firebasestorage.app", // Updated to match your storage path
  messagingSenderId: "346115456223",
  appId: "1:346115456223:web:46b5ec9a71905fcb62bd6a",
  measurementId: "G-QNHRGBJ3YX",
  databaseURL: "https://chattz-43e18-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();