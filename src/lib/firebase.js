import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCDrFS7w7gIPo0k68WJ-aA_M99Bk9-7vfY",
    authDomain: "spent-48159.firebaseapp.com",
    projectId: "spent-48159",
    storageBucket: "spent-48159.firebasestorage.app",
    messagingSenderId: "686909666615",
    appId: "1:686909666615:web:1152eaca93a8cc3bcc56b2",
    measurementId: "G-7KBRKJW8SJ"
};

// ✅ Only initialize Firebase once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

export { auth };
