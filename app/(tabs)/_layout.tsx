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

  // SI NO HAY USUARIO, OCULTAMOS LA BARRA PARA EL LOGIN
  if (!user) {
    return (
      <Tabs screenOptions={{ tabBarStyle: { display: 'none' }, headerShown: false }}>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="coach" options={{ href: null }} />
        <Tabs.Screen name="AdminAlimnetos" options={{ href: null }} />
      </Tabs>
    );
  }

  // SI ES COACH: Solo dibujamos las pestañas de Coach
  if (isCoach) {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: false }}>
        <Tabs.Screen name="coach" options={{ 
          title: 'Clientes', 
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} /> 
        }} />
        <Tabs.Screen name="AdminAlimnetos" options={{ 
          title: 'Biblioteca', 
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} /> 
        }} />
        <Tabs.Screen name="index" options={{ href: null }} /> {/* Oculto para coach */}
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    );
  }

  // SI ES ALUMNO: Solo dibujamos la pestaña de Mi Plan
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: false }}>
      <Tabs.Screen name="index" options={{ 
        title: 'Mi Plan', 
        tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} /> 
      }} />
      <Tabs.Screen name="coach" options={{ href: null }} /> {/* Oculto para alumno */}
      <Tabs.Screen name="AdminAlimnetos" options={{ href: null }} /> {/* Oculto para alumno */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}