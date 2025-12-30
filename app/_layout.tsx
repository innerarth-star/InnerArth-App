import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  // SI NO HAY USUARIO -> LOGIN
  if (!user) return <Redirect href="/AuthScreen" />;

  // SI HAY USUARIO -> QUE EXPO ROUTER DECIDA SEGÚN LAS CARPETAS
  // Esto evita la pantalla en blanco porque no forzamos una ruta manual
  return <Redirect href="/(client)" />; 
}