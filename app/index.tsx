import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // Escuchamos a Firebase de forma limpia
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Mientras Firebase responde, mostramos un cargando para evitar el blanco
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // 1. SI NO HAY USUARIO: Manda al login (AuthScreen)
  if (!user) {
    return <Redirect href="/AuthScreen" />;
  }

  // 2. SI HAY USUARIO: Verificamos si es Coach o Cliente
  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  if (isCoach) {
    // Redirige a la pestaña de coach dentro de la carpeta (admin)
    return <Redirect href="/(admin)/coach" />;
  } else {
    // Redirige a la pestaña principal de la carpeta (client)
    return <Redirect href="/(client)" />;
  }
}