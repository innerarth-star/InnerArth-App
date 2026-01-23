import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig'; 
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, Image, StyleSheet, Animated, Platform } from 'react-native';

export default function Index() {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // 1. Animación corregida para Web
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      // FIX: useNativeDriver debe ser false en Web para evitar el error que mencionaste
      useNativeDriver: Platform.OS !== 'web', 
    }).start();

    // 2. Escuchar el estado de autenticación
    const unsub = onAuthStateChanged(auth, (user) => {
      // Usamos un bloque try/catch para ver errores de ruta en la consola
      setTimeout(() => {
        try {
          if (!user) {
            router.replace('/AuthScreen');
          } else {
            const userEmail = user.email?.toLowerCase().trim();
            const coachEmail = CORREO_COACH.toLowerCase().trim();

            if (userEmail === coachEmail) {
              console.log("Navegando a Coach...");
              router.replace('/(admin)/coach');
            } else {
              console.log("Navegando a Alumno...");
              // IMPORTANTE: Verifica que la carpeta se llame exactamente (client)
              router.replace('/(client)');
            }
          }
        } catch (error) {
          console.error("Error en la navegación:", error);
        }
      }, 2500);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image 
          source={require('../assets/images/splash-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 30 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logo: {
    width: 250, 
    height: 250,
  },
});