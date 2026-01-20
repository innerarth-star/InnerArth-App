import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    }, (error) => {
      Alert.alert("Error", error.message);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const eliminarRegistro = (id: string, nombre: string) => {
    Alert.alert("Atención", `¿Eliminar permanentemente a ${nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => await deleteDoc(doc(db, "revisiones_pendientes", id)) }
    ]);
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.limitContent}>
          <Text style={styles.title}>Panel Coach</Text>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TouchableOpacity style={styles.card} onPress={() => setAlumnoSeleccionado(item)}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{item.nombre?.toUpperCase()}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.trashBtn} onPress={() => eliminarRegistro(item.id, item.nombre)}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <ExpedienteDetalle 
          alumno={alumnoSeleccionado} 
          onClose={() => setAlumnoSeleccionado(null)}
          onAccept={() => {
            Alert.alert("Éxito", "Alumno aceptado");
            setAlumnoSeleccionado(null);
          }}
          onReject={() => setAlumnoSeleccionado(null)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  limitContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  list: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 15 },
  cardWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 13, color: '#64748b' },
  trashBtn: { padding: 12, marginLeft: 10, backgroundColor: '#fee2e2', borderRadius: 12 }
});