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

  // Si no hay usuario, la barra no existe
  const tabBarStyle = !user ? { display: 'none' } : { display: 'flex' };

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false,
      tabBarStyle: tabBarStyle as any 
    }}>
      
      {/* 1. CONFIGURACIÓN PARA EL ALUMNO */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // EL SECRETO: Si es Coach, esta pestaña se vuelve invisible e intocable
          href: isCoach ? null : "/",
          tabBarButton: isCoach ? () => <View /> : undefined, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. CONFIGURACIÓN PARA EL COACH (CLIENTES) */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // EL SECRETO: Si NO es Coach, esta pestaña se vuelve invisible e intocable
          href: isCoach ? "/coach" : null,
          tabBarButton: !isCoach ? () => <View /> : undefined,
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. CONFIGURACIÓN PARA EL COACH (BIBLIOTECA) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // EL SECRETO: Si NO es Coach, esta pestaña se vuelve invisible e intocable
          href: isCoach ? "/AdminAlimnetos" : null,
          tabBarButton: !isCoach ? () => <View /> : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      {/* EXPLORE SIEMPRE OCULTO */}
      <Tabs.Screen name="explore" options={{ href: null, tabBarButton: () => <View /> }} />
    </Tabs>
  );
}