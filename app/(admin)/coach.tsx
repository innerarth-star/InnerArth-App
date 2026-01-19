import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig'; 
import { collection, onSnapshot, query } from 'firebase/firestore';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'revisiones_pendientes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
  );

  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => { alert("Aceptado"); setAlumnoSeleccionado(null); }}
        onReject={() => setAlumnoSeleccionado(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.webContainer}>
          <Text style={styles.title}>Cuestionarios Recibidos</Text>
          <Text style={styles.subtitle}>{alumnos.length} pendientes de revisión</Text>
        </View>
      </View>
      
      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.webContainer}>
            <TouchableOpacity style={styles.card} onPress={() => setAlumnoSeleccionado(item)}>
              <View style={styles.cardInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{item.nombre?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.name}>{item.nombre || 'Sin nombre'}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 20 },
  webContainer: { width: '100%', maxWidth: 800, alignSelf: 'center', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  listContainer: { paddingVertical: 15 },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#3b82f6', fontWeight: 'bold', fontSize: 18 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 12, color: '#94a3b8' }
});