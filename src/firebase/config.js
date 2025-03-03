import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDWVaQNUzn9ySvTkVr9hqdma9rHchbu9Hs",
    authDomain: "scribble-web-195bb.firebaseapp.com",
    databaseURL: "https://scribble-web-195bb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "scribble-web-195bb",
    storageBucket: "scribble-web-195bb.firebasestorage.app",
    messagingSenderId: "784856284128",
    appId: "1:784856284128:web:4b36ea3ab7919db51b8985"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };