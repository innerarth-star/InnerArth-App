import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { 
          height: 70, 
          paddingBottom: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0'
        },
      }}
    >
      {/* 1. PENDIENTES - PRIMERA PESTAÑA */}
      <Tabs.Screen
        name="pendientes"
        options={{
          title: 'Pendientes',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clock" size={20} color={color} />,
        }}
      />

      {/* 2. MIS ALUMNOS */}
      <Tabs.Screen
        name="alumnos"
        options={{
          title: 'Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. ALIMENTOS */}
      <Tabs.Screen
        name="AdminAlimentos"
        options={{
          title: 'Alimentos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="apple-alt" size={20} color={color} />,
        }}
      />

      {/* 4. EJERCICIOS */}
      <Tabs.Screen
        name="AdminEjercicios"
        options={{
          title: 'Ejercicios',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={20} color={color} />,
        }}
      />

      {/* RUTAS QUE NO TIENEN BOTÓN ABAJO */}
      <Tabs.Screen
        name="editorPlan"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="historial"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}