import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

// IMPORTA TUS PANTALLAS DIRECTAMENTE
import AuthScreen from './AuthScreen'; 
import CoachPanel from './(admin)/coach';
import ClienteScreen from './(client)'; // O como se llame tu pantalla de cliente

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // 1. SI NO HAY USUARIO: Login (Esto quita el recuadro de Mi Plan al instante)
  if (!user) {
    return <AuthScreen />;
  }

  // 2. SI HAY USUARIO: Verificamos si es Coach
  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  if (isCoach) {
    return <CoachPanel />;
  } 

  // 3. SI NO ES COACH: Es cliente
  return <ClienteScreen />;
}