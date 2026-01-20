import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PREGUNTAS_TEXTO: any = {
  p1: "¿Problema cardíaco?",
  p2: "¿Dolor pecho ejercicio?",
  p3: "¿Dolor pecho reposo?",
  p4: "¿Mareos/Equilibrio?",
  p5: "¿Problema óseo/articular?",
  p6: "¿Medicamentos presión?",
  p7: "¿Otra razón médica?"
};

// --- COMPONENTES DE INTERFAZ ---
const InfoItem = ({ label, value, full }: any) => (
  <View style={[styles.infoItem, full ? { width: '100%' } : { width: '48%' }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.val}>{value || '---'}</Text>
  </View>
);

const Section = ({ title, color, icon, children }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  const imprimirPDF = async () => {
    // Generar filas de alimentos
    const alimentosHtml = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([ali, op]) => `<tr><td>${ali}</td><td style="text-align:right"><b>${op}</b></td></tr>`).join('');

    // Generar filas PAR-Q
    const parqHtml = Object.keys(PREGUNTAS_TEXTO)
      .map(key => `<tr><td>${PREGUNTAS_TEXTO[key]}</td><td style="text-align:right"><b>${alumno.salud?.parq?.[key] || 'N/A'}</b></td></tr>`).join('');

    const contenidoHtml = `
      <html>
        <head>
          <style>
            @page { margin: 1cm; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; margin-bottom: 20px; padding-bottom: 10px; }
            .block { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; page-break-inside: avoid; }
            .title { color: #3b82f6; font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 6px; font-size: 11px; border-bottom: 1px solid #f8fafc; }
            .label { color: #94a3b8; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXPEDIENTE DE RECOMPOSICIÓN PERSONAL</h1>
            <p>Cliente: ${alumno.nombre} | Email: ${alumno.email}</p>
          </div>

          <div class="block">
            <div class="title">1 y 2. Datos y Medidas</div>
            <table>
              <tr><td>Edad: ${alumno.datosFisicos?.edad}</td><td>Peso: ${alumno.datosFisicos?.peso}kg</td><td>Talla: ${alumno.datosFisicos?.altura}cm</td></tr>
              <tr><td>Cuello: ${alumno.medidas?.cuello}</td><td>Pecho: ${alumno.medidas?.pecho}</td><td>Cintura: ${alumno.medidas?.cintura}</td></tr>
              <tr><td>Cadera: ${alumno.medidas?.cadera}</td><td>Muslo: ${alumno.medidas?.muslo}</td><td>Brazo R: ${alumno.medidas?.brazoR}</td></tr>
            </table>
          </div>

          <div class="block">
            <div class="title">4. Historial de Salud</div>
            <p><span class="label">Enfermedades:</span> ${alumno.salud?.enfPers?.join(", ") || 'Ninguna'}</p>
            <p><span class="label">Lesiones:</span> ${alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'}</p>
            <p><span class="label">Operaciones:</span> ${alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'}</p>
          </div>

          <div class="block">
            <div class="title">6. Riesgos PAR-Q</div>
            <table>${parqHtml}</table>
          </div>

          <div class="block">
            <div class="title">7. Nutrición y Hábitos</div>
            <p><span class="label">Dieta Actual:</span> ${alumno.nutricion?.descAct}</p>
            <p><span class="label">Alcohol:</span> ${alumno.nutricion?.alcohol} | <span class="label">Sustancias:</span> ${alumno.nutricion?.sust}</p>
            <p><span class="label">Objetivo:</span> ${alumno.nutricion?.objetivo}</p>
          </div>

          <div class="block">
            <div class="title">8. Frecuencia de Alimentos</div>
            <table>${alimentosHtml}</table>
          </div>

          <div style="text-align:center; margin-top:30px;">
            <p class="label">Firma Registrada</p>
            ${alumno.firma?.startsWith('data:image') ? `<img src="${alumno.firma}" style="width:200px;"/>` : `<h2>${alumno.firma}</h2>`}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: contenidoHtml });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
          <TouchableOpacity onPress={imprimirPDF}><Ionicons name="print-outline" size={24} color="#3b82f6" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.webWrapper}>
          <Section title="1. Datos Personales" color="#3b82f6" icon="account">
            <View style={styles.grid}>
              <InfoItem label="Nombre" value={alumno.nombre} full />
              <InfoItem label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
              <InfoItem label="Peso/Altura" value={`${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm`} />
            </View>
          </Section>

          <Section title="2. Medidas (cm)" color="#10b981" icon="ruler-square">
            <View style={styles.grid}>
              <InfoItem label="Cuello" value={alumno.medidas?.cuello} />
              <InfoItem label="Pecho" value={alumno.medidas?.pecho} />
              <InfoItem label="Cintura" value={alumno.medidas?.cintura} />
              <InfoItem label="Cadera" value={alumno.medidas?.cadera} />
            </View>
          </Section>

          <Section title="4. Salud" color="#ef4444" icon="heart-pulse">
            <InfoItem label="Enfermedades" value={alumno.salud?.enfPers?.join(", ")} full />
            <InfoItem label="Lesión" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} full />
            <InfoItem label="Operación" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'} full />
          </Section>

          <Section title="6. PAR-Q" color="#0ea5e9" icon="clipboard-pulse">
            {Object.keys(PREGUNTAS_TEXTO).map(k => (
              <View key={k} style={styles.parqRow}>
                <Text style={styles.parqText}>{PREGUNTAS_TEXTO[k]}</Text>
                <Text style={[styles.parqVal, alumno.salud?.parq?.[k] === 'si' && {color:'red'}]}>{alumno.salud?.parq?.[k]?.toUpperCase()}</Text>
              </View>
            ))}
          </Section>

          <Section title="7. Nutrición" color="#8b5cf6" icon="food-apple">
            <InfoItem label="Alcohol" value={alumno.nutricion?.alcohol} />
            <InfoItem label="Sustancias" value={alumno.nutricion?.sust} />
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
          </Section>

          <Section title="8. Frecuencia" color="#10b981" icon="format-list-bulleted">
            {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
              <View key={ali} style={styles.parqRow}><Text>{ali}</Text><Text style={{fontWeight:'bold'}}>{op}</Text></View>
            ))}
          </Section>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.webFooterContent}>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}><Text style={styles.btnTxt}>RECHAZAR</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}><Text style={styles.btnTxt}>ACEPTAR Y CREAR PLAN</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  webContainerRow: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 18, alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: 'bold' },
  container: { flex: 1 },
  webWrapper: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, elevation: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 12 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  parqText: { fontSize: 12, color: '#475569' },
  parqVal: { fontSize: 12, fontWeight: 'bold' },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold' }
});