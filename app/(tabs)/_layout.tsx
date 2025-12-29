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

  // SI NO HAY USUARIO: No mostramos pestañas (para que el Login se vea bien)
  if (!user) {
    return (
      <Tabs screenOptions={{ tabBarStyle: { display: 'none' }, headerShown: false }} />
    );
  }

  // --- LA SOLUCIÓN DEFINITIVA: RENDERIZAR SEGÚN EL ROL ---

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: false }}>
      
      {/* 1. PESTAÑA MI PLAN: Solo existe si NO eres coach */}
      {!isCoach && (
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
          }}
        />
      )}

      {/* 2. PESTAÑA CLIENTES: Solo existe si ERES coach */}
      {isCoach && (
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
          }}
        />
      )}

      {/* 3. PESTAÑA BIBLIOTECA: Solo existe si ERES coach */}
      {isCoach && (
        <Tabs.Screen
          name="AdminAlimnetos"
          options={{
            title: 'Biblioteca',
            tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
          }}
        />
      )}

      {/* OCULTAR RUTAS SOBRANTES (OBLIGATORIO PARA QUE NO DEN ERROR) */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      {/* Si eres coach, index debe existir pero sin icono */}
      {isCoach && <Tabs.Screen name="index" options={{ href: null }} />}
      {/* Si eres alumno, las de coach deben existir pero sin icono */}
      {!isCoach && <Tabs.Screen name="coach" options={{ href: null }} />}
      {!isCoach && <Tabs.Screen name="AdminAlimnetos" options={{ href: null }} />}
    </Tabs>
  );
}