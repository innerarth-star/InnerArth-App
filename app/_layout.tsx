import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const segments = useSegments();
  const router = useRouter();
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (loading) return;

    const isCoach = user?.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();
    
    // Forzamos a string para que TypeScript no chille con la comparación
    const firstSegment = segments[0] as string;
    const inAdminGroup = firstSegment === '(admin)';
    const inClientGroup = firstSegment === '(client)';

    if (!user) {
      // Si no hay usuario, aquí podrías mandar al Login
    } else if (isCoach && !inAdminGroup) {
      // Usamos 'as any' para que no valide la ruta mientras se actualiza el cache
      router.replace('/(admin)/coach' as any);
    } else if (!isCoach && !inClientGroup) {
      router.replace('/(client)/' as any);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(client)" />
    </Stack>
  );
}