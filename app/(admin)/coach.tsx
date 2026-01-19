import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig'; // Ajusta esta ruta a tu archivo real
import { collection, onSnapshot, query } from 'firebase/firestore';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    // IMPORTANTE: Asegúrate que 'usuarios' sea el nombre exacto de tu colección en Firebase
    const q = query(collection(db, 'usuarios'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Datos recibidos:", docs.length); // Ver en consola cuántos llegan
      setAlumnos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error en Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Cargando clientes reales...</Text>
      </View>
    );
  }

  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => {
          alert("Abriendo editor de planes para " + alumnoSeleccionado.nombre);
          setAlumnoSeleccionado(null);
        }}
        onReject={() => setAlumnoSeleccionado(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes en el Sistema</Text>
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
            <View>
              <Text style={styles.name}>{item.nombre || item.displayName || 'Usuario sin nombre'}</Text>
              <Text style={styles.sub}>{item.email || 'Sin correo registrado'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}><Text>No hay datos en la colección 'usuarios'</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 1
  },
  name: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 }
});