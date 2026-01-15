import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, Image, StyleSheet, Animated } from 'react-native';

export default function Index() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // 1. Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Escuchar Firebase
    const unsub = onAuthStateChanged(auth, (user) => {
      // Forzamos a que el logo se vea al menos 2.5 segundos para impacto visual
      setTimeout(() => {
        if (!user) {
          router.replace('/AuthScreen');
        } else {
          const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();
          if (isCoach) {
            router.replace('/(admin)/coach');
          } else {
            router.replace('/(client)');
          }
        }
        // Solo ocultamos la carga después de intentar navegar
        setLoadingAuth(false);
      }, 2500); 
    });

    return unsub;
  }, []);

  // Esta es la vista que DEBE aparecer
  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image 
          // Asegúrate de que el nombre coincida con tu archivo en assets
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
    backgroundColor: '#000000', // Fondo negro para que no se vea blanco
  },
  logo: {
    width: 250, 
    height: 250,
  },
});