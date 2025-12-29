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

  const tabStyle = !user ? { display: 'none' } : { display: 'flex' };

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false,
      tabBarStyle: tabStyle as any 
    }}>
      
      {/* 1. MI PLAN (index) - Solo para alumnos */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          href: (user && !isCoach) ? ("/" as any) : null,
          // Si es Coach, borramos el botón de la barra
          tabBarButton: isCoach ? () => null : undefined, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. CLIENTES (coach) - Solo para Coach */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          href: (user && isCoach) ? ("/coach" as any) : null,
          // Si NO es Coach, borramos el botón de la barra
          tabBarButton: !isCoach ? () => null : undefined,
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA (AdminAlimnetos) - Solo para Coach */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          href: (user && isCoach) ? ("/AdminAlimnetos" as any) : null,
          // Si NO es Coach, borramos el botón de la barra
          tabBarButton: !isCoach ? () => null : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      {/* OCULTAR SIEMPRE EXPLORE */}
      <Tabs.Screen name="explore" options={{ href: null, tabBarButton: () => null }} />
    </Tabs>
  );
}