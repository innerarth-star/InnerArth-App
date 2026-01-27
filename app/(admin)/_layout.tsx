import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6', // Azul para la pestaña activa
        tabBarInactiveTintColor: '#94a3b8', // Gris para las inactivas
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      {/* 1. PENDIENTES */}
      <Tabs.Screen
        name="pendientes"
        options={{
          title: 'Pendientes',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clock" size={18} color={color} />,
        }}
      />

      {/* 2. MIS ALUMNOS */}
      <Tabs.Screen
        name="alumnos"
        options={{
          title: 'Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={18} color={color} />,
        }}
      />

      {/* 3. EDITOR PLAN (Ruta oculta del menú pero accesible) */}
      <Tabs.Screen
        name="editorPlan"
        options={{
          title: 'Editor',
          href: null, // Esto oculta el botón de la barra de abajo
          tabBarButton: () => null, 
        }}
      />

      {/* 4. ADMIN ALIMENTOS */}
      <Tabs.Screen
        name="AdminAlimentos"
        options={{
          title: 'Biblioteca Alim.',
          tabBarIcon: ({ color }) => <FontAwesome5 name="apple-alt" size={18} color={color} />,
        }}
      />

      {/* 5. ADMIN EJERCICIOS */}
      <Tabs.Screen
        name="AdminEjercicios"
        options={{
          title: 'Biblioteca Ejerc.',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={18} color={color} />,
        }}
      />

      {/* 6. HISTORIAL */}
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <FontAwesome5 name="history" size={18} color={color} />,
        }}
      />
    </Tabs>
  );
}