import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig'; 
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    // CONEXIÓN A TU COLECCIÓN REAL
    const q = query(collection(db, 'revisiones_pendientes'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlumnos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error en Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (alumno: any) => {
    try {
      // 1. Aquí podrías actualizar el status del usuario o moverlo de colección
      // Ejemplo: Marcar como revisado
      const alumnoRef = doc(db, 'revisiones_pendientes', alumno.id);
      await updateDoc(alumnoRef, { status: 'aceptado' });
      
      Alert.alert("Éxito", `Has aceptado a ${alumno.nombre}. Ahora puedes crear su plan.`);
      setAlumnoSeleccionado(null);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estatus.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Consultando revisiones pendientes...</Text>
      </View>
    );
  }

  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => handleAccept(alumnoSeleccionado)}
        onReject={() => setAlumnoSeleccionado(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cuestionarios Pendientes</Text>
        <Text style={styles.subtitle}>{alumnos.length} por revisar</Text>
      </View>
      
      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setAlumnoSeleccionado(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nombre || 'Cliente sin nombre'}</Text>
              <Text style={styles.sub}>
                Enviado: {item.fechaEnvio || 'Recientemente'}
              </Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>REVISAR</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay revisiones pendientes por ahora.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  badge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', marginTop: 10, textAlign: 'center' }
});