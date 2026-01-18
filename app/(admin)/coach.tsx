import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ExpedienteDetalle from './ExpedienteDetalle'; // El componente que haremos a continuación

export default function CoachPanel() {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    // FILTRO: Solo trae los que NO han sido procesados aún
    const q = query(
      collection(db, "revisiones_pendientes"), 
      where("status", "==", "pendiente") 
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendientes(lista);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const gestionarSolicitud = async (id: string, accion: 'aprobar' | 'rechazar') => {
    try {
      if (accion === 'aprobar') {
        await updateDoc(doc(db, "revisiones_pendientes", id), { status: 'aprobado' });
        Alert.alert("Éxito", "Cliente aprobado. Ahora puedes diseñarle su plan.");
      } else {
        await deleteDoc(doc(db, "revisiones_pendientes", id));
        Alert.alert("Eliminado", "La solicitud ha sido rechazada y borrada.");
      }
      setAlumnoSeleccionado(null);
    } catch (e) {
      Alert.alert("Error", "No se pudo procesar la acción.");
    }
  }; 

  if (cargando) return <ActivityIndicator size="large" color="#3b82f6" style={{flex:1}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-ins Pendientes</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{pendientes.length}</Text></View>
      </View>

      <FlatList
        data={pendientes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setAlumnoSeleccionado(item)}>
            <View style={styles.cardInfo}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.sub}>Enviado: {item.timestamp?.toDate().toLocaleDateString() || 'Hoy'}</Text>
            </View>
            <Ionicons name="eye-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay clientes esperando aprobación.</Text>}
      />

      {/* MODAL DEL CUESTIONARIO COMPLETO */}
      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        {alumnoSeleccionado && (
          <ExpedienteDetalle 
            alumno={alumnoSeleccionado} 
            onClose={() => setAlumnoSeleccionado(null)} 
            onAccept={() => gestionarSolicitud(alumnoSeleccionado.id, 'aprobar')}
            onReject={() => gestionarSolicitud(alumnoSeleccionado.id, 'rechazar')}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  badge: { backgroundColor: '#ef4444', marginLeft: 10, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardInfo: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});