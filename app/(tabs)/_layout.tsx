import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true); // Agregamos un estado de carga
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase().trim() === CORREO_COACH) {
        setIsCoach(true);
      } else {
        setIsCoach(false);
      }
      setLoading(false); // Ya sabemos quién es el usuario
    });
    return unsub;
  }, []);

  // Mientras verificamos el correo, podemos retornar null o un indicador de carga
  if (loading) return null;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6' }}>
      
      {/* 1. HOME: Visible para todos */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Dieta',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />

      {/* 2. PANEL COACH: Solo se renderiza si esCoach es true */}
      {isCoach && (
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Panel Coach',
            tabBarIcon: ({ color }) => <FontAwesome5 name="user-shield" size={20} color={color} />,
          }}
        />
      )}

      {/* 3. BIBLIOTECA: Solo se renderiza si esCoach es true */}
      {isCoach && (
        <Tabs.Screen
          name="AdminAlimnetos"
          options={{
            title: 'Biblioteca',
            tabBarIcon: ({ color }) => <FontAwesome5 name="book" size={20} color={color} />,
          }}
        />
      )}

      {/* EXPLORE: Oculto permanentemente */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}