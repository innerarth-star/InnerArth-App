import { Slot } from 'expo-router';
// Importamos esto para arreglar el error de Android de la pantalla "movida"
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}