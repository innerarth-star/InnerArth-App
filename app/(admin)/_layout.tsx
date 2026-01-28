import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

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
        },
      }}
    >
      <Tabs.Screen
        name="pendientes"
        options={{
          title: 'Pendientes',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clock" size={18} color={color} />,
        }}
      />

      <Tabs.Screen
        name="alumnos"
        options={{
          title: 'Alumnos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={18} color={color} />,
        }}
      />

      {/* Editor Plan: Ponemos href: undefined para asegurar que cargue */}
      <Tabs.Screen
        name="editorPlan"
        options={{
          title: 'Editor',
          tabBarButton: () => null, // Esto lo oculta visualmente pero deja la ruta activa
        }}
      />

      <Tabs.Screen
        name="AdminAlimentos"
        options={{
          title: 'Alimentos',
          tabBarIcon: ({ color }) => <FontAwesome5 name="apple-alt" size={18} color={color} />,
        }}
      />

      <Tabs.Screen
        name="AdminEjercicios"
        options={{
          title: 'Ejercicios',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={18} color={color} />,
        }}
      />

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