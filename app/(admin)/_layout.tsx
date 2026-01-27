import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#3b82f6',
      tabBarStyle: { height: 60, paddingBottom: 8 }
    }}>
      {/* 1. PENDIENTES */}
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
          title: 'Mis Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />

      {/* 3. BIBLIOTECA ALIMENTOS */}
      <Tabs.Screen
        name="AdminAlimentos"
        options={{
          title: 'Alimentos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="apple-alt" size={20} color={color} />,
        }}
      />

      {/* 4. BIBLIOTECA EJERCICIOS */}
      <Tabs.Screen
        name="AdminEjercicios"
        options={{
          title: 'Ejercicios',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={20} color={color} />,
        }}
      />

      {/* EDITOR PLAN (OCULTO DEL MENÚ INFERIOR) */}
      <Tabs.Screen
        name="editorPlan"
        options={{
          href: null, // Esto hace que no aparezca el botón abajo
          tabBarButton: () => null, // Doble seguridad para ocultarlo
        }}
      />
    </Tabs>
  );
}