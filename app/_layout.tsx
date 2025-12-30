import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Efecto para navegar cuando ya sabemos quién es el usuario
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/AuthScreen' as any);
      } else {
        // Por ahora, vamos a mandar a todos a (client) para probar que cargue
        router.replace('/(client)' as any);
      }
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ marginTop: 10, color: '#64748b' }}>Cargando aplicación...</Text>
    </View>
  );
}