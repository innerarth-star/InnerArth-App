import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, Image, StyleSheet, Animated } from 'react-native';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0)); // Para una entrada suave del logo
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // Animación del logo al iniciar
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const unsub = onAuthStateChanged(auth, (u) => {
      // Damos un pequeño delay de 1.5s para que alcancen a ver tu marca/logo
      setTimeout(() => {
        setUser(u);
        setLoading(false);
      }, 1500); 
    });
    return unsub;
  }, []);

  // MIENTRAS CARGA O VERIFICA: Mostramos el Logo con diseño
  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          {/* REEMPLAZA ESTE URL POR TU LOGO LOCAL O REMOTO */}
          <Image 
            source={{ uri: 'https://tu-sitio-web.com/logo.png' }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />
        </Animated.View>
      </View>
    );
  }

  // REGLAS DE REDIRECCIÓN (Igual que tu lógica original)
  if (!user) return <Redirect href="/AuthScreen" />;
  
  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();
  return isCoach ? <Redirect href="/(admin)/coach" /> : <Redirect href="/(client)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Un fondo oscuro da más impacto y elegancia
  },
  logo: {
    width: 200,   // Ajusta el tamaño según tu logo
    height: 200,
    borderRadius: 20, // Opcional por si el logo es cuadrado
  },
});