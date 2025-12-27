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
      {/* Pestaña Principal (Esta no se mueve, es tu código perfecto) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />

      {/* Pestaña Explore (Oculta) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          href: null,
          tabBarIcon: ({ color }) => <FontAwesome5 name="search" size={20} color={color} />,
        }}
      />

      {/* Pestaña de Coach - CONDICIONAL */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Panel Coach',
          href: isCoach ? '/coach' : null, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-shield" size={20} color={color} />,
        }}
      />

      {/* NUEVA PESTAÑA: Biblioteca de Alimentos (Excel 1g) */}
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          href: isCoach ? ("/AdminAlimnetos" as any) : null, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="book" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
