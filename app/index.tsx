import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const CORREO_COACH = "inner.arth@gmail.com"; // Asegúrate que sea este

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        // Limpiamos espacios y pasamos a minúsculas para comparar
        const emailLimpio = user.email.toLowerCase().trim();
        setIsCoach(emailLimpio === CORREO_COACH.toLowerCase().trim());
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  // LA MAGIA: Si eres coach, te manda a (admin), si no a (client)
  // @ts-ignore
  return isCoach ? <Redirect href="/(admin)/coach" /> : <Redirect href="/(client)/" />;
}