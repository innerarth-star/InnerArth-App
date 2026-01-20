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

const consentimientoCompleto = `Por medio de la presente, el alumno declara que la información proporcionada es verídica y acepta los términos y condiciones del programa de entrenamiento FitTech. El alumno reconoce que la práctica de actividad física conlleva riesgos y libera de responsabilidad a los entrenadores por lesiones derivadas de la omisión de información de salud preexistente.`;

const PREGUNTAS_TEXTO: any = {
  p1: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco?",
  p2: "¿Siente dolor en el pecho cuando realiza actividad física?",
  p3: "¿En el último mes, ha sentido dolor en el pecho sin actividad física?",
  p4: "¿Pierde el equilibrio debido a mareos o pérdida de conocimiento?",
  p5: "¿Tiene algún problema óseo o articular que podría empeorar?",
  p6: "¿Le receta actualmente medicamentos para la presión o corazón?",
  p7: "¿Sabe de alguna otra razón por la cual no debería hacer ejercicio?"
};

// --- COMPONENTES DE INTERFAZ APP ---
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

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 25mm 20mm 20mm 20mm; }
          body { font-family: 'Helvetica', sans-serif; color: #334155; line-height: 1.3; margin: 0; padding: 0; }
          .block-container { page-break-inside: avoid; margin-bottom: 20px; width: 100%; display: block; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
          h1 { color: #1e3a8a; font-size: 22px; margin: 0; text-transform: uppercase; }
          p.subtitle { font-size: 12px; color: #64748b; margin-top: 5px; }
          .section-title { background: #3b82f6; color: white; padding: 6px 18px; border-radius: 25px; font-size: 11px; font-weight: bold; width: fit-content; text-transform: uppercase; margin-bottom: 8px; }
          .grid { display: flex; flex-wrap: wrap; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
          .item { width: 50%; padding: 10px; border: 0.5px solid #f1f5f9; box-sizing: border-box; }
          .full-width { width: 100%; }
          .label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .value { font-size: 11px; color: #0f172a; font-weight: 600; }
          .legal-text { font-size: 8.5px; line-height: 1.5; text-align: justify; color: #475569; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
          .signature-box { margin-top: 30px; text-align: center; page-break-inside: avoid; }
          .signature-img { width: 150px; height: auto; margin: 0 auto; display: block; border-bottom: 2px solid #1e293b; }
          .signature-label { font-size: 10px; font-weight: bold; margin-top: 10px; color: #1e293b; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EXPEDIENTE TÉCNICO FITTECH</h1>
          <p class="subtitle"><b>Alumno:</b> ${procesarTexto(a.nombre)} | <b>Fecha:</b> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="block-container">
          <div class="section-title">1. Datos e Identificación</div>
          <div class="grid">
            <div class="item"><span class="label">Teléfono</span><span class="value">${procesarTexto(a.telefono)}</span></div>
            <div class="item"><span class="label">Género</span><span class="value">${procesarTexto(a.datosFisicos?.genero)}</span></div>
            <div class="item"><span class="label">Peso</span><span class="value">${procesarTexto(a.datosFisicos?.peso)} kg</span></div>
            <div class="item"><span class="label">Estatura</span><span class="value">${procesarTexto(a.datosFisicos?.altura)} cm</span></div>
            <div class="item full-width"><span class="label">Email</span><span class="value">${a.email}</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">2. Medidas Corporales</div>
          <div class="grid">
            <div class="item"><span class="label">Cuello / Pecho</span><span class="value">${procesarTexto(a.medidas?.cuello)} / ${procesarTexto(a.medidas?.pecho)}</span></div>
            <div class="item"><span class="label">Brazo R / F</span><span class="value">${procesarTexto(a.medidas?.brazoR)} / ${procesarTexto(a.medidas?.brazoF)}</span></div>
            <div class="item"><span class="label">Cintura / Cadera</span><span class="value">${procesarTexto(a.medidas?.cintura)} / ${procesarTexto(a.medidas?.cadera)}</span></div>
            <div class="item"><span class="label">Muslo / Pierna</span><span class="value">${procesarTexto(a.medidas?.muslo)} / ${procesarTexto(a.medidas?.pierna)}</span></div>
          </div>
        </div>

        ${a.datosFisicos?.genero === 'mujer' ? `
        <div class="block-container">
          <div class="section-title">3. Ciclo Menstrual</div>
          <div class="grid">
            <div class="item"><span class="label">Estado del Ciclo</span><span class="value">${procesarTexto(a.ciclo?.tipo)}</span></div>
            <div class="item"><span class="label">Método Anticonceptivo</span><span class="value">${procesarTexto(a.ciclo?.anticonceptivo)}</span></div>
          </div>
        </div>
        ` : ''}

        <div class="block-container">
          <div class="section-title">4. Historial de Salud</div>
          <div class="grid">
            <div class="item full-width"><span class="label">Enf. Familiares</span><span class="value">${procesarTexto(a.salud?.enfFam)}</span></div>
            <div class="item full-width"><span class="label">Enf. Personales</span><span class="value">${procesarTexto(a.salud?.enfPers)}</span></div>
            <div class="item"><span class="label">Lesiones</span><span class="value">${procesarTexto(a.salud?.detalleLesion)}</span></div>
            <div class="item"><span class="label">Cirugías</span><span class="value">${procesarTexto(a.salud?.detalleOperacion)}</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">5. Estilo de Vida e IPAQ</div>
          <div class="grid">
            <div class="item"><span class="label">Vigorosa</span><span class="value">${formatearActividad(a.ipaq?.vDias, a.ipaq?.vMin)}</span></div>
            <div class="item"><span class="label">Moderada</span><span class="value">${formatearActividad(a.ipaq?.mDias, a.ipaq?.mMin)}</span></div>
            <div class="item"><span class="label">Caminata</span><span class="value">${formatearActividad(a.ipaq?.cDias, a.ipaq?.cMin)}</span></div>
            <div class="item"><span class="label">Sentado / Sueño</span><span class="value">${procesarTexto(a.ipaq?.sentado)} hrs / ${a.ipaq?.horasSueno} hrs</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">6. Cuestionario de Riesgo PAR-Q</div>
          <div class="grid">
            ${Object.keys(PREGUNTAS_TEXTO).map(key => `
              <div class="item full-width" style="border-bottom:0.5px solid #f1f5f9;">
                <span class="label" style="font-size:7px;">${PREGUNTAS_TEXTO[key]}</span>
                <span class="value" style="color:${a.salud?.parq?.[key] === 'si' ? '#ef4444' : '#10b981'}">${procesarTexto(a.salud?.parq?.[key])}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="page-break"></div>

        <div class="block-container">
          <div class="section-title">7. Nutrición y Planificación</div>
          <div class="grid">
            <div class="item full-width"><span class="label">Comidas Actuales</span><span class="value">${procesarTexto(a.nutricion?.comidasAct)} (${procesarTexto(a.nutricion?.descAct)})</span></div>
            <div class="item"><span class="label">Alcohol / Fuma</span><span class="value">${procesarTexto(a.nutricion?.alcohol)} / ${procesarTexto(a.nutricion?.sust)}</span></div>
            <div class="item"><span class="label">Días Entreno / Comidas Plan</span><span class="value">${procesarTexto(a.nutricion?.entrenos)} / ${procesarTexto(a.nutricion?.comidasDes)}</span></div>
            <div class="item full-width" style="background:#f0f9ff;"><span class="label">Objetivo</span><span class="value" style="color:#2563eb">${procesarTexto(a.nutricion?.objetivo)}</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">8. Frecuencia Alimentaria</div>
          <div class="grid">
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `
              <div class="item"><span class="label">${k}</span><span class="value">${procesarTexto(v)}</span></div>
            `).join('')}
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">9. Consentimiento Informado Legal</div>
          <div class="legal-text">
            ${consentimientoCompleto.replace(/\n\n/g, '<br/><br/>')}
          </div>
        </div>

        <div class="signature-box">
          <img src="${a.firma}" class="signature-img" />
          <div class="signature-label">Firma del Alumno: ${procesarTexto(a.nombre)}</div>
          <div style="font-size:8px; color:#94a3b8;">ID Autenticación: ${a.id || a.uid}</div>
        </div>
      </body>
      </html>
    `;
    try {
      // USAMOS printToFileAsync PARA QUE GENERE EL ARCHIVO COMPLETO
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerApp}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE DEL ALUMNO</Text>
          <TouchableOpacity onPress={() => exportarPDF(alumno)}>
            <Ionicons name="cloud-download-outline" size={26} color="#3b82f6" />
          </TouchableOpacity>
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
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
            <InfoItem label="Días Entreno" value={alumno.nutricion?.entrenos} />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="format-list-bulleted">
             <View style={styles.gridApp}>
               {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
                 <View key={ali} style={styles.parqRow}><Text>{ali}</Text><Text style={{fontWeight:'bold'}}>{op}</Text></View>
               ))}
             </View>
          </Section>

          <Section title="9. Firma" color="#1e293b" icon="file-sign">
             <Image source={{ uri: alumno.firma }} style={styles.firmaApp} />
          </Section>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.footerApp}>
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
  headerApp: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
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
  firmaApp: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#f1f5f9', borderRadius: 15 },
  footerApp: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});