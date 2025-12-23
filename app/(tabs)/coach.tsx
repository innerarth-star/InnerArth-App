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

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            @page { margin: 20px; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.4; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            h1 { color: #3b82f6; margin: 0; font-size: 22px; }
            h2 { background: #3b82f6; color: white; padding: 6px 12px; font-size: 14px; border-radius: 4px; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
            .label { font-weight: bold; background: #f8fafc; width: 35%; color: #64748b; }
            .firma-box { text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .firma-img { width: 200px; height: auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXPEDIENTE FITTECH</h1>
            <p>Reporte de Evaluación Inicial | Fecha: ${new Date().toLocaleDateString()}</p>
          </div>
          <h2>1. Datos Personales</h2>
          <table>
            <tr><td class="label">Nombre</td><td>${a.nombre}</td></tr>
            <tr><td class="label">Email</td><td>${a.email}</td></tr>
            <tr><td class="label">Teléfono</td><td>${a.telefono}</td></tr>
            <tr><td class="label">Edad / Género</td><td>${a.datosFisicos?.edad} años / ${a.datosFisicos?.genero}</td></tr>
          </table>
          <h2>2. Medidas y Composición</h2>
          <table>
            <tr><td class="label">Peso / Altura</td><td>${a.datosFisicos?.peso}kg / ${a.datosFisicos?.altura}cm</td></tr>
            <tr><td class="label">Cuello / Pecho</td><td>${a.medidas?.cuello}cm / ${a.medidas?.pecho}cm</td></tr>
            <tr><td class="label">Cintura / Cadera</td><td>${a.medidas?.cintura}cm / ${a.medidas?.cadera}cm</td></tr>
            <tr><td class="label">Muslo / Pierna</td><td>${a.medidas?.muslo}cm / ${a.medidas?.pierna}cm</td></tr>
          </table>
          ${a.datosFisicos?.genero === 'mujer' ? `
          <h2>3. Ciclo Menstrual</h2>
          <table>
            <tr><td class="label">Estado</td><td>${a.ciclo?.tipo}</td></tr>
            <tr><td class="label">Anticonceptivo</td><td>${a.ciclo?.anticonceptivo}</td></tr>
          </table>` : ''}
          <h2>4. Salud y 5. Actividad</h2>
          <table>
            <tr><td class="label">Enfermedades</td><td>${a.salud?.enfPers?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Lesiones</td><td>${a.salud?.detalleLesion || 'No'}</td></tr>
            <tr><td class="label">IPAQ (Vigorosa)</td><td>${a.ipaq?.vDias} días / ${a.ipaq?.vMin} min</td></tr>
          </table>
          <h2>6. Nutrición y Objetivo</h2>
          <table>
            <tr><td class="label">Objetivo</td><td>${a.nutricion?.objetivo}</td></tr>
            <tr><td class="label">Comidas Deseadas</td><td>${a.nutricion?.comidasDes}</td></tr>
          </table>
          <div style="page-break-before: always;"></div>
          <h2>7. Frecuencia de Alimentos</h2>
          <table>
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `<tr><td class="label">${k}</td><td>${v}</td></tr>`).join('')}
          </table>
          <div class="firma-box">
            <p><b>FIRMA DE CONFORMIDAD</b></p>
            <img src="${a.firma}" class="firma-img" />
            <p>${a.nombre}<br/>Audit ID: ${a.uid}</p>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Ionicons name="log-out-outline" size={26} color="#ef4444" /></TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>Revisiones Pendientes ({alumnos.length})</Text>

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
          ListEmptyComponent={<Text style={styles.empty}>No hay registros pendientes.</Text>}
        />
      )}

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Expediente Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={24} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Género" value={alumnoSeleccionado?.datosFisicos?.genero} />
               <Dato label="Peso/Altura" value={`${alumnoSeleccionado?.datosFisicos?.peso}kg / ${alumnoSeleccionado?.datosFisicos?.altura}cm`} />
            </Section>

            <Section num={2} title="Medidas" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
               <View style={styles.row}><Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} /><Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} /></View>
               <View style={styles.row}><Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} /><Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} /></View>
               <View style={styles.row}><Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} /><Dato label="Muslo" value={alumnoSeleccionado?.medidas?.muslo} /></View>
            </Section>

            {alumnoSeleccionado?.datosFisicos?.genero === 'mujer' && (
              <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Dato label="Estado" value={alumnoSeleccionado?.ciclo?.tipo} />
                <Dato label="Anticonceptivo" value={alumnoSeleccionado?.ciclo?.anticonceptivo} />
              </Section>
            )}

            <Section num={4} title="Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enf. Propias" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
               <Dato label="Lesión" value={alumnoSeleccionado?.salud?.detalleLesion || 'No'} />
               <Dato label="Cirugías" value={alumnoSeleccionado?.salud?.detalleOperacion || 'No'} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin}m`} />
               <Dato label="Sentado" value={`${alumnoSeleccionado?.ipaq?.sentado} hrs/día`} />
            </Section>

            <Section num={6} title="Nutrición" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
               <Dato label="Días Entreno" value={alumnoSeleccionado?.nutricion?.entrenos} />
               <Dato label="Comidas Deseadas" value={alumnoSeleccionado?.nutricion?.comidasDes} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
               <Text style={styles.legalLabel}>ID Alumno: ${alumnoSeleccionado?.uid}</Text>
            </Section>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => (
  <View style={styles.cardSection}>
    <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
      <View style={styles.titleRow}>
        <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={13} color={color} />
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
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subTitle: { fontSize: 14, color: '#64748b', paddingHorizontal: 20, marginTop: 15, fontWeight: '600' },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 12, flex: 1 },
  datoLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
  datoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 20 },
  firmaPreview: { width: '100%', height: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  legalLabel: { fontSize: 10, color: '#94a3b8', marginTop: 10, textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});