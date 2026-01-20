import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image, Alert, TextInput } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- INTERFAZ PARA EVITAR EL ERROR DE TYPESCRIPT ---
interface ExpedienteProps {
  alumno: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [modalDieta, setModalDieta] = useState(false);
  const [dietaActual, setDietaActual] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [alimentosFiltrados, setAlimentosFiltrados] = useState<any[]>([]);
  const [factorActividad, setFactorActividad] = useState<number>(1.2);
  const [ajusteCalorico, setAjusteCalorico] = useState<number>(0);

  const PREGUNTAS_PARQ: any = {
    p1: "¿Problema cardíaco?", p2: "¿Dolor pecho ejercicio?", p3: "¿Dolor pecho reposo?",
    p4: "¿Mareos/Equilibrio?", p5: "¿Problema óseo?", p6: "¿Medicamentos presión?", p7: "¿Otra razón?"
  };

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

  // --- LÓGICA DE APOYO ---
  const procesarTexto = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'no' || val === 0) return "NO";
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : "NO";
    return String(val).toUpperCase();
  };

  const formatearActividad = (dias: any, min: any) => {
    const d = procesarTexto(dias);
    const m = procesarTexto(min);
    return (d === "NO" || m === "NO") ? "NO" : `${d} DÍAS / ${m} MIN`;
  };

  // --- EXPORTACIÓN PDF (LOS 10 BLOQUES) ---
  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 25mm 20mm; }
          body { font-family: 'Helvetica', sans-serif; color: #334155; line-height: 1.3; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
          .block-container { page-break-inside: avoid; margin-bottom: 20px; }
          .section-title { background: #3b82f6; color: white; padding: 6px 18px; border-radius: 20px; font-size: 11px; font-weight: bold; width: fit-content; text-transform: uppercase; margin-bottom: 8px; }
          .grid { display: flex; flex-wrap: wrap; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
          .item { width: 50%; padding: 10px; border: 0.5px solid #f1f5f9; box-sizing: border-box; }
          .full-width { width: 100%; }
          .label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; }
          .value { font-size: 11px; color: #0f172a; font-weight: 600; }
          .page-break { page-break-before: always; }
          .signature-img { width: 150px; height: auto; display: block; margin: 10px auto; border-bottom: 2px solid #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EXPEDIENTE TÉCNICO FITTECH</h1>
          <p>Alumno: ${procesarTexto(a.nombre)} | Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="block-container">
          <div class="section-title">1. Datos e Identificación</div>
          <div class="grid">
            <div class="item"><span class="label">Teléfono</span><span class="value">${a.telefono}</span></div>
            <div class="item"><span class="label">Email</span><span class="value">${a.email}</span></div>
            <div class="item"><span class="label">Peso / Talla</span><span class="value">${a.datosFisicos?.peso}kg / ${a.datosFisicos?.altura}cm</span></div>
            <div class="item"><span class="label">Edad</span><span class="value">${a.datosFisicos?.edad} AÑOS</span></div>
          </div>
        </div>
        <div class="block-container">
          <div class="section-title">2. Medidas Corporales</div>
          <div class="grid">
            <div class="item"><span class="label">Cintura/Cadera</span><span class="value">${a.medidas?.cintura} / ${a.medidas?.cadera}</span></div>
            <div class="item"><span class="label">Pecho/Cuello</span><span class="value">${a.medidas?.pecho} / ${a.medidas?.cuello}</span></div>
            <div class="item"><span class="label">Brazos (R/F)</span><span class="value">${a.medidas?.brazoR} / ${a.medidas?.brazoF}</span></div>
            <div class="item"><span class="label">Piernas (M/P)</span><span class="value">${a.medidas?.muslo} / ${a.medidas?.pierna}</span></div>
          </div>
        </div>
        <div class="block-container">
          <div class="section-title">6. Riesgos PAR-Q</div>
          <div class="grid">
            ${Object.keys(PREGUNTAS_PARQ).map(k => `
              <div class="item full-width"><span class="label">${PREGUNTAS_PARQ[k]}</span><span class="value">${procesarTexto(a.salud?.parq?.[k])}</span></div>
            `).join('')}
          </div>
        </div>
        <div class="page-break"></div>
        <div class="signature-box" style="text-align:center;">
          <img src="${a.firma}" class="signature-img" />
          <p>Firma del Alumno: ${procesarTexto(a.nombre)}</p>
        </div>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  // --- COMPONENTES INTERNOS ---
  const Section = ({ num, title, color, icon, children }: any) => (
    <View style={styles.cardSection}>
      <TouchableOpacity style={styles.headerToggle} onPress={() => setSeccionActiva(seccionActiva === num ? null : num)}>
        <View style={styles.titleRow}>
          <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
          <FontAwesome5 name={icon} size={14} color={color} /><Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FontAwesome name={seccionActiva === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
      </TouchableOpacity>
      {seccionActiva === num && <View style={styles.content}>{children}</View>}
    </View>
  );

  const Dato = ({ label, value }: any) => (
    <View style={styles.datoBox}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={[styles.datoValue, (procesarTexto(value) === "NO") && {color: '#ef4444'}]}>{procesarTexto(value)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Ionicons name="log-out" size={24} color="#ef4444" /></TouchableOpacity>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardAlumno} onPress={() => setAlumnoSeleccionado(item)}>
            <Text style={styles.nombreAlumno}>{item.nombre}</Text>
            <Text style={styles.emailAlumno}>{item.email}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{padding: 20}}
      />

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="close" size={28} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Expediente</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={22} color="#3b82f6" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding: 15}}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user">
                <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
                <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
                <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
            </Section>
            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler">
                <Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} />
                <Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} />
            </Section>
            {/* ... Agrega aquí el resto de las secciones siguiendo el mismo patrón num={3}, num={4}, etc ... */}
            <Section num={9} title="Firma" color="#1e293b" icon="file-signature">
                <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold' },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  numText: { color: '#fff', fontSize: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  content: { padding: 15, backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 10 },
  datoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  datoValue: { fontSize: 14, fontWeight: 'bold' },
  firmaPreview: { width: '100%', height: 150, marginTop: 10 }
});