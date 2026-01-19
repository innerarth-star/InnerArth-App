import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig'; 
import { collection, onSnapshot, query } from 'firebase/firestore';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    // Usamos el nombre de tu colección: revisiones_pendientes
    const q = query(collection(db, 'revisiones_pendientes'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlumnos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  // Si hay alguien seleccionado, se renderiza ExpedienteDetalle con todas sus props
  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => { alert("Aceptado"); setAlumnoSeleccionado(null); }}
        onReject={() => { alert("Rechazado"); setAlumnoSeleccionado(null); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Cuestionarios Pendientes</Text></View>
      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setAlumnoSeleccionado(item)}>
            <Text style={styles.name}>{item.nombre || 'Sin nombre'}</Text>
            <Text style={styles.sub}>{item.email || 'Ver detalles'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text>No hay registros en revisiones_pendientes</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 10, elevation: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, color: '#64748b' }
});