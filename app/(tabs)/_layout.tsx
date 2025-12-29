import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verificamos si es el coach
        setIsCoach(currentUser.email?.toLowerCase().trim() === CORREO_COACH);
      } else {
        setUser(null);
        setIsCoach(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // 1. MIENTRAS CARGA: Mostramos un indicador para que no "parpadeen" las pestañas
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // 2. SI NO HAY USUARIO: Ocultamos todas las pestañas (href: null) 
  // Esto obliga a que se quede en la pantalla de Auth si no ha iniciado sesión
  if (!user) {
    return (
      <Tabs screenOptions={{ tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="coach" options={{ href: null }} />
        <Tabs.Screen name="AdminAlimnetos" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    );
  }

  // 3. SI HAY USUARIO: Mostramos solo lo que le corresponde
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6' }}>
      
      {/* Mi Dieta: Siempre visible para Alumno y Coach logueados */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Dieta',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />

      {/* Panel Coach: SOLO si es el correo del coach */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Panel Coach',
          href: isCoach ? undefined : null, // Si no es coach, desaparece
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-shield" size={20} color={color} />,
        }}
      />

      {/* Biblioteca: SOLO si es el correo del coach */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          href: isCoach ? undefined : null, // Si no es coach, desaparece
          tabBarIcon: ({ color }) => <FontAwesome5 name="book" size={20} color={color} />,
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}