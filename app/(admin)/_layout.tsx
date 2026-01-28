import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarStyle: { height: 70, paddingBottom: 10 },
      }}
    >
      {/* 1. PENDIENTES - Esta es tu pantalla principal de gestión */}
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
          title: 'Mis Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={18} color={color} />,
        }}
      />

      {/* 3. ADMIN ALIMENTOS */}
      <Tabs.Screen
        name="AdminAlimentos"
        options={{
          title: 'Alimentos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="apple-alt" size={18} color={color} />,
        }}
      />

      {/* 4. ADMIN EJERCICIOS */}
      <Tabs.Screen
        name="AdminEjercicios"
        options={{
          title: 'Ejercicios',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={18} color={color} />,
        }}
      />

      {/* RUTAS OCULTAS (Existen pero no tienen botón en el menú de abajo) */}
      
      <Tabs.Screen
        name="editorPlan"
        options={{ href: null }} 
      />

      <Tabs.Screen
        name="historial"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="coach"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="expedienteDetalle"
        options={{ href: null }}
      />
    </Tabs>
  );
}