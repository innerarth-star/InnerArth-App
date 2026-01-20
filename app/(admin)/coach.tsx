import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// IMPORTAMOS EL EXPEDIENTE (Asegúrate de que la ruta sea correcta)
import ExpedienteDetalle from './ExpedienteDetalle'; 

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  // 1. ESCUCHA REAL DE FIREBASE (RESTAURADA)
  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    }, (error) => {
      Alert.alert("Error de Conexión", error.message);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  // 2. LÓGICA DE ELIMINACIÓN (RESTAURADA)
  const eliminarRegistro = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Expediente",
      `¿Borrar permanentemente a ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "revisiones_pendientes", id));
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar");
            }
          } 
        }
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logOutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* LISTA DE ALUMNOS PENDIENTES */}
      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => setAlumnoSeleccionado(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{item.nombre?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{item.nombre?.toUpperCase()}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => eliminarRegistro(item.id, item.nombre)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay revisiones pendientes</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* MODAL DEL EXPEDIENTE (EL QUE TIENE LOS 10 BLOQUES) */}
      <Modal 
        visible={!!alumnoSeleccionado} 
        animationType="slide"
        onRequestClose={() => setAlumnoSeleccionado(null)}
      >
        <ExpedienteDetalle 
          alumno={alumnoSeleccionado} 
          onClose={() => setAlumnoSeleccionado(null)}
          onAccept={() => {
            Alert.alert("Aceptar", "Lógica de aceptación en desarrollo");
            setAlumnoSeleccionado(null);
          }}
          onReject={() => setAlumnoSeleccionado(null)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  logOutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  listContent: { padding: 20 },
  cardWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  card: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  avatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  nombre: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 12, color: '#64748b' },
  deleteBtn: { padding: 12, marginLeft: 10, backgroundColor: '#fee2e2', borderRadius: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});