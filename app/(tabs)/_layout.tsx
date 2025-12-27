import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const [isCoach, setIsCoach] = useState(false);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase().trim() === CORREO_COACH) {
        setIsCoach(true);
      } else {
        setIsCoach(false);
      }
    });
    return unsub;
  }, []);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6' }}>
      
      {/* 1. HOME (index.tsx): Esto es lo que ve el cliente */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Dieta', // Nombre para el cliente
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />

      {/* 2. PANEL COACH (coach.tsx): Solo lo ves tú (isCoach) */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Panel Coach',
          href: isCoach ? ("/coach" as any) : null, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-shield" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA (AdminAlimnetos.tsx): Solo la ves tú (isCoach) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          href: isCoach ? ("/AdminAlimnetos" as any) : null, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="book" size={20} color={color} />,
        }}
      />

      {/* EXPLORE: Lo dejamos oculto como ya lo tenías */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}
