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
      {/* Pestaña Principal */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />

      {/* Pestaña Explore (Opcional - puedes ocultarla si no la usas) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          href: null, // Esto oculta la pestaña por completo
          tabBarIcon: ({ color }) => <FontAwesome5 name="search" size={20} color={color} />,
        }}
      />

      {/* Pestaña de Coach - CONDICIONAL */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Panel Coach',
          // EL TRUCO ESTÁ AQUÍ: Si no es coach, href es null y desaparece
          href: isCoach ? '/coach' : null, 
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-shield" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
