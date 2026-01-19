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

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  // FUNCIÓN PARA GENERAR Y DESCARGAR EL PDF
const imprimirPDF = async () => {
    // 1. Generamos las filas de alimentos
    const filasAlimentos = alumno.frecuenciaAlimentos 
      ? Object.entries(alumno.frecuenciaAlimentos)
          .map(([ali, op]) => `<tr><td style="color:#64748b">${ali}</td><td style="text-align:right"><b>${op}</b></td></tr>`)
          .join('')
      : '<tr><td>No especificado</td></tr>';

    // 2. Generamos las filas del PAR-Q
    const filasParq = Object.keys(PREGUNTAS_TEXTO)
      .map(key => `
        <tr>
          <td style="font-size:10px">${PREGUNTAS_TEXTO[key]}</td>
          <td style="text-align:right; color:${alumno.salud?.parq?.[key] === 'si' ? '#ef4444' : '#10b981'}">
            <b>${alumno.salud?.parq?.[key]?.toUpperCase() || 'N/A'}</b>
          </td>
        </tr>`)
      .join('');

    // 3. Definimos la variable HTML (Asegúrate de que esta variable esté antes del Print)
    const contenidoHtml = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; page-break-inside: avoid; }
            .section-title { font-weight: bold; color: #3b82f6; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 4px; font-size: 11px; border-bottom: 1px solid #f8fafc; }
            .label { color: #94a3b8; font-weight: bold; font-size: 9px; }
            .firma { text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXPEDIENTE DE RECOMPOSICIÓN</h1>
            <p><b>Cliente:</b> ${alumno.nombre} | <b>Email:</b> ${alumno.email}</p>
          </div>

          <div class="section">
            <div class="section-title">1. Datos Personales y Antropometría</div>
            <table>
              <tr><td>Edad: <b>${alumno.datosFisicos?.edad} años</b></td><td>Género: <b>${alumno.datosFisicos?.genero}</b></td></tr>
              <tr><td>Peso: <b>${alumno.datosFisicos?.weight || alumno.datosFisicos?.peso} kg</b></td><td>Altura: <b>${alumno.datosFisicos?.altura} cm</b></td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">2. Medidas Corporales</div>
            <table>
              <tr><td>Cuello: ${alumno.medidas?.cuello}</td><td>Pecho: ${alumno.medidas?.pecho}</td></tr>
              <tr><td>Cintura: ${alumno.medidas?.cintura}</td><td>Cadera: ${alumno.medidas?.cadera}</td></tr>
              <tr><td>Brazo R/F: ${alumno.medidas?.brazoR}/${alumno.medidas?.brazoF}</td><td>Muslo/Pierna: ${alumno.medidas?.muslo}/${alumno.medidas?.pierna}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">3. Historial de Salud y Riesgos (PAR-Q)</div>
            <p style="font-size:10px"><b>FCR:</b> ${alumno.salud?.frecuenciaCardiaca} lpm</p>
            <table>${filasParq}</table>
          </div>

          <div class="section">
            <div class="section-title">4. Nutrición y Hábitos</div>
            <p style="font-size:11px"><b>Dieta actual:</b> ${alumno.nutricion?.descAct}</p>
            <p style="font-size:11px"><b>Alcohol:</b> ${alumno.nutricion?.alcohol === 'si' ? alumno.nutricion?.alcoholFreq : 'No'}</p>
            <p style="font-size:11px"><b>Días Entreno:</b> ${alumno.nutricion?.entrenos} | <b>Objetivo:</b> ${alumno.nutricion?.objetivo}</p>
          </div>

          <div class="section">
            <div class="section-title">5. Frecuencia de Alimentos</div>
            <table>${filasAlimentos}</table>
          </div>

          <div class="firma">
            <p class="label">Firma del Cliente</p>
            ${alumno.firma?.startsWith('data:image') 
              ? `<img src="${alumno.firma}" style="width:200px; height:80px;" />` 
              : `<h3>${alumno.firma}</h3>`}
          </div>
        </body>
      </html>
    `;

    try {
      // AQUÍ ESTÁ EL CAMBIO: Usamos 'html: contenidoHtml' para que coincida con el nombre de nuestra variable
      await Print.printAsync({ html: contenidoHtml }); 
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  const InfoItem = ({ label, value, full }: any) => (
    <View style={[styles.infoItem, full ? { width: '100%' } : { width: '48%' }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
          {/* BOTÓN DE IMPRESIÓN HABILITADO */}
          <TouchableOpacity onPress={imprimirPDF}>
            <Ionicons name="print-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
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
            </View>
          </Section>

          <Section title="2. Medidas Corporales (cm)" color="#10b981" icon="ruler-square">
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
                <InfoItem label="Tipo de Ciclo" value={alumno.ciclo?.tipo} />
                <InfoItem label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
              </View>
            </Section>
          )}

          <Section title="4. Historial Salud" color="#ef4444" icon="heart-pulse">
            <InfoItem label="Enf. Familiares" value={alumno.salud?.enfFam?.join(", ")} full />
            <InfoItem label="Enf. Propias" value={alumno.salud?.enfPers?.join(", ")} full />
            <InfoItem label="¿Lesión?" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} full />
            <InfoItem label="¿Operación?" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'} full />
            <InfoItem label="FCR" value={`${alumno.salud?.frecuenciaCardiaca} lpm`} />
          </Section>

          <Section title="5. Estilo de Vida (IPAQ)" color="#f59e0b" icon="walk">
            <View style={styles.grid}>
              <InfoItem label="Act. Vigorosa" value={`${alumno.ipaq?.vDias}d / ${alumno.ipaq?.vMin}m`} />
              <InfoItem label="Act. Moderada" value={`${alumno.ipaq?.mDias}d / ${alumno.ipaq?.mMin}m`} />
              <InfoItem label="Caminata" value={`${alumno.ipaq?.cDias}d / ${alumno.ipaq?.cMin}m`} />
              <InfoItem label="Sueño" value={`${alumno.ipaq?.horasSueno} hrs`} />
            </View>
          </Section>

          <Section title="6. Riesgos PAR-Q" color="#0ea5e9" icon="clipboard-pulse">
            {Object.keys(PREGUNTAS_TEXTO).map((key) => (
              <View key={key} style={styles.parqRow}>
                <Text style={styles.parqText}>{PREGUNTAS_TEXTO[key]}</Text>
                <Text style={[styles.parqVal, alumno.salud?.parq?.[key] === 'si' ? {color: '#ef4444', fontWeight:'bold'} : {color: '#10b981'}]}>
                  {alumno.salud?.parq?.[key]?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            ))}
          </Section>

          <Section title="7. Nutrición y Hábitos" color="#8b5cf6" icon="food-apple">
            <InfoItem label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
            <InfoItem label="Descripción Dieta" value={alumno.nutricion?.descAct} full />
            <InfoItem label="¿Bebe Alcohol?" value={alumno.nutricion?.alcohol === 'si' ? `SÍ (${alumno.nutricion?.alcoholFreq})` : 'No'} full />
            <InfoItem label="¿Sustancias / Fuma?" value={alumno.nutricion?.sust === 'si' ? `SÍ (${alumno.nutricion?.sustFreq})` : 'No'} full />
            <View style={styles.grid}>
                <InfoItem label="Comidas deseadas" value={alumno.nutricion?.comidasDes} />
                <InfoItem label="Días de Entreno" value={alumno.nutricion?.entrenos} />
            </View>
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="format-list-bulleted">
             <View style={styles.grid}>
               {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
                 <InfoItem key={ali} label={ali} value={op} />
               ))}
             </View>
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

const Section = ({ title, color, icon, children }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  webContainerRow: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 18, alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: 'bold' },
  container: { flex: 1 },
  webWrapper: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingLeft: 5 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  parqText: { fontSize: 12, color: '#475569', flex: 0.8 },
  parqVal: { fontSize: 12, fontWeight: 'bold' },
  firma: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#f1f5f9', borderRadius: 15, marginTop: 10 },
  firmaNombre: { fontSize: 24, fontStyle: 'italic', textAlign: 'center', marginTop: 15, color: '#1e293b' },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});