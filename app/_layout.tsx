import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Esto ignora advertencias molestas de Firebase en la pantalla
    LogBox.ignoreLogs(['Setting a timer', 'AsyncStorage']);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Definimos las rutas principales */}
      <Stack.Screen name="index" />
      <Stack.Screen name="AuthScreen" />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
    </Stack>
  );
}