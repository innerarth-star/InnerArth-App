import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

// IMPORTA TUS CARPETAS DIRECTAMENTE
import AuthScreen from './AuthScreen'; 
import AdminLayout from './(admin)/_layout'; 
import ClientLayout from './(client)/_layout';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator/></View>;

  // --- LÓGICA DE HIERRO PARA IPHONE ---
  
  // Si no hay usuario, SOLO existe AuthScreen. 
  // Esto hace IMPOSIBLE que se vea "Mi Plan" porque ClienteLayout ni siquiera se carga.
  if (!user) return <AuthScreen />;

  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  if (isCoach) return <AdminLayout />;
  
  return <ClientLayout />;
}