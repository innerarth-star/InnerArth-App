import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function ClientLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#10b981', // Verde para el cliente, diferenciándolo del azul del admin
      headerShown: false,
      tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 } 
    }}>
      {/* Pestaña 1: Tu index.tsx actual (El cuestionario) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Registro',
          tabBarIcon: ({ color }) => <FontAwesome5 name="file-alt" size={20} color={color} />,
        }}
      />
      
      {/* Pestaña 2: El nuevo archivo plan.tsx (Dieta y Rutina) */}
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Mi Plan',
          tabBarIcon: ({ color }) => <Ionicons name="fitness" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}