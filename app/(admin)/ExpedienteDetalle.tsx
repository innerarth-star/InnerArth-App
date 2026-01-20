import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- FUNCIONES DE APOYO ---
const procesarTexto = (t: any) => (t ? String(t).toUpperCase() : '---');
const formatearActividad = (d: any, m: any) => (d && m ? `${d} DÍAS / ${m} MIN` : 'SIN ACTIVIDAD');

const PREGUNTAS_TEXTO: any = {
  p1: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco?",
  p2: "¿Siente dolor en el pecho cuando realiza actividad física?",
  p3: "¿En el último mes, ha sentido dolor en el pecho sin actividad física?",
  p4: "¿Pierde el equilibrio debido a mareos o pérdida de conocimiento?",
  p5: "¿Tiene algún problema óseo o articular que podría empeorar?",
  p6: "¿Le receta actualmente medicamentos para la presión o corazón?",
  p7: "¿Sabe de alguna otra razón por la cual no debería hacer ejercicio?"
};

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

  const generarPDF = async () => {
    // Generamos las filas de alimentos antes del HTML para evitar errores
    const alimentosFilas = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([k, v]) => `<tr><td style="border-bottom:1px solid #eee; padding:5px;">${k}</td><td style="text-align:right;"><b>${v}</b></td></tr>`).join('');

    const parqFilas = Object.keys(PREGUNTAS_TEXTO)
      .map(k => `<tr><td style="font-size:10px; border-bottom:1px solid #eee;">${PREGUNTAS_TEXTO[k]}</td><td style="text-align:right;"><b>${alumno.salud?.parq?.[k]?.toUpperCase()}</b></td></tr>`).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica', sans-serif; color: #1e293b; margin: 0; padding: 0; }
          .page-container { width: 100%; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
          .block-title { background: #3b82f6; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          td { font-size: 11px; padding: 4px; vertical-align: top; }
          .label { color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: bold; }
          .break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <h1>EXPEDIENTE TÉCNICO: ${procesarTexto(alumno.nombre)}</h1>
            <p>Email: ${alumno.email} | ID: ${alumno.id}</p>
          </div>

          <div class="block">
            <div class="block-title">1. DATOS PERSONALES</div>
            <table>
              <tr><td><span class="label">Teléfono:</span><br/>${alumno.telefono}</td><td><span class="label">Edad:</span><br/>${alumno.datosFisicos?.edad} años</td></tr>
              <tr><td><span class="label">Peso:</span><br/>${alumno.datosFisicos?.peso}kg</td><td><span class="label">Altura:</span><br/>${alumno.datosFisicos?.altura}cm</td></tr>
            </table>
          </div>

          <div class="block">
            <div class="block-title">2. MEDIDAS CORPORALES</div>
            <table>
              <tr><td>Cuello: ${alumno.medidas?.cuello}</td><td>Pecho: ${alumno.medidas?.pecho}</td><td>Cintura: ${alumno.medidas?.cintura}</td></tr>
              <tr><td>Cadera: ${alumno.medidas?.cadera}</td><td>Muslo: ${alumno.medidas?.muslo}</td><td>Pierna: ${alumno.medidas?.pierna}</td></tr>
              <tr><td>Brazo R: ${alumno.medidas?.brazoR}</td><td>Brazo F: ${alumno.medidas?.brazoF}</td><td></td></tr>
            </table>
          </div>

          <div class="block">
            <div class="block-title">4. SALUD Y RIESGOS</div>
            <p><b>Enfermedades:</b> ${alumno.salud?.enfPers?.join(", ") || 'Ninguna'}</p>
            <table style="margin-top:10px;">${parqFilas}</table>
          </div>

          <div class="break"></div>

          <div class="block">
            <div class="block-title">7. NUTRICIÓN Y HÁBITOS</div>
            <p><b>Objetivo:</b> ${procesarTexto(alumno.nutricion?.objetivo)}</p>
            <p><b>Hábitos:</b> Alcohol (${alumno.nutricion?.alcohol}) | Fuma/Sust (${alumno.nutricion?.sust})</p>
          </div>

          <div class="block">
            <div class="block-title">8. FRECUENCIA DE ALIMENTOS</div>
            <table>${alimentosFilas}</table>
          </div>

          <div style="text-align:center; margin-top:50px;">
            <p class="label">FIRMA DEL ALUMNO</p>
            <img src="${alumno.firma}" style="width:250px; border-bottom:2px solid #000;" />
          </div>
        </div>
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
          <TouchableOpacity onPress={generarPDF}><Ionicons name="cloud-download-outline" size={26} color="#3b82f6" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.webWrapper}>
          <Section title="1. Datos Personales" color="#3b82f6" icon="account">
            <View style={styles.gridApp}><InfoItem label="Nombre" value={alumno.nombre} full /><InfoItem label="Email" value={alumno.email} full /><InfoItem label="Teléfono" value={alumno.telefono} /><InfoItem label="Edad" value={`${alumno.datosFisicos?.edad} años`} /><InfoItem label="Peso / Altura" value={`${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm`} /></View>
          </Section>

          <Section title="2. Medidas (cm)" color="#10b981" icon="ruler-square">
            <View style={styles.gridApp}><InfoItem label="Cuello" value={alumno.medidas?.cuello} /><InfoItem label="Pecho" value={alumno.medidas?.pecho} /><InfoItem label="Cintura" value={alumno.medidas?.cintura} /><InfoItem label="Cadera" value={alumno.medidas?.cadera} /><InfoItem label="Brazo R" value={alumno.medidas?.brazoR} /><InfoItem label="Brazo F" value={alumno.medidas?.brazoF} /><InfoItem label="Muslo" value={alumno.medidas?.muslo} /><InfoItem label="Pierna" value={alumno.medidas?.pierna} /></View>
          </Section>

          {alumno.datosFisicos?.genero === 'mujer' && (
            <Section title="3. Ciclo Menstrual" color="#ec4899" icon="flower"><View style={styles.gridApp}><InfoItem label="Tipo" value={alumno.ciclo?.tipo} /><InfoItem label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} /></View></Section>
          )}

          <Section title="4. Historial Salud" color="#ef4444" icon="heart-pulse">
            <InfoItem label="Enf. Propias" value={alumno.salud?.enfPers?.join(", ")} full /><InfoItem label="¿Lesión?" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} full /><InfoItem label="¿Operación?" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'} full />
          </Section>

          <Section title="5. Estilo de Vida (IPAQ)" color="#f59e0b" icon="walk">
            <View style={styles.gridApp}><InfoItem label="Vigorosa" value={formatearActividad(alumno.ipaq?.vDias, alumno.ipaq?.vMin)} /><InfoItem label="Moderada" value={formatearActividad(alumno.ipaq?.mDias, alumno.ipaq?.mMin)} /><InfoItem label="Sueño" value={`${alumno.ipaq?.horasSueno}h`} /><InfoItem label="Sentado" value={`${alumno.ipaq?.sentado}h`} /></View>
          </Section>

          <Section title="6. PAR-Q" color="#0ea5e9" icon="clipboard-pulse">
            {Object.keys(PREGUNTAS_TEXTO).map(k => <View key={k} style={styles.parqRow}><Text style={styles.parqText}>{PREGUNTAS_TEXTO[k]}</Text><Text style={[styles.parqVal, alumno.salud?.parq?.[k] === 'si' && {color:'red'}]}>{alumno.salud?.parq?.[k]?.toUpperCase()}</Text></View>)}
          </Section>

          <Section title="7. Nutrición y Hábitos" color="#8b5cf6" icon="food-apple">
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full /><InfoItem label="Comidas Deseadas" value={alumno.nutricion?.comidasDes} /><InfoItem label="Días Entreno" value={alumno.nutricion?.entrenos} />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="format-list-bulleted">
            <View style={styles.gridApp}>{Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => <View key={ali} style={styles.parqRow}><Text style={{fontSize:11}}>{ali}</Text><Text style={{fontSize:11, fontWeight:'bold'}}>{op}</Text></View>)}</View>
          </Section>

          <Section title="9. Firma" color="#1e293b" icon="file-sign"><Image source={{ uri: alumno.firma }} style={styles.firma} /></Section>
          <View style={{ height: 120 }} />
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
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 1 },
  gridApp: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', width: '100%' },
  parqText: { fontSize: 11, color: '#475569', flex: 0.8 },
  parqVal: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
  firma: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#f1f5f9', borderRadius: 15 },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});