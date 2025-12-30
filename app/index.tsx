import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

// IMPORTAMOS TUS PANTALLAS (Asegúrate de que estas rutas sean las correctas)
import AuthScreen from './AuthScreen'; 
import CoachPanel from './(admin)/coach';
import ClienteScreen from './(client)/index'; // <--- Tu archivo de cliente con todos sus menús

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

  // 1. SI NO HAY USUARIO: Login (Aquí se quita el recuadro fantasma)
  if (!user) {
    return <AuthScreen />;
  }

  // 2. VERIFICAR ROL
  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  // 3. RETORNAR LA PANTALLA COMPLETA (Sin pasar 'user' para evitar el error de TypeScript)
  if (isCoach) {
    return <CoachPanel />; 
  } else {
    return <ClienteScreen />;
  }
}