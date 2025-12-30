import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function AdminLayout() {
  return (
    // El flex: 1 es vital para que ocupe toda la pantalla correctamente
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#3b82f6', 
        headerShown: false,
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 } 
      }}>
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
      </Tabs>
    </SafeAreaView>
  );
}