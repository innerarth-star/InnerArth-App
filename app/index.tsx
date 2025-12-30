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
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  // ESTA LÍNEA ES LA QUE QUITA EL RECUADRO DE "MI PLAN"
  // Si no hay usuario, manda a login y NO LEE lo que sigue abajo.
  if (!user) return <Redirect href="/AuthScreen" />;

  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  if (isCoach) return <Redirect href="/(admin)/coach" />;
  
  return <Redirect href="/(client)" />;
}