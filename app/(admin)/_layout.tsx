import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#3b82f6', 
        headerShown: false,
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 } 
      }}>
        {/* 1. REVISIONES PENDIENTES */}
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Pendientes',
            tabBarIcon: ({ color }) => <FontAwesome5 name="user-clock" size={20} color={color} />,
          }}
        />

        {/* 2. ALUMNOS ACTIVOS (La nueva pantalla) */}
        <Tabs.Screen
          name="alumnos" // Esto debe coincidir con el nombre del archivo alumnos.tsx
          options={{
            title: 'Mis Alumnos',
            tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
          }}
        />

        {/* 3. BIBLIOTECA DE ALIMENTOS */}
        <Tabs.Screen
          name="AdminAlimentos"
          options={{
            title: 'Biblioteca',
            tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}