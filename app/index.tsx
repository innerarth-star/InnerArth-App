import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig'; // Importamos db para consistencia
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { View, ActivityIndicator, Image, StyleSheet, Animated, Platform } from 'react-native';

export default function Index() {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // 1. Animación de entrada (Fade In del logo)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Escuchar el estado de autenticación
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Esperamos los 2.5 segundos que definiste para impacto visual
      setTimeout(async () => {
        if (!user) {
          // Si no hay usuario, al login
          router.replace('/AuthScreen');
        } else {
          // Limpieza de email para comparación segura
          const userEmail = user.email?.toLowerCase().trim();
          const coachEmail = CORREO_COACH.toLowerCase().trim();

          if (userEmail === coachEmail) {
            // Es el administrador
            router.replace('/(admin)/coach');
          } else {
            // Es un alumno
            router.replace('/(client)');
          }
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