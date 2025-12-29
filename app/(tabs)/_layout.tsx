import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth.coach@gmail.com"; // Asegúrate que sea exactamente tu correo

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsCoach(currentUser.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim());
      } else {
        setUser(null);
        setIsCoach(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // SI NO HAY SESIÓN, OCULTAMOS LA BARRA POR COMPLETO
  if (!user) {
    return <Tabs screenOptions={{ tabBarStyle: { display: 'none' }, headerShown: false }} />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: false }}>
      
      {/* 1. MI PLAN (Para el Alumno) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // Si eres Coach, ocultamos esta pestaña físicamente
          tabBarButton: isCoach ? () => null : undefined,
          tabBarStyle: isCoach ? { display: 'none' } : { display: 'flex' },
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. CLIENTES (Para el Coach) */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // Si NO eres Coach, esta pestaña desaparece
          tabBarButton: !isCoach ? () => null : undefined,
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA (Para el Coach) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // Si NO eres Coach, esta pestaña desaparece
          tabBarButton: !isCoach ? () => null : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      {/* OCULTAR SIEMPRE EXPLORE */}
      <Tabs.Screen name="explore" options={{ href: null, tabBarButton: () => null }} />
    </Tabs>
  );
}