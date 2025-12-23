import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  // FUNCIÓN PARA EXPORTAR A PDF
  const exportarPDF = async (alumno: any) => {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #3b82f6;">Expediente FitTech: ${alumno.nombre}</h1>
          <p><b>Email:</b> ${alumno.email} | <b>Tel:</b> ${alumno.telefono}</p>
          <hr/>
          <h3>Datos Físicos</h3>
          <p>Peso: ${alumno.datosFisicos?.peso}kg | Altura: ${alumno.datosFisicos?.altura}cm | Edad: ${alumno.datosFisicos?.edad}</p>
          <h3>Objetivo</h3>
          <p>${alumno.nutricion?.objetivo}</p>
          <h3>Firma</h3>
          <img src="${alumno.firma}" style="width: 200px; border: 1px solid #ccc;" />
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Ionicons name="log-out-outline" size={26} color="#ef4444" /></TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={alumnos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cardAlumno} onPress={() => { setAlumnoSeleccionado(item); setSeccionActiva(1); }}>
              <View style={styles.infoRow}>
                <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0)}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.nombreAlumno}>{item.nombre}</Text><Text style={styles.emailAlumno}>{item.email}</Text></View>
                <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay registros.</Text>}
        />
      )}

      {/* MODAL DETALLE ESTILO CLIENTE */}
      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Detalle del Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={24} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
               <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Peso/Altura" value={`${alumnoSeleccionado?.datosFisicos?.peso}kg / ${alumnoSeleccionado?.datosFisicos?.altura}cm`} />
            </Section>

            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
               <View style={styles.row}><Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} /><Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} /></View>
               <View style={styles.row}><Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} /><Dato label="Brazo F" value={alumnoSeleccionado?.medidas?.brazoF} /></View>
               <View style={styles.row}><Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} /><Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} /></View>
            </Section>

            <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enfermedades Familiares" value={alumnoSeleccionado?.salud?.enfFam?.join(', ')} />
               <Dato label="Enfermedades Propias" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
               <Dato label="Lesión" value={alumnoSeleccionado?.salud?.detalleLesion || 'No'} />
            </Section>

            <Section num={8} title="Consentimiento y Firma" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentTxtSmall}>Aceptó el consentimiento informado el día {alumnoSeleccionado?.timestamp?.toDate().toLocaleDateString()}.</Text>
               <Text style={styles.labelFirma}>Firma digital:</Text>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// COMPONENTE DE SECCIÓN (REUTILIZANDO DISEÑO DEL CLIENTE)
const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => (
  <View style={styles.cardSection}>
    <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
      <View style={styles.titleRow}>
        <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={14} color={color} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
);

const Dato = ({ label, value }: any) => (
  <View style={styles.datoBox}>
    <Text style={styles.datoLabel}>{label}</Text>
    <Text style={styles.datoValue}>{value || '---'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  datoBox: { marginBottom: 10, flex: 1 },
  datoLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' },
  datoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 10 },
  consentTxtSmall: { fontSize: 10, color: '#64748b', fontStyle: 'italic', marginBottom: 10 },
  labelFirma: { fontSize: 12, fontWeight: 'bold', marginTop: 10 },
  firmaPreview: { width: '100%', height: 100, backgroundColor: '#f8fafc', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});