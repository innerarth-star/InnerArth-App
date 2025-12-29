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

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false, // Esto evita que el menú se suba o se encime
      tabBarStyle: !user ? { display: 'none' } : { display: 'flex', height: 60, paddingBottom: 8 } 
    }}>
      
      {/* 1. MI PLAN (index) - Solo para Alumnos */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // Si es coach, href es null para que no aparezca en su barra
          href: isCoach ? null : ("/" as any),
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. CLIENTES (coach) - Solo para el Administrador */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // Si NO es coach, href es null para ocultarlo del alumno
          href: isCoach ? ("/coach" as any) : null,
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA (AdminAlimnetos) - Solo para el Administrador */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // Si NO es coach, href es null para ocultarlo del alumno
          href: isCoach ? ("/AdminAlimnetos" as any) : null,
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      {/* EXPLORE: Siempre oculto */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}