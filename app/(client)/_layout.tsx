import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false,
      tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 } 
    }}>
      <Tabs.Screen
        name="coach" // Debe ser igual a app/(admin)/coach.tsx
        options={{
          title: 'Pendientes',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-clock" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alumnos" // Debe ser igual a app/(admin)/alumnos.tsx
        options={{
          title: 'Mis Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="AdminAlimnetos" // Debe ser igual a app/(admin)/AdminAlimnetos.tsx
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}