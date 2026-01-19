import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  // Función para generar PDF con los 10 bloques reales
  const generarPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #1e293b; }
            h1 { color: #3b82f6; text-align: center; }
            .section { margin-bottom: 15px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
            .section-title { font-weight: bold; color: #3b82f6; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #3b82f6; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .label { font-weight: bold; color: #64748b; font-size: 11px; }
            .value { font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Expediente: ${alumno.nombre}</h1>
          <div class="section">
            <div class="section-title">1. DATOS PERSONALES</div>
            <div class="row"><span class="label">Edad:</span><span>${alumno.datosFisicos?.edad} años</span></div>
            <div class="row"><span class="label">Peso/Altura:</span><span>${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm</span></div>
            <div class="row"><span class="label">Género:</span><span>${alumno.datosFisicos?.genero}</span></div>
          </div>
          <p style="margin-top:20px">Firma digital registrada: ${alumno.firma ? 'SÍ' : 'NO'}</p>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo crear el PDF"); }
  };

  const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
        <TouchableOpacity onPress={generarPDF}><Ionicons name="document-text" size={24} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          
          {/* BLOQUE 1: DATOS PERSONALES */}
          <Section title="1. DATOS PERSONALES" icon="person">
            <InfoRow label="Nombre" value={alumno.nombre} />
            <InfoRow label="Teléfono" value={alumno.telefono} />
            <InfoRow label="Email" value={alumno.email} />
            <View style={styles.row}>
                <InfoRow label="Peso" value={`${alumno.datosFisicos?.peso} kg`} />
                <InfoRow label="Altura" value={`${alumno.datosFisicos?.altura} cm`} />
            </View>
          </Section>

          {/* BLOQUE 2: MEDIDAS CORPORALES */}
          <Section title="2. MEDIDAS (CM)" icon="ruler">
            <View style={styles.row}>
                <InfoRow label="Cuello" value={alumno.medidas?.cuello} />
                <InfoRow label="Pecho" value={alumno.medidas?.pecho} />
                <InfoRow label="Cintura" value={alumno.medidas?.cintura} />
            </View>
            <View style={styles.row}>
                <InfoRow label="Cadera" value={alumno.medidas?.cadera} />
                <InfoRow label="Muslo" value={alumno.medidas?.muslo} />
                <InfoRow label="Brazo R/F" value={`${alumno.medidas?.brazoR} / ${alumno.medidas?.brazoF}`} />
            </View>
          </Section>

          {/* BLOQUE 3: CICLO MENSTRUAL (Solo si es mujer) */}
          {alumno.datosFisicos?.genero === 'mujer' && (
            <Section title="3. CICLO MENSTRUAL" icon="female">
                <InfoRow label="Tipo de Ciclo" value={alumno.ciclo?.tipo} />
                <InfoRow label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
            </Section>
          )}

          {/* BLOQUE 4: SALUD */}
          <Section title="4. HISTORIAL SALUD" icon="heart" color="#ef4444">
            <InfoRow label="Enf. Familiares" value={alumno.salud?.enfFam?.join(", ")} />
            <InfoRow label="Enf. Propias" value={alumno.salud?.enfPers?.join(", ")} />
            <InfoRow label="Lesiones" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'Ninguna'} />
            <InfoRow label="Operaciones" value={alumno.salud?.operacion === 'si' ? alumno.salud?.detalleOperacion : 'Ninguna'} />
          </Section>

          {/* BLOQUE 5: IPAQ (Actividad Física) */}
          <Section title="5. ESTILO VIDA (IPAQ)" icon="walk">
            <InfoRow label="Act. Vigorosa" value={`${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min`} />
            <InfoRow label="Act. Moderada" value={`${alumno.ipaq?.mDias} días / ${alumno.ipaq?.mMin} min`} />
            <InfoRow label="Caminata" value={`${alumno.ipaq?.cDias} días / ${alumno.ipaq?.cMin} min`} />
            <InfoRow label="Horas Sentado / Sueño" value={`${alumno.ipaq?.sentado}h / ${alumno.ipaq?.horasSueno}h`} />
          </Section>

          {/* BLOQUE 6: PAR-Q (Riesgos) */}
          <Section title="6. RIESGOS (PAR-Q)" icon="warning" color="#f59e0b">
             <Text style={styles.valMini}>Respuestas SÍ: {Object.values(alumno.salud?.parq || {}).filter(v => v === 'si').length}</Text>
             <Text style={styles.labelMini}>*Revisar respuestas de riesgo en la base si hay más de un SÍ.</Text>
          </Section>

          {/* BLOQUE 7: NUTRICIÓN */}
          <Section title="7. NUTRICIÓN" icon="restaurant">
            <InfoRow label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
            <InfoRow label="Descripción Dieta" value={alumno.nutricion?.descAct} />
            <InfoRow label="Alcohol / Sustancias" value={`${alumno.nutricion?.alcohol} (${alumno.nutricion?.alcoholFreq}) / ${alumno.nutricion?.sust}`} />
          </Section>

          {/* BLOQUE 8: FRECUENCIA ALIMENTOS */}
          <Section title="8. FRECUENCIA ALIMENTOS" icon="list">
             {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, freq]: any) => (
                 <Text key={ali} style={styles.valMini}>• {ali}: <Text style={{fontWeight:'bold'}}>{freq}</Text></Text>
             ))}
          </Section>

          {/* BLOQUE 9: OBJETIVOS */}
          <Section title="9. OBJETIVOS" icon="trending-up">
            <InfoRow label="Metas Deseadas" value={alumno.nutricion?.objetivo} />
            <InfoRow label="Entrenos sugeridos" value={`${alumno.nutricion?.entrenos} días`} />
          </Section>

          {/* BLOQUE 10: LEGAL Y FIRMA */}
          <Section title="10. CONSENTIMIENTO" icon="document-attach">
            <InfoRow label="Firma / Nombre" value={alumno.firma} />
            {alumno.firma?.includes('data:image') && <Image source={{uri: alumno.firma}} style={{height: 100, width: '100%', resizeMode: 'contain'}} />}
          </Section>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}><Text style={styles.btnTxt}>RECHAZAR</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}><Text style={styles.btnTxt}>ACEPTAR Y CREAR PLAN</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Section = ({ title, icon, children, color = "#3b82f6" }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sectionTitle, {color}]}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 13, fontWeight: 'bold' },
  container: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, elevation: 1 },
  infoRow: { marginBottom: 8, flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' },
  val: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  valMini: { fontSize: 11, color: '#475569', marginBottom: 2 },
  labelMini: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic' },
  footer: { flexDirection: 'row', gap: 10, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  btn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold' }
});