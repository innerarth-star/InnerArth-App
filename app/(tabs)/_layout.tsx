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
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsCoach(currentUser.email?.toLowerCase().trim() === CORREO_COACH);
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

  // SI NO HAY SESIÓN, OCULTAMOS TODO
  if (!user) {
    return <Tabs screenOptions={{ tabBarStyle: { display: 'none' } }} />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: false }}>
      
      {/* 1. VISTA DEL CLIENTE (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // Solo mostramos si NO es coach. Forzamos con 'as any' para evitar el error de TypeScript
          href: !isCoach ? ("/index" as any) : null,
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. VISTA DEL COACH / CLIENTES (coach.tsx) */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // Solo mostramos si ES coach
          href: isCoach ? ("/coach" as any) : null,
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA DE ALIMENTOS (AdminAlimnetos.tsx) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // Solo mostramos si ES coach
          href: isCoach ? ("/AdminAlimnetos" as any) : null,
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      {/* OCULTAR EXPLORE SIEMPRE */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}