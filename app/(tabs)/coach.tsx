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
            @page { size: auto; margin: 15mm; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.2; font-size: 10px; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; margin-bottom: 15px; padding-bottom: 5px; }
            h1 { color: #3b82f6; margin: 0; font-size: 18px; }
            h2 { background: #3b82f6; color: white; padding: 4px 10px; font-size: 12px; border-radius: 4px; margin: 10px 0 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 5px; border: 1px solid #e2e8f0; }
            .label { font-weight: bold; background: #f8fafc; width: 30%; color: #64748b; }
            .value { font-weight: 600; }
            .page-break { page-break-before: always; }
            .firma-img { width: 180px; height: auto; border-bottom: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXPEDIENTE DE EVALUACIÓN - FITTECH</h1>
            <p>Alumno: ${a.nombre} | ID: ${a.uid?.substring(0,8)}</p>
          </div>

          <h2>1. Datos Personales y Físicos</h2>
          <table>
            <tr><td class="label">Nombre</td><td class="value">${a.nombre}</td><td class="label">Edad</td><td class="value">${a.datosFisicos?.edad} años</td></tr>
            <tr><td class="label">Email</td><td class="value">${a.email}</td><td class="label">Género</td><td class="value">${a.datosFisicos?.genero}</td></tr>
            <tr><td class="label">Teléfono</td><td class="value">${a.telefono}</td><td class="label">Peso/Alt</td><td class="value">${a.datosFisicos?.peso}kg / ${a.datosFisicos?.altura}cm</td></tr>
          </table>

          <h2>2. Medidas Corporales (cm)</h2>
          <table>
            <tr><td class="label">Cuello</td><td>${a.medidas?.cuello}</td><td class="label">Pecho</td><td>${a.medidas?.pecho}</td><td class="label">Cintura</td><td>${a.medidas?.cintura}</td></tr>
            <tr><td class="label">Cadera</td><td>${a.medidas?.cadera}</td><td class="label">Brazo R/F</td><td>${a.medidas?.brazoR} / ${a.medidas?.brazoF}</td><td class="label">Muslo/Pierna</td><td>${a.medidas?.muslo} / ${a.medidas?.pierna}</td></tr>
          </table>

          ${a.datosFisicos?.genero === 'mujer' ? `<h2>3. Ciclo Menstrual</h2><table><tr><td class="label">Estado</td><td>${a.ciclo?.tipo}</td><td class="label">Anticonceptivo</td><td>${a.ciclo?.anticonceptivo}</td></tr></table>` : ''}

          <h2>4. Historial de Salud</h2>
          <table>
            <tr><td class="label">Enf. Familiares</td><td class="value">${a.salud?.enfFam?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Enf. Personales</td><td class="value">${a.salud?.enfPers?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Lesiones/Cirugías</td><td class="value">L: ${a.salud?.detalleLesion || 'No'} | C: ${a.salud?.detalleOperacion || 'No'}</td></tr>
          </table>

          <h2>5. Actividad Física (IPAQ)</h2>
          <table>
            <tr><td class="label">Vigorosa/Mod</td><td class="value">${a.ipaq?.vDias}d (${a.ipaq?.vMin}m) / ${a.ipaq?.mDias}d (${a.ipaq?.mMin}m)</td></tr>
            <tr><td class="label">Caminata</td><td class="value">${a.ipaq?.cDias} días / ${a.ipaq?.cMin} min</td><td class="label">Sentado</td><td class="value">${a.ipaq?.sentado} hrs/día</td></tr>
          </table>

          <h2>6. Nutrición y Objetivos</h2>
          <table>
            <tr><td class="label">Comidas/Día</td><td class="value">${a.nutricion?.comidasAct} (${a.nutricion?.descAct})</td><td class="label">Entrenos</td><td class="value">${a.nutricion?.entrenos} días</td></tr>
            <tr><td class="label">Alcohol/Sust</td><td class="value">Alc: ${a.nutricion?.alcoholFreq || 'No'} | Sust: ${a.nutricion?.sustFreq || 'No'}</td><td class="label">Plan Deseado</td><td class="value">${a.nutricion?.comidasDes} comidas</td></tr>
            <tr><td class="label">OBJETIVO</td><td colspan="3" class="value" style="color:#3b82f6">${a.nutricion?.objetivo}</td></tr>
          </table>

          <div class="page-break"></div>

          <h2>7. Frecuencia de Alimentos</h2>
          <table style="margin-bottom: 20px;">
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `<tr><td class="label">${k}</td><td class="value">${v}</td></tr>`).join('')}
          </table>

          <h2>8 y 9. Consentimiento y Firma Digital</h2>
          <div style="background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 9px; text-align: justify; margin-bottom: 20px;">
            El alumno confirma que la información proporcionada es real y acepta los términos del programa FitTech. Reconoce que el ejercicio físico conlleva riesgos y libera de responsabilidad al coach por omisión de datos de salud preexistentes.
          </div>

          <div style="text-align: center;">
            <img src="${a.firma}" class="firma-img" />
            <p style="font-size: 11px; font-weight: bold; margin-top: 5px;">${a.nombre}</p>
            <p style="font-size: 9px; color: #64748b;">Firmado electrónicamente el ${a.timestamp?.toDate().toLocaleString()}</p>
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
          ListEmptyComponent={<Text style={styles.empty}>Sin alumnos pendientes.</Text>}
        />
      )}

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Expediente Completo</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={24} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}} showsVerticalScrollIndicator={false}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre completo" value={alumnoSeleccionado?.nombre} />
               <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Peso/Altura" value={`${alumnoSeleccionado?.datosFisicos?.peso}kg / ${alumnoSeleccionado?.datosFisicos?.altura}cm`} />
            </Section>

            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
               <View style={styles.row}><Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} /><Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} /></View>
               <View style={styles.row}><Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} /><Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} /></View>
               <View style={styles.row}><Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} /><Dato label="Brazo F" value={alumnoSeleccionado?.medidas?.brazoF} /></View>
               <View style={styles.row}><Dato label="Muslo" value={alumnoSeleccionado?.medidas?.muslo} /><Dato label="Pierna" value={alumnoSeleccionado?.medidas?.pierna} /></View>
            </Section>

            {alumnoSeleccionado?.datosFisicos?.genero === 'mujer' && (
              <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Dato label="Tipo de ciclo" value={alumnoSeleccionado?.ciclo?.tipo} />
                <Dato label="Método anticonceptivo" value={alumnoSeleccionado?.ciclo?.anticonceptivo} />
              </Section>
            )}

            <Section num={4} title="Historial de Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enfermedades Familiares" value={alumnoSeleccionado?.salud?.enfFam?.join(', ')} />
               <Dato label="Enfermedades Propias" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
               <Dato label="Lesión detalle" value={alumnoSeleccionado?.salud?.detalleLesion || 'Ninguna'} />
               <Dato label="Operación detalle" value={alumnoSeleccionado?.salud?.detalleOperacion || 'Ninguna'} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Act. Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin}m`} />
               <Dato label="Act. Moderada" value={`${alumnoSeleccionado?.ipaq?.mDias} días / ${alumnoSeleccionado?.ipaq?.mMin}m`} />
               <Dato label="Horas sentado" value={`${alumnoSeleccionado?.ipaq?.sentado} hrs/día`} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Comidas actuales" value={`${alumnoSeleccionado?.nutricion?.comidasAct} (${alumnoSeleccionado?.nutricion?.descAct})`} />
               <Dato label="Consumo Alcohol" value={alumnoSeleccionado?.nutricion?.alcoholFreq || 'No'} />
               <Dato label="Sustancias/Fuma" value={alumnoSeleccionado?.nutricion?.sustFreq || 'No'} />
               <Dato label="Objetivo principal" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia de Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.infoMini}>Aceptado el {alumnoSeleccionado?.timestamp?.toDate().toLocaleString()}</Text>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>
            <View style={{height: 40}} />
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
    <Text style={styles.datoValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#64748b', paddingHorizontal: 20, marginTop: 15, fontWeight: '700', textTransform: 'uppercase' },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreAlumno: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  emailAlumno: { fontSize: 11, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 1, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  content: { padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 10, flex: 1 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  datoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 15 },
  firmaPreview: { width: '100%', height: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 5 },
  infoMini: { fontSize: 10, color: '#94a3b8', marginBottom: 5 },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 14 }
});