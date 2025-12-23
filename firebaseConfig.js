import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Tu configuración real que pegaste arriba
const firebaseConfig = {
  apiKey: "AIzaSyAj6FmTquWaBKPB-46jjl5abFb6ZeEusqo",
  authDomain: "appfitnessrecomposicion.firebaseapp.com",
  projectId: "appfitnessrecomposicion",
  storageBucket: "appfitnessrecomposicion.firebasestorage.app",
  messagingSenderId: "663938688838",
  appId: "1:663938688838:web:b5a921eda949dced10e747",
  measurementId: "G-E4SG3R5QCK"
};

// Inicializamos la App
const app = initializeApp(firebaseConfig);

// Exportamos los servicios que usaremos en las pantallas
export const db = getFirestore(app);
export const auth = getAuth(app);