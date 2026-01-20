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

// --- COMPONENTES DE APOYO ---
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
    const alimentosHtml = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([ali, op]) => `<tr><td>${ali}</td><td style="text-align:right"><b>${op}</b></td></tr>`).join('');

    const parqHtml = Object.keys(PREGUNTAS_TEXTO)
      .map(key => `<tr><td>${PREGUNTAS_TEXTO[key]}</td><td style="text-align:right"><b>${alumno.salud?.parq?.[key]?.toUpperCase() || 'N/A'}</b></td></tr>`).join('');

    const contenidoHtml = `
      <html>
        <head>
          <style>
            @page { margin: 1cm; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; margin-bottom: 20px; padding-bottom: 10px; }
            .block { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 15px; page-break-inside: avoid; }
            .title { color: #3b82f6; font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 5px; font-size: 11px; border-bottom: 1px solid #f8fafc; }
            .label { color: #94a3b8; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header"><h1>EXPEDIENTE: ${alumno.nombre}</h1></div>
          <div class="block">
            <div class="title">1. Datos Personales</div>
            <table>
                <tr><td>Email: ${alumno.email}</td><td>Tel: ${alumno.telefono}</td></tr>
                <tr><td>Edad: ${alumno.datosFisicos?.edad}</td><td>Peso: ${alumno.datosFisicos?.peso}kg</td><td>Talla: ${alumno.datosFisicos?.altura}cm</td></tr>
            </table>
          </div>
          <div class="block">
            <div class="title">2. Medidas Corporales</div>
            <table>
                <tr><td>Cuello: ${alumno.medidas?.cuello}</td><td>Pecho: ${alumno.medidas?.pecho}</td><td>Cintura: ${alumno.medidas?.cintura}</td></tr>
                <tr><td>Cadera: ${alumno.medidas?.cadera}</td><td>Muslo: ${alumno.medidas?.muslo}</td><td>Brazo R: ${alumno.medidas?.brazoR}</td></tr>
            </table>
          </div>
          <div class="block"><div class="title">4. Salud</div><p>Enf: ${alumno.salud?.enfPers?.join(", ")}</p><p>Lesión: ${alumno.salud?.detalleLesion || 'No'}</p><p>Operación: ${alumno.salud?.detalleOperacion || 'No'}</p></div>
          <div class="block"><div class="title">6. PAR-Q</div><table>${parqHtml}</table></div>
          <div class="block"><div class="title">8. Frecuencia</div><table>${alimentosHtml}</table></div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html: contenidoHtml });
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
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
              <InfoItem label="Email" value={alumno.email} full />
              <InfoItem label="Teléfono" value={alumno.telefono} />
              <InfoItem label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
              <InfoItem label="Peso" value={`${alumno.datosFisicos?.peso} kg`} />
              <InfoItem label="Altura" value={`${alumno.datosFisicos?.altura} cm`} />
              <InfoItem label="Género" value={alumno.datosFisicos?.genero} />
            </View>
          </Section>

          <Section title="2. Medidas (cm)" color="#10b981" icon="ruler-square">
            <View style={styles.grid}>
              <InfoItem label="Cuello" value={alumno.medidas?.cuello} />
              <InfoItem label="Pecho" value={alumno.medidas?.pecho} />
              <InfoItem label="Brazo R" value={alumno.medidas?.brazoR} />
              <InfoItem label="Brazo F" value={alumno.medidas?.brazoF} />
              <InfoItem label="Cintura" value={alumno.medidas?.cintura} />
              <InfoItem label="Cadera" value={alumno.medidas?.cadera} />
              <InfoItem label="Muslo" value={alumno.medidas?.muslo} />
              <InfoItem label="Pierna" value={alumno.medidas?.pierna} />
            </View>
          </Section>

          {alumno.datosFisicos?.genero === 'mujer' && (
            <Section title="3. Ciclo Menstrual" color="#ec4899" icon="flower">
              <View style={styles.grid}>
                <InfoItem label="Tipo" value={alumno.ciclo?.tipo} />
                <InfoItem label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
              </View>
            </Section>
          )}

          <Section title="4. Historial Salud" color="#ef4444" icon="heart-pulse">
            <InfoItem label="Enf. Familiares" value={alumno.salud?.enfFam?.join(", ")} full />
            <InfoItem label="Enf. Propias" value={alumno.salud?.enfPers?.join(", ")} full />
            <InfoItem label="¿Lesión?" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} full />
            <InfoItem label="¿Operación?" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'} full />
            <InfoItem label="FCR" value={alumno.salud?.frecuenciaCardiaca} />
          </Section>

          <Section title="5. Estilo de Vida (IPAQ)" color="#f59e0b" icon="walk">
            <View style={styles.grid}>
              <InfoItem label="Act. Vigorosa" value={`${alumno.ipaq?.vDias}d / ${alumno.ipaq?.vMin}m`} />
              <InfoItem label="Act. Moderada" value={`${alumno.ipaq?.mDias}d / ${alumno.ipaq?.mMin}m`} />
              <InfoItem label="Caminata" value={`${alumno.ipaq?.cDias}d / ${alumno.ipaq?.cMin}m`} />
              <InfoItem label="Sentado" value={alumno.ipaq?.sentado} />
              <InfoItem label="Sueño" value={alumno.ipaq?.horasSueno} />
            </View>
          </Section>

          <Section title="6. PAR-Q" color="#0ea5e9" icon="clipboard-pulse">
            {Object.keys(PREGUNTAS_TEXTO).map((k) => (
              <View key={k} style={styles.parqRow}>
                <Text style={styles.parqText}>{PREGUNTAS_TEXTO[k]}</Text>
                <Text style={[styles.parqVal, alumno.salud?.parq?.[k] === 'si' && {color:'red'}]}>{alumno.salud?.parq?.[k]?.toUpperCase()}</Text>
              </View>
            ))}
          </Section>

          <Section title="7. Nutrición y Hábitos" color="#8b5cf6" icon="food-apple">
            <InfoItem label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
            <InfoItem label="Dieta" value={alumno.nutricion?.descAct} full />
            <InfoItem label="Alcohol" value={`${alumno.nutricion?.alcohol} (${alumno.nutricion?.alcoholFreq})`} full />
            <InfoItem label="Fuma/Sust" value={`${alumno.nutricion?.sust} (${alumno.nutricion?.sustFreq})`} full />
            <InfoItem label="Desea Comidas" value={alumno.nutricion?.comidasDes} />
            <InfoItem label="Días Entreno" value={alumno.nutricion?.entrenos} />
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="format-list-bulleted">
            {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
              <View key={ali} style={styles.parqRow}><Text style={{fontSize:12}}>{ali}</Text><Text style={{fontSize:12, fontWeight:'bold'}}>{op}</Text></View>
            ))}
          </Section>

          <Section title="9. Firma y Consentimiento" color="#1e293b" icon="file-sign">
            {alumno.firma?.startsWith('data:image') ? (
              <Image source={{ uri: alumno.firma }} style={styles.firma} />
            ) : (
              <Text style={styles.firmaNombre}>{alumno.firma}</Text>
            )}
          </Section>

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
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155', fontWeight: '500' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  parqText: { fontSize: 12, color: '#475569', flex: 0.8 },
  parqVal: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
  firma: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#f1f5f9', borderRadius: 15 },
  firmaNombre: { fontSize: 24, fontStyle: 'italic', textAlign: 'center', color: '#1e293b' },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});