import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  useEffect(() => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.btnLogOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
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

      {/* MODAL DE DETALLE COMPLETO (9 BLOQUES) */}
      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Expediente Completo</Text>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)} style={styles.btnClose}>
              <Ionicons name="close-circle" size={35} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* BLOQUE 1: DATOS PERSONALES */}
            <InfoSection title="1. Datos Personales" icon="user">
              <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
              <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
              <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
              <Dato label="Género" value={alumnoSeleccionado?.datosFisicos?.genero} />
              <Dato label="Peso" value={`${alumnoSeleccionado?.datosFisicos?.peso} kg`} />
              <Dato label="Altura" value={`${alumnoSeleccionado?.datosFisicos?.altura} cm`} />
            </InfoSection>

            {/* BLOQUE 2: MEDIDAS */}
            <InfoSection title="2. Medidas Corporales" icon="ruler-horizontal">
              <View style={styles.gridMedidas}>
                <Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} />
                <Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} />
                <Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} />
                <Dato label="Brazo F" value={alumnoSeleccionado?.medidas?.brazoF} />
                <Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} />
                <Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} />
                <Dato label="Muslo" value={alumnoSeleccionado?.medidas?.muslo} />
                <Dato label="Pierna" value={alumnoSeleccionado?.medidas?.pierna} />
              </View>
            </InfoSection>

            {/* BLOQUE 3: CICLO (SOLO MUJERES) */}
            {alumnoSeleccionado?.datosFisicos?.genero === 'mujer' && (
              <InfoSection title="3. Ciclo Menstrual" icon="venus">
                <Dato label="Tipo" value={alumnoSeleccionado?.ciclo?.tipo} />
                <Dato label="Anticonceptivo" value={alumnoSeleccionado?.ciclo?.anticonceptivo} />
              </InfoSection>
            )}

            {/* BLOQUE 4: HISTORIAL SALUD */}
            <InfoSection title="4. Historial de Salud" icon="heartbeat">
              <Dato label="Enf. Fam." value={alumnoSeleccionado?.salud?.enfFam?.join(', ')} />
              <Dato label="Enf. Pers." value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
              <Dato label="Lesión" value={alumnoSeleccionado?.salud?.lesion === 'si' ? alumnoSeleccionado?.salud?.detalleLesion : 'No'} />
              <Dato label="Operación" value={alumnoSeleccionado?.salud?.operacion === 'si' ? alumnoSeleccionado?.salud?.detalleOperacion : 'No'} />
            </InfoSection>

            {/* BLOQUE 5: ESTILO VIDA IPAQ */}
            <InfoSection title="5. Actividad Física (IPAQ)" icon="walking">
              <Dato label="Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin} min`} />
              <Dato label="Moderada" value={`${alumnoSeleccionado?.ipaq?.mDias} días / ${alumnoSeleccionado?.ipaq?.mMin} min`} />
              <Dato label="Caminata" value={`${alumnoSeleccionado?.ipaq?.cDias} días / ${alumnoSeleccionado?.ipaq?.cMin} min`} />
              <Dato label="Sentado" value={`${alumnoSeleccionado?.ipaq?.sentado} hrs/día`} />
            </InfoSection>

            {/* BLOQUE 6: NUTRICIÓN Y HÁBITOS */}
            <InfoSection title="6. Nutrición y Objetivos" icon="utensils">
              <Dato label="Comidas Actuales" value={alumnoSeleccionado?.nutricion?.comidasAct} />
              <Dato label="Descripción" value={alumnoSeleccionado?.nutricion?.descAct} />
              <Dato label="Alcohol" value={alumnoSeleccionado?.nutricion?.alcohol === 'si' ? alumnoSeleccionado?.nutricion?.alcoholFreq : 'No'} />
              <Dato label="Sustancias" value={alumnoSeleccionado?.nutricion?.sust === 'si' ? alumnoSeleccionado?.nutricion?.sustFreq : 'No'} />
              <Dato label="Días Entreno" value={alumnoSeleccionado?.nutricion?.entrenos} />
              <Dato label="Comidas Deseadas" value={alumnoSeleccionado?.nutricion?.comidasDes} />
              <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </InfoSection>

            {/* BLOQUE 7: FRECUENCIA ALIMENTOS */}
            <InfoSection title="7. Frecuencia de Alimentos" icon="apple-alt">
              {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([key, val]: any) => (
                <Dato key={key} label={key} value={val} />
              ))}
            </InfoSection>

            {/* BLOQUE 8 Y 9: FIRMA Y LEGAL */}
            <InfoSection title="8 y 9. Consentimiento y Firma" icon="file-signature">
              <Text style={styles.labelFirma}>Firma del Alumno:</Text>
              {alumnoSeleccionado?.firma ? (
                <View style={styles.firmaContainer}>
                  <Image source={{ uri: alumnoSeleccionado.firma }} style={styles.firmaImg} resizeMode="contain" />
                </View>
              ) : <Text>Sin firma registrada</Text>}
              <Dato label="Fecha" value={alumnoSeleccionado?.timestamp?.toDate().toLocaleDateString()} />
            </InfoSection>

            <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  btnLogOut: { padding: 5 },
  sub: { fontSize: 14, color: '#64748b', paddingHorizontal: 20, marginVertical: 15, fontWeight: '600' },
  list: { paddingHorizontal: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  
  // MODAL STYLES
  modalContent: { flex: 1, backgroundColor: '#f1f5f9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnClose: { padding: 5 },
  modalScroll: { padding: 15 },
  sectionContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase' },
  datoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap' },
  datoLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  datoValue: { fontWeight: '600', color: '#1e293b', fontSize: 13, textAlign: 'right', flex: 1, marginLeft: 10 },
  gridMedidas: { marginTop: 5 },
  labelFirma: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  firmaContainer: { width: '100%', height: 150, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  firmaImg: { width: '90%', height: '90%' }
});