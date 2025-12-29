import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6', 
      headerShown: false 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi Plan',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="AdminAlimnetos"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}