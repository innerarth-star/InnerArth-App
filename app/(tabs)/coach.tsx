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
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; margin-bottom: 30px; padding-bottom: 10px; }
            h1 { color: #3b82f6; margin: 0; font-size: 24px; }
            h2 { background: #3b82f6; color: white; padding: 8px 15px; font-size: 14px; border-radius: 5px; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            td { padding: 10px; border: 1px solid #e2e8f0; }
            .label { font-weight: bold; background: #f8fafc; width: 35%; color: #475569; }
            .value { font-weight: 600; color: #000; }
            .page-break { page-break-before: always; }
            .legal { font-size: 10px; text-align: justify; color: #475569; line-height: 1.3; }
            .firma-img { width: 300px; height: auto; margin-top: 10px; border-bottom: 2px solid #000; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXPEDIENTE TÉCNICO FITTECH</h1>
            <p>Reporte Oficial de Evaluación Inicial</p>
          </div>

          <h2>1. Identificación del Alumno</h2>
          <table>
            <tr><td class="label">Nombre Completo</td><td class="value">${a.nombre}</td></tr>
            <tr><td class="label">Correo Electrónico</td><td class="value">${a.email}</td></tr>
            <tr><td class="label">Teléfono</td><td class="value">${a.telefono}</td></tr>
            <tr><td class="label">Edad / Género</td><td class="value">${a.datosFisicos?.edad} años / ${a.datosFisicos?.genero}</td></tr>
            <tr><td class="label">Peso Actual</td><td class="value">${a.datosFisicos?.peso} kg</td></tr>
            <tr><td class="label">Estatura</td><td class="value">${a.datosFisicos?.altura} cm</td></tr>
          </table>

          <h2>2. Medidas Antropométricas</h2>
          <table>
            <tr><td class="label">Cuello</td><td>${a.medidas?.cuello} cm</td><td class="label">Pecho</td><td>${a.medidas?.pecho} cm</td></tr>
            <tr><td class="label">Cintura</td><td>${a.medidas?.cintura} cm</td><td class="label">Cadera</td><td>${a.medidas?.cadera} cm</td></tr>
            <tr><td class="label">Brazo Relajado</td><td>${a.medidas?.brazoR} cm</td><td class="label">Brazo Flex.</td><td>${a.medidas?.brazoF} cm</td></tr>
            <tr><td class="label">Muslo</td><td>${a.medidas?.muslo} cm</td><td class="label">Pierna</td><td>${a.medidas?.pierna} cm</td></tr>
          </table>

          ${a.datosFisicos?.genero === 'mujer' ? `
          <h2>3. Ciclo Menstrual</h2>
          <table>
            <tr><td class="label">Tipo de Ciclo</td><td>${a.ciclo?.tipo}</td></tr>
            <tr><td class="label">Anticonceptivo</td><td>${a.ciclo?.anticonceptivo}</td></tr>
          </table>` : ''}

          <h2>4. Antecedentes de Salud</h2>
          <table>
            <tr><td class="label">Enf. Familiares</td><td class="value">${a.salud?.enfFam?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Enf. Personales</td><td class="value">${a.salud?.enfPers?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Lesiones</td><td class="value">${a.salud?.lesion === 'si' ? a.salud?.detalleLesion : 'Ninguna'}</td></tr>
            <tr><td class="label">Operaciones</td><td class="value">${a.salud?.operacion === 'si' ? a.salud?.detalleOperacion : 'Ninguna'}</td></tr>
          </table>

          <div class="page-break"></div>

          <h2>5. Actividad Física (Cuestionario IPAQ)</h2>
          <table>
            <tr><td class="label">Actividad Vigorosa</td><td class="value">${a.ipaq?.vDias} días / ${a.ipaq?.vMin} min por sesión</td></tr>
            <tr><td class="label">Actividad Moderada</td><td class="value">${a.ipaq?.mDias} días / ${a.ipaq?.mMin} min por sesión</td></tr>
            <tr><td class="label">Caminata</td><td class="value">${a.ipaq?.cDias} días / ${a.ipaq?.cMin} min por sesión</td></tr>
            <tr><td class="label">Tiempo Sedentario</td><td class="value">${a.ipaq?.sentado} horas sentado al día</td></tr>
          </table>

          <h2>6. Hábitos y Nutrición</h2>
          <table>
            <tr><td class="label">Comidas Actuales</td><td class="value">${a.nutricion?.comidasAct} comidas (${a.nutricion?.descAct})</td></tr>
            <tr><td class="label">Alcohol</td><td class="value">${a.nutricion?.alcohol === 'si' ? a.nutricion?.alcoholFreq : 'No consume'}</td></tr>
            <tr><td class="label">Sustancias / Fuma</td><td class="value">${a.nutricion?.sust === 'si' ? a.nutricion?.sustFreq : 'No'}</td></tr>
            <tr><td class="label">Días de Entrenamiento</td><td class="value">${a.nutricion?.entrenos} días por semana</td></tr>
            <tr><td class="label">Comidas en Plan</td><td class="value">${a.nutricion?.comidasDes} comidas diarias</td></tr>
            <tr><td class="label">Objetivo Principal</td><td class="value" style="color: #3b82f6; font-size: 14px;">${a.nutricion?.objetivo}</td></tr>
          </table>

          <h2>7. Frecuencia de Consumo Alimentos</h2>
          <table>
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `<tr><td class="label">${k}</td><td class="value">${v}</td></tr>`).join('')}
          </table>

          <div class="page-break"></div>

          <h2>8 y 9. Consentimiento Informado</h2>
          <div class="legal">
            <p><b>1. Propósito:</b> Acepto participar en un plan de entrenamiento personal. Soy consciente de que se me puede requerir una prueba de esfuerzo.</p>
            <p><b>2. Riesgos:</b> Se me ha informado de efectos negativos remotos como alteración de presión arterial, mareos o lesiones musculares.</p>
            <p><b>3. Beneficios:</b> Comprendo que la mejora de mi condición física depende de seguir las instrucciones durante 3 a 6 meses.</p>
            <p><b>4. Confidencialidad:</b> Mi información será tratada con máxima confidencialidad bajo las leyes de protección de datos.</p>
            <p style="margin-top:20px; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
              Certifico que he leído el consentimiento en su totalidad y acepto los términos y condiciones del programa.
            </p>
          </div>

          <div style="text-align: center; margin-top: 50px;">
            <p><b>ACEPTADO Y FIRMADO POR EL ALUMNO:</b></p>
            <img src="${a.firma}" class="firma-img" />
            <p style="margin-top: 10px; font-size: 14px;"><b>${a.nombre}</b></p>
            <p style="color: #64748b;">Fecha de Firma: ${a.timestamp?.toDate().toLocaleString()}<br/>ID Único: ${a.uid}</p>
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
            <Text style={styles.modalTitle}>Expediente Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={24} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}} showsVerticalScrollIndicator={false}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Peso/Altura" value={`${alumnoSeleccionado?.datosFisicos?.peso}kg / ${alumnoSeleccionado?.datosFisicos?.altura}cm`} />
            </Section>

            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
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

            <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enf. Propias" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
               <Dato label="Lesión" value={alumnoSeleccionado?.salud?.detalleLesion || 'No'} />
               <Dato label="Cirugías" value={alumnoSeleccionado?.salud?.detalleOperacion || 'No'} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin}m`} />
               <Dato label="Moderada" value={`${alumnoSeleccionado?.ipaq?.mDias} días / ${alumnoSeleccionado?.ipaq?.mMin}m`} />
               <Dato label="Caminata" value={`${alumnoSeleccionado?.ipaq?.cDias} días / ${alumnoSeleccionado?.ipaq?.cMin}m`} />
               <Dato label="Sentado" value={`${alumnoSeleccionado?.ipaq?.sentado} hrs/día`} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Días Entreno" value={alumnoSeleccionado?.nutricion?.entrenos} />
               <Dato label="Comidas Deseadas" value={alumnoSeleccionado?.nutricion?.comidasDes} />
               <Dato label="Objetivo principal" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentFull}>
                1. Propósito: Acepto participar en un plan de entrenamiento personal. Soy consciente de que se me puede requerir una prueba de esfuerzo física.{"\n\n"}
                2. Riesgos: Se me ha informado de efectos negativos durante el ejercicio como alteración de presión arterial o lesiones corporales.{"\n\n"}
                3. Beneficios: Entiendo que los beneficios dependen de mi adherencia al programa de 3 a 6 meses.{"\n\n"}
                4. Confidencialidad: Mis datos se tratarán con máxima privacidad.
               </Text>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>
            <View style={{height: 50}} />
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
  subTitle: { fontSize: 13, color: '#64748b', paddingHorizontal: 20, marginTop: 15, fontWeight: '700', textTransform: 'uppercase' },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreAlumno: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  emailAlumno: { fontSize: 11, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  modalTitle: { fontSize: 17, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 1 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  content: { padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 10, flex: 1 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' },
  datoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 15 },
  firmaPreview: { width: '100%', height: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 5 },
  consentFull: { fontSize: 10, color: '#64748b', textAlign: 'justify', marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' }
});