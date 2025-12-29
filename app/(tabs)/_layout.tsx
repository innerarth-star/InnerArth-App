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

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false,
      // Si no hay usuario, ocultamos la barra globalmente
      tabBarStyle: !user ? { display: 'none' } : { display: 'flex' }
    }}>
      
      {/* 1. MI PLAN (index) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // EL TRUCO: Si es coach, ocultamos esta pestaña específica
          tabBarStyle: isCoach ? { display: 'none' } : { display: 'flex' },
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      {/* 2. CLIENTES (coach) */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // EL TRUCO: Si NO es coach, ocultamos esta pestaña específica
          tabBarStyle: !isCoach ? { display: 'none' } : { display: 'flex' },
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA (AdminAlimnetos) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // EL TRUCO: Si NO es coach, ocultamos esta pestaña específica
          tabBarStyle: !isCoach ? { display: 'none' } : { display: 'flex' },
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}