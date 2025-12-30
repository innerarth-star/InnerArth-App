import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#3b82f6', 
        headerShown: false,
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 } 
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={20} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}