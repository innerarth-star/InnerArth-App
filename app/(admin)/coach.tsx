import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importa aquí tu configuración de firebase
import { db } from '../../firebaseConfig'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  // ESCUCHA EN TIEMPO REAL: Trae a los usuarios que ya mandaron cuestionario
  useEffect(() => {
    // Ajusta 'usuarios' por el nombre de tu colección
    // Filtramos por los que tienen el cuestionario lleno (o status 'pendiente')
    const q = query(collection(db, 'usuarios'), where('role', '==', 'client'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlumnos(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    );
  }

  // Si el coach selecciona a un alumno de la lista real, abrimos su expediente
  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => {
          // Aquí pondremos la lógica para cambiar status a 'aceptado' y abrir plan
          console.log("Aceptando a:", alumnoSeleccionado.nombre);
        }}
        onReject={() => {
          // Aquí lógica para pedir que repita el cuestionario
          console.log("Rechazando a:", alumnoSeleccionado.nombre);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes Registrados</Text>
        <Text style={styles.subtitle}>{alumnos.length} personas en total</Text>
      </View>
      
      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.clienteCard}
            onPress={() => setAlumnoSeleccionado(item)}
          >
            <View style={styles.info}>
              <Text style={styles.clienteNombre}>{item.nombre || 'Sin nombre'}</Text>
              <Text style={styles.clienteDetalle}>
                {item.datosFisicos?.edad ? `${item.datosFisicos.edad} años` : 'Sin edad'} • {item.objetivo || 'Cuestionario pendiente'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay clientes registrados aún.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  clienteCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginTop: 12, 
    padding: 20, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  info: { flex: 1 },
  clienteNombre: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  clienteDetalle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});