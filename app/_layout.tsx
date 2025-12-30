import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // 1. Temporizador de seguridad: si en 4 segundos no responde Firebase, manda al Login
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Firebase lento, forzando AuthScreen");
        router.replace('/AuthScreen' as any);
      }
    }, 4000);

    // 2. Escuchar a Firebase
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      clearTimeout(timer); // Cancelar el temporizador si Firebase responde

      if (!user) {
        router.replace('/AuthScreen' as any);
      } else {
        const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();
        if (isCoach) {
          router.replace('/(admin)/coach' as any);
        } else {
          router.replace('/(client)' as any);
        }
      }
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ marginTop: 15, color: '#64748b', fontSize: 12 }}>Iniciando sesión segura...</Text>
    </View>
  );
}