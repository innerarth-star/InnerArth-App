import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  const InfoItem = ({ label, value, full }: any) => (
    <View style={[styles.infoItem, full ? { width: '100%' } : { width: '48%' }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER FIJO */}
      <View style={styles.header}>
        <View style={styles.webContainerRow}>
          <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={26} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
          <TouchableOpacity><Ionicons name="print-outline" size={24} color="#3b82f6" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.webWrapper}>
          
          <Section title="1. Datos Personales" color="#3b82f6" icon="person">
            <View style={styles.grid}>
              <InfoItem label="Nombre" value={alumno.nombre} full />
              <InfoItem label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
              <InfoItem label="Género" value={alumno.datosFisicos?.genero} />
              <InfoItem label="Peso" value={`${alumno.datosFisicos?.peso} kg`} />
              <InfoItem label="Altura" value={`${alumno.datosFisicos?.altura} cm`} />
            </View>
          </Section>

          <Section title="2. Medidas (cm)" color="#10b981" icon="ruler">
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
            <Section title="3. Ciclo Menstrual" color="#ec4899" icon="female">
              <View style={styles.grid}>
                <InfoItem label="Tipo" value={alumno.ciclo?.tipo} />
                <InfoItem label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
              </View>
            </Section>
          )}

          <Section title="4. Historial Salud" color="#ef4444" icon="heart">
            <InfoItem label="Enfermedades Familiares" value={alumno.salud?.enfFam?.join(", ")} full />
            <InfoItem label="Enfermedades Propias" value={alumno.salud?.enfPers?.join(", ")} full />
            <InfoItem label="Lesión" value={alumno.salud?.lesion === 'si' ? alumno.salud?.detalleLesion : 'Ninguna'} full />
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

          <Section title="6. PAR-Q" color="#0ea5e9" icon="medical">
            <Text style={styles.valMini}>Respuestas afirmativas (SÍ): {Object.values(alumno.salud?.parq || {}).filter(v => v === 'si').length}</Text>
          </Section>

          <Section title="7. Nutrición y Hábitos" color="#8b5cf6" icon="restaurant">
            <InfoItem label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
            <InfoItem label="Descripción Dieta" value={alumno.nutricion?.descAct} full />
            <InfoItem label="Alcohol/Sustancias" value={`${alumno.nutricion?.alcohol} / ${alumno.nutricion?.sust}`} full />
            <InfoItem label="Objetivo" value={alumno.nutricion?.objetivo} full />
          </Section>

          <Section title="8. Frecuencia Alimentos" color="#10b981" icon="list">
             <View style={styles.grid}>
               {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
                 <InfoItem key={ali} label={ali} value={op} />
               ))}
             </View>
          </Section>

          <Section title="9. Firma y Consentimiento" color="#1e293b" icon="document-text">
            {alumno.firma?.startsWith('data:image') ? (
              <Image source={{ uri: alumno.firma }} style={styles.firma} />
            ) : (
              <Text style={styles.firmaNombre}>{alumno.firma}</Text>
            )}
          </Section>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* FOOTER ACCIONES */}
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
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  webContainerRow: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 18, alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  container: { flex: 1 },
  webWrapper: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 5 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155', fontWeight: '500' },
  valMini: { fontSize: 12, color: '#64748b' },
  firma: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#f1f5f9', borderRadius: 15, marginTop: 10 },
  firmaNombre: { fontSize: 24, fontStyle: 'italic', textAlign: 'center', marginTop: 15, color: '#1e293b' },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  webFooterContent: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});