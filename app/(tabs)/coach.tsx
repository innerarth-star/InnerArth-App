import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    // Consulta para traer las revisiones más recientes primero
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    });

    return unsub;
  }, []);

  const renderAlumno = ({ item }: any) => (
    <TouchableOpacity style={styles.cardAlumno} onPress={() => setAlumnoSeleccionado(item)}>
      <View style={styles.infoRow}>
        <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombreAlumno}>{item.nombre}</Text>
          <Text style={styles.emailAlumno}>{item.email}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Ionicons name="log-out-outline" size={24} color="#ef4444" /></TouchableOpacity>
      </View>

      <Text style={styles.sub}>Revisiones Pendientes ({alumnos.length})</Text>

      {cargando ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={alumnos}
          keyExtractor={(item) => item.id}
          renderItem={renderAlumno}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay revisiones nuevas.</Text>}
        />
      )}

      {/* MODAL DE DETALLE DEL ALUMNO */}
      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Expediente Alumno</Text>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="close-circle" size={30} color="#64748b" /></TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <InfoSection title="Datos Personales" icon="user">
              <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
              <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
              <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
              <Dato label="Género" value={alumnoSeleccionado?.datosFisicos?.genero} />
              <Dato label="Peso" value={`${alumnoSeleccionado?.datosFisicos?.peso} kg`} />
              <Dato label="Altura" value={`${alumnoSeleccionado?.datosFisicos?.altura} cm`} />
            </InfoSection>

            <InfoSection title="Medidas (cm)" icon="ruler">
              <Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} />
              <Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} />
              <Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} />
              <Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} />
            </InfoSection>

            <InfoSection title="Salud" icon="heartbeat">
              <Dato label="Enfermedades" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
              <Dato label="Lesiones" value={alumnoSeleccionado?.salud?.detalleLesion || 'Ninguna'} />
            </InfoSection>

            <InfoSection title="Nutrición" icon="utensils">
              <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
              <Dato label="Comidas Deseadas" value={alumnoSeleccionado?.nutricion?.comidasDes} />
            </InfoSection>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// COMPONENTES AUXILIARES PARA EL MODAL
const InfoSection = ({ title, icon, children }: any) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <FontAwesome5 name={icon} size={16} color="#3b82f6" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Dato = ({ label, value }: any) => (
  <View style={styles.datoRow}>
    <Text style={styles.datoLabel}>{label}:</Text>
    <Text style={styles.datoValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  sub: { fontSize: 16, color: '#64748b', paddingHorizontal: 20, marginBottom: 10 },
  list: { paddingHorizontal: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  // Modal Styles
  modalContent: { flex: 1, backgroundColor: '#f1f5f9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalScroll: { padding: 20 },
  sectionContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6' },
  datoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  datoLabel: { color: '#64748b', fontSize: 14 },
  datoValue: { fontWeight: '600', color: '#1e293b', fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 10 }
});