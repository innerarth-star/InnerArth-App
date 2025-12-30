import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const isCoach = u.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();
        setRole(isCoach ? 'coach' : 'alumno');
      } else {
        setUser(null);
        setRole(null);
      }
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

  // 1. SI NO HAY USUARIO: Login
  if (!user) {
    return <Redirect href="/AuthScreen" />;
  }

  // 2. SI ES COACH: Manda a la carpeta admin (donde están tus menús de coach)
  if (role === 'coach') {
    return <Redirect href="/(admin)/coach" />;
  } 

  // 3. SI ES ALUMNO: Manda a la carpeta client (donde están tus menús de cliente)
  return <Redirect href="/(client)" />;
}