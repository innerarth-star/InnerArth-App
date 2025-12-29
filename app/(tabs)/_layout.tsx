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
      setUser(currentUser);
      setIsCoach(currentUser?.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim());
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
      // Si no hay usuario, ocultamos la barra
      tabBarStyle: !user ? { display: 'none' } : { display: 'flex' }
    }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          // Solo se ve el icono si NO eres coach
          tabBarItemStyle: isCoach ? { display: 'none' } : {},
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          // Solo se ve el icono si ERES coach
          tabBarItemStyle: !isCoach ? { display: 'none' } : {},
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          // Solo se ve el icono si ERES coach
          tabBarItemStyle: !isCoach ? { display: 'none' } : {},
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}