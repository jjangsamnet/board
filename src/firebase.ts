import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAvjKIncHjhAY41uDXiJVqFPIhLb3Uk82k",
  authDomain: "shared-board-57b39.firebaseapp.com",
  projectId: "shared-board-57b39",
  storageBucket: "shared-board-57b39.firebasestorage.app",
  messagingSenderId: "845709922988",
  appId: "1:845709922988:web:cf1881c7fbaf03b1d94509",
  measurementId: "G-1TFLZMZKJ3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
