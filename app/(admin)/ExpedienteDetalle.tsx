import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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

  const generarPDFCompleto = async () => {
    const alimentosHtml = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([ali, op]) => `<tr><td style="border-bottom:1px solid #eee; padding:8px;">${ali}</td><td style="text-align:right; padding:8px;"><b>${op}</b></td></tr>`).join('');

    const parqHtml = Object.keys(PREGUNTAS_TEXTO)
      .map(key => `<tr><td style="border-bottom:1px solid #eee; padding:8px;">${PREGUNTAS_TEXTO[key]}</td><td style="text-align:right; padding:8px;"><b>${alumno.salud?.parq?.[key]?.toUpperCase() || 'N/A'}</b></td></tr>`).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica', sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; }
          .container { width: 100%; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; margin-bottom: 30px; padding-bottom: 10px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; display: block; width: 100%; }
          .section-title { background: #f8fafc; color: #3b82f6; font-weight: bold; font-size: 14px; padding: 10px; border-left: 5px solid #3b82f6; margin-bottom: 15px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; }
          td { font-size: 11px; padding: 5px; }
          .label { color: #64748b; font-weight: bold; font-size: 10px; text-transform: uppercase; }
          .firma-img { width: 300px; height: auto; margin-top: 20px; border-bottom: 2px solid #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EXPEDIENTE DE RECOMPOSICIÓN CORPORAL</h1>
            <p>Cliente: <b>${alumno.nombre}</b> | Email: ${alumno.email}</p>
          </div>

          <div class="section">
            <div class="section-title">1. Datos Personales</div>
            <table>
              <tr><td><span class="label">Email:</span><br/>${alumno.email}</td><td><span class="label">Teléfono:</span><br/>${alumno.telefono}</td></tr>
              <tr><td><span class="label">Edad:</span><br/>${alumno.datosFisicos?.edad} años</td><td><span class="label">Género:</span><br/>${alumno.datosFisicos?.genero}</td></tr>
              <tr><td><span class="label">Peso Actual:</span><br/>${alumno.datosFisicos?.peso} kg</td><td><span class="label">Estatura:</span><br/>${alumno.datosFisicos?.altura} cm</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">2. Medidas Corporales (CM)</div>
            <table>
              <tr><td>Cuello: <b>${alumno.medidas?.cuello}</b></td><td>Pecho: <b>${alumno.medidas?.pecho}</b></td><td>Cintura: <b>${alumno.medidas?.cintura}</b></td></tr>
              <tr><td>Cadera: <b>${alumno.medidas?.cadera}</b></td><td>Muslo: <b>${alumno.medidas?.muslo}</b></td><td>Pierna: <b>${alumno.medidas?.pierna}</b></td></tr>
              <tr><td>Brazo R: <b>${alumno.medidas?.brazoR}</b></td><td>Brazo F: <b>${alumno.medidas?.brazoF}</b></td><td></td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">4. Historial de Salud</div>
            <p><span class="label">Enfermedades Familiares:</span><br/>${alumno.salud?.enfFam?.join(", ") || 'Ninguna'}</p>
            <p><span class="label">Enfermedades Propias:</span><br/>${alumno.salud?.enfPers?.join(", ") || 'Ninguna'}</p>
            <p><span class="label">Lesiones / Operaciones:</span><br/>L: ${alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} | O: ${alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'}</p>
            <p><span class="label">Frecuencia Cardiaca:</span> ${alumno.salud?.frecuenciaCardiaca} lpm</p>
          </div>

          <div class="section">
            <div class="section-title">5. Estilo de Vida (IPAQ)</div>
            <p>Actividad Vigorosa: <b>${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min</b></p>
            <p>Caminata: <b>${alumno.ipaq?.cDias} días / ${alumno.ipaq?.cMin} min</b></p>
            <p>Horas de Sueño: <b>${alumno.ipaq?.horasSueno} h</b> | Sentado: <b>${alumno.ipaq?.sentado} h</b></p>
          </div>

          <div class="section">
            <div class="section-title">6. Cuestionario PAR-Q</div>
            <table>${parqHtml}</table>
          </div>

          <div class="section">
            <div class="section-title">7. Nutrición y Hábitos</div>
            <p><span class="label">Objetivo:</span> <b>${alumno.nutricion?.objetivo}</b></p>
            <p><span class="label">Dieta Actual:</span><br/>${alumno.nutricion?.descAct}</p>
            <p><span class="label">Hábitos:</span> Alcohol (${alumno.nutricion?.alcohol}) | Sustancias (${alumno.nutricion?.sust})</p>
            <p><span class="label">Plan:</span> ${alumno.nutricion?.entrenos} días entreno / ${alumno.nutricion?.comidasDes} comidas deseadas</p>
          </div>

          <div class="section">
            <div class="section-title">8. Frecuencia de Alimentos</div>
            <table>${alimentosHtml}</table>
          </div>

          <div class="section" style="text-align:center; margin-top:40px;">
            <div class="section-title">9. Firma del Cliente</div>
            ${alumno.firma?.startsWith('data:image') 
              ? `<img src="${alumno.firma}" class="firma-img" />` 
              : `<h2>${alumno.firma}</h2>`}
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE: {alumno.nombre?.toUpperCase()}</Text>
          <TouchableOpacity onPress={generarPDFCompleto}><Ionicons name="cloud-download-outline" size={26} color="#3b82f6" /></TouchableOpacity>
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
            <InfoItem label="Enfermedades Propias" value={alumno.salud?.enfPers?.join(", ")} full />
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
            <InfoItem label="Descripción" value={alumno.nutricion?.descAct} full />
            <InfoItem label="Alcohol" value={alumno.nutricion?.alcohol} />
            <InfoItem label="Sustancias" value={alumno.nutricion?.sust} />
            <InfoItem label="Entrenos" value={alumno.nutricion?.entrenos} />
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
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155' },
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