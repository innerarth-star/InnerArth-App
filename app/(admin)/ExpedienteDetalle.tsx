import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- FUNCIONES DE APOYO ---
const procesarTexto = (texto: any) => (texto ? String(texto).toUpperCase() : '---');

const formatearActividad = (dias: any, min: any) => {
  if (!dias || !min) return 'SIN ACTIVIDAD';
  return `${dias} DÍAS / ${min} MIN`;
};

const consentimientoCompleto = `El alumno declara que la información proporcionada es verídica. Este documento sirve como expediente técnico para la elaboración de planes de entrenamiento y nutrición personalizados bajo la metodología FitTech.`;

const PREGUNTAS_TEXTO: any = {
  p1: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco?",
  p2: "¿Siente dolor en el pecho cuando realiza actividad física?",
  p3: "¿En el último mes, ha sentido dolor en el pecho sin actividad física?",
  p4: "¿Pierde el equilibrio debido a mareos o pérdida de conocimiento?",
  p5: "¿Tiene algún problema óseo o articular que podría empeorar?",
  p6: "¿Le receta actualmente medicamentos para la presión o corazón?",
  p7: "¿Sabe de alguna otra razón por la cual no debería hacer ejercicio?"
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

  const exportarPDF = async () => {
    const a = alumno;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica', sans-serif; color: #334155; line-height: 1.4; }
          .block { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; }
          .section-title { background: #3b82f6; color: white; padding: 6px 15px; border-radius: 20px; font-size: 11px; display: inline-block; text-transform: uppercase; margin-bottom: 10px; }
          .grid { display: flex; flex-wrap: wrap; }
          .item { width: 50%; padding: 5px; }
          .label { font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .value { font-size: 11px; display: block; font-weight: bold; }
          .page-break { page-break-before: always; }
          .firma-img { width: 200px; border-bottom: 2px solid #000; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div style="text-align:center; border-bottom: 4px solid #3b82f6; padding-bottom:10px; margin-bottom:20px;">
          <h1 style="margin:0; font-size:22px;">EXPEDIENTE FITTECH</h1>
          <p style="margin:5px 0; font-size:12px;">Alumno: ${procesarTexto(a.nombre)} | ID: ${a.id}</p>
        </div>

        <div class="block">
          <div class="section-title">1. Datos e Identificación</div>
          <div class="grid">
            <div class="item"><span class="label">Teléfono</span><span class="value">${a.telefono}</span></div>
            <div class="item"><span class="label">Género</span><span class="value">${a.datosFisicos?.genero}</span></div>
            <div class="item"><span class="label">Edad</span><span class="value">${a.datosFisicos?.edad} años</span></div>
            <div class="item"><span class="label">Peso/Talla</span><span class="value">${a.datosFisicos?.peso}kg / ${a.datosFisicos?.altura}cm</span></div>
          </div>
        </div>

        <div class="block">
          <div class="section-title">2. Medidas Corporales</div>
          <div class="grid">
            <div class="item"><span class="label">Cuello</span><span class="value">${a.medidas?.cuello}</span></div>
            <div class="item"><span class="label">Pecho</span><span class="value">${a.medidas?.pecho}</span></div>
            <div class="item"><span class="label">Cintura</span><span class="value">${a.medidas?.cintura}</span></div>
            <div class="item"><span class="label">Cadera</span><span class="value">${a.medidas?.cadera}</span></div>
            <div class="item"><span class="label">Brazos (R/F)</span><span class="value">${a.medidas?.brazoR} / ${a.medidas?.brazoF}</span></div>
            <div class="item"><span class="label">Piernas (M/P)</span><span class="value">${a.medidas?.muslo} / ${a.medidas?.pierna}</span></div>
          </div>
        </div>

        <div class="block">
          <div class="section-title">4. Salud y PAR-Q</div>
          <p style="font-size:11px; margin:0;"><b>Enf:</b> ${a.salud?.enfPers?.join(", ") || 'Ninguna'}</p>
          <p style="font-size:11px; margin:5px 0;"><b>Lesiones/Cirugías:</b> ${a.salud?.detalleLesion || 'No'} / ${a.salud?.detalleOperacion || 'No'}</p>
          <table style="width:100%; margin-top:10px; border-top:1px solid #eee;">
            ${Object.keys(PREGUNTAS_TEXTO).map(k => `<tr><td style="font-size:9px; padding:3px;">${PREGUNTAS_TEXTO[k]}</td><td style="font-size:9px; text-align:right;"><b>${a.salud?.parq?.[k]?.toUpperCase()}</b></td></tr>`).join('')}
          </table>
        </div>

        <div class="page-break"></div>

        <div class="block">
          <div class="section-title">7. Nutrición y Hábitos</div>
          <p style="font-size:11px;"><b>Objetivo:</b> ${procesarTexto(a.nutricion?.objetivo)}</p>
          <p style="font-size:11px;"><b>Dieta Actual:</b> ${a.nutricion?.descAct}</p>
          <p style="font-size:11px;"><b>Alcohol/Sustancias:</b> ${a.nutricion?.alcohol} / ${a.nutricion?.sust}</p>
        </div>

        <div class="block">
          <div class="section-title">8. Frecuencia Alimentaria</div>
          <div class="grid">
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k,v]) => `<div class="item" style="width:33%; border:0.5px solid #eee;"><span class="label">${k}</span><span class="value">${v}</span></div>`).join('')}
          </div>
        </div>

        <div class="signature-box" style="text-align:center; margin-top:50px;">
          <p class="label">Firma del Alumno</p>
          <img src="${a.firma}" class="firma-img" />
          <p style="font-size:10px; margin-top:10px;">${procesarTexto(a.nombre)}</p>
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
          <Text style={styles.headerTitle}>EXPEDIENTE DEL ALUMNO</Text>
          <TouchableOpacity onPress={exportarPDF}><Ionicons name="cloud-download-outline" size={26} color="#3b82f6" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.webWrapper}>
          
          <Section title="1. Datos Personales" color="#3b82f6" icon="account">
            <View style={styles.gridApp}>
              <InfoItem label="Nombre" value={alumno.nombre} full />
              <InfoItem label="Email" value={alumno.email} full />
              <InfoItem label="Teléfono" value={alumno.telefono} />
              <InfoItem label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
              <InfoItem label="Peso / Altura" value={`${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm`} />
              <InfoItem label="Género" value={alumno.datosFisicos?.genero} />
            </View>
          </Section>

          <Section title="2. Medidas (cm)" color="#10b981" icon="ruler-square">
            <View style={styles.gridApp}>
              <InfoItem label="Cuello" value={alumno.medidas?.cuello} />
              <InfoItem label="Pecho" value={alumno.medidas?.pecho} />
              <InfoItem label="Cintura" value={alumno.medidas?.cintura} />
              <InfoItem label="Cadera" value={alumno.medidas?.cadera} />
              <InfoItem label="Brazo R" value={alumno.medidas?.brazoR} />
              <InfoItem label="Brazo F" value={alumno.medidas?.brazoF} />
              <InfoItem label="Muslo" value={alumno.medidas?.muslo} />
              <InfoItem label="Pierna" value={alumno.medidas?.pierna} />
            </View>
          </Section>

          {alumno.datosFisicos?.genero === 'mujer' && (
            <Section title="3. Ciclo Menstrual" color="#ec4899" icon="flower">
              <View style={styles.gridApp}>
                <InfoItem label="Tipo" value={alumno.ciclo?.tipo} />
                <InfoItem label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
              </View>
            </Section>
          )}

          <Section title="4. Historial Salud" color="#ef4444" icon="heart-pulse">
            <InfoItem label="Enf. Propias" value={alumno.salud?.enfPers?.join(", ")} full />
            <InfoItem label="¿Lesión?" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'No'} full />
            <InfoItem label="¿Operación?" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'No'} full />
            <InfoItem label="FCR" value={alumno.salud?.frecuenciaCardiaca} />
          </Section>

          <Section title="5. Estilo de Vida (IPAQ)" color="#f59e0b" icon="walk">
            <View style={styles.gridApp}>
              <InfoItem label="Vigorosa" value={formatearActividad(alumno.ipaq?.vDias, alumno.ipaq?.vMin)} />
              <InfoItem label="Moderada" value={formatearActividad(alumno.ipaq?.mDias, alumno.ipaq?.mMin)} />
              <InfoItem label="Caminata" value={formatearActividad(alumno.ipaq?.cDias, alumno.ipaq?.cMin)} />
              <InfoItem label="Sentado" value={`${alumno.ipaq?.sentado}h`} />
              <InfoItem label="Sueño" value={`${alumno.ipaq?.horasSueno}h`} />
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
            <InfoItem label="Desea Comidas" value={alumno.nutricion?.comidasDes} />
            <InfoItem label="Días Entrenamiento" value={alumno.nutricion?.entrenos} />
            <InfoItem label="Dieta Detalle" value={alumno.nutricion?.descAct} full />
            <InfoItem label="Alcohol" value={alumno.nutricion?.alcohol} />
            <InfoItem label="Sustancias" value={alumno.nutricion?.sust} />
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="format-list-bulleted">
            <View style={styles.gridApp}>
              {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
                <View key={ali} style={styles.parqRow}><Text style={{fontSize:12}}>{ali}</Text><Text style={{fontSize:12, fontWeight:'bold'}}>{op}</Text></View>
              ))}
            </View>
          </Section>

          <Section title="9. Firma y Consentimiento" color="#1e293b" icon="file-sign">
             <Image source={{ uri: alumno.firma }} style={styles.firma} />
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