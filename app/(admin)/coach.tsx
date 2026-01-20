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
      Alert.alert("Error", "No se pudo conectar con la base de datos");
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const handleSignOut = () => {
    signOut(auth).catch(() => Alert.alert("Error", "No se pudo cerrar sesión"));
  };

  const eliminarRegistro = (id: string, nombre: string) => {
    Alert.alert("Confirmar", `¿Eliminar permanentemente a ${nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => await deleteDoc(doc(db, "revisiones_pendientes", id)) }
    ]);
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card} onPress={() => setAlumnoSeleccionado(item)}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreText}>{item.nombre?.toUpperCase()}</Text>
                <Text style={styles.emailText}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.trashBtn} onPress={() => eliminarRegistro(item.id, item.nombre)}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 15 }}
      />

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <ExpedienteDetalle 
          alumno={alumnoSeleccionado} 
          onClose={() => setAlumnoSeleccionado(null)}
          onAccept={() => {
            Alert.alert("Aceptado", "El alumno ha sido aprobado.");
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  logoutBtn: { padding: 5 },
  cardContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreText: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  emailText: { fontSize: 12, color: '#64748b' },
  trashBtn: { padding: 12, marginLeft: 10, backgroundColor: '#fee2e2', borderRadius: 10 }
});