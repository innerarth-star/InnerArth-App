import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
        </Pressable>
        <Text style={styles.title}>{nombre || 'Historial'}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.info}>ID del Alumno: {id}</Text>
        <Text style={styles.msg}>Aquí gestionaremos los Planes (Plan 1, Plan 2, etc.)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5, marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20, alignItems: 'center', marginTop: 50 },
  info: { fontSize: 14, color: '#64748b' },
  msg: { fontSize: 16, marginTop: 10, color: '#1e293b', textAlign: 'center' }
});