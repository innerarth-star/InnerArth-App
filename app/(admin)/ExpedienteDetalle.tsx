import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  const InfoRow = ({ label, value, icon }: { label: string, value: any, icon?: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.val}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE: {alumno.nombre?.toUpperCase()}</Text>
        <TouchableOpacity onPress={() => {/* Lógica PDF */}}><Ionicons name="print" size={24} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* 1. DATOS PERSONALES */}
          <Section title="1. DATOS PERSONALES" color="#3b82f6">
            <InfoRow label="Nombre" value={alumno.nombre} />
            <InfoRow label="Teléfono" value={alumno.telefono} />
            <InfoRow label="Email" value={alumno.email} />
            <View style={styles.row}>
              <InfoRow label="Peso" value={`${alumno.datosFisicos?.peso} kg`} />
              <InfoRow label="Altura" value={`${alumno.datosFisicos?.altura} cm`} />
              <InfoRow label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
            </View>
            <InfoRow label="Género" value={alumno.datosFisicos?.genero?.toUpperCase()} />
          </Section>

          {/* 2. MEDIDAS CORPORALES */}
          <Section title="2. MEDIDAS CORPORALES (CM)" color="#10b981">
            <View style={styles.row}>
              <InfoRow label="Cuello" value={alumno.medidas?.cuello} />
              <InfoRow label="Pecho" value={alumno.medidas?.pecho} />
            </View>
            <View style={styles.row}>
              <InfoRow label="Brazo R" value={alumno.medidas?.brazoR} />
              <InfoRow label="Brazo F" value={alumno.medidas?.brazoF} />
            </View>
            <View style={styles.row}>
              <InfoRow label="Cintura" value={alumno.medidas?.cintura} />
              <InfoRow label="Cadera" value={alumno.medidas?.cadera} />
            </View>
            <View style={styles.row}>
              <InfoRow label="Muslo" value={alumno.medidas?.muslo} />
              <InfoRow label="Pierna" value={alumno.medidas?.pierna} />
            </View>
          </Section>

          {/* 3. CICLO MENSTRUAL (Sólo Mujeres) */}
          {alumno.datosFisicos?.genero === 'mujer' && (
            <Section title="3. CICLO MENSTRUAL" color="#ec4899">
              <InfoRow label="Tipo de Ciclo" value={alumno.ciclo?.tipo} />
              <InfoRow label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
            </Section>
          )}

          {/* 4. HISTORIAL SALUD */}
          <Section title="4. HISTORIAL SALUD" color="#ef4444">
            <InfoRow label="Enfermedades Familiares" value={alumno.salud?.enfFam?.join(", ")} />
            <InfoRow label="Enfermedades Propias" value={alumno.salud?.enfPers?.join(", ")} />
            <InfoRow label="¿Lesión?" value={alumno.salud?.lesion === 'si' ? `SÍ: ${alumno.salud?.detalleLesion}` : 'NO'} />
            <InfoRow label="¿Operación?" value={alumno.salud?.operacion === 'si' ? `SÍ: ${alumno.salud?.detalleOperacion}` : 'NO'} />
            <InfoRow label="Frecuencia Cardíaca (FCR)" value={`${alumno.salud?.frecuenciaCardiaca} lpm`} />
          </Section>

          {/* 5. ESTILO VIDA (IPAQ) */}
          <Section title="5. ESTILO VIDA (IPAQ)" color="#f59e0b">
            <InfoRow label="Act. Vigorosa" value={`${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min`} />
            <InfoRow label="Act. Moderada" value={`${alumno.ipaq?.mDias} días / ${alumno.ipaq?.mMin} min`} />
            <InfoRow label="Caminata" value={`${alumno.ipaq?.cDias} días / ${alumno.ipaq?.cMin} min`} />
            <InfoRow label="Sentado al día" value={`${alumno.ipaq?.sentado} horas`} />
            <InfoRow label="Horas de Sueño" value={`${alumno.ipaq?.horasSueno} horas`} />
          </Section>

          {/* 6. PAR-Q */}
          <Section title="6. CUESTIONARIO PAR-Q" color="#0ea5e9">
            {Object.entries(alumno.salud?.parq || {}).map(([key, val]: any) => (
              <View key={key} style={styles.parqRow}>
                <Text style={styles.parqText}>{key.toUpperCase()}:</Text>
                <Text style={[styles.parqVal, val === 'si' && {color: '#ef4444'}]}>{val?.toUpperCase()}</Text>
              </View>
            ))}
          </Section>

          {/* 7. NUTRICIÓN Y HÁBITOS */}
          <Section title="7. NUTRICIÓN Y HÁBITOS" color="#8b5cf6">
            <InfoRow label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
            <Text style={styles.labelSub}>Descripción de dieta diaria:</Text>
            <Text style={styles.boxTxt}>{alumno.nutricion?.descAct}</Text>
            <InfoRow label="¿Alcohol?" value={alumno.nutricion?.alcohol === 'si' ? `SÍ (${alumno.nutricion?.alcoholFreq})` : 'NO'} />
            <InfoRow label="¿Sustancias / Fuma?" value={alumno.nutricion?.sust === 'si' ? `SÍ (${alumno.nutricion?.sustFreq})` : 'NO'} />
            <InfoRow label="Comidas deseadas" value={alumno.nutricion?.comidasDes} />
            <InfoRow label="Días Entrenamiento" value={alumno.nutricion?.entrenos} />
            <InfoRow label="Objetivo" value={alumno.nutricion?.objetivo} />
          </Section>

          {/* 8. FRECUENCIA ALIMENTOS */}
          <Section title="8. FRECUENCIA DE ALIMENTOS" color="#10b981">
            {Object.entries(alumno.frecuenciaAlimentos || {}).map(([ali, op]: any) => (
              <View key={ali} style={styles.aliRow}>
                <Text style={styles.aliText}>{ali}:</Text>
                <Text style={styles.aliVal}>{op}</Text>
              </View>
            ))}
          </Section>

          {/* 9. CONSENTIMIENTO Y FIRMA */}
          <Section title="9. CONSENTIMIENTO Y FIRMA" color="#1e293b">
            <Text style={styles.miniTxt}>Firma del cliente:</Text>
            {alumno.firma?.startsWith('data:image') ? (
              <Image source={{ uri: alumno.firma }} style={styles.firmaImg} />
            ) : (
              <Text style={styles.firmaNombre}>{alumno.firma}</Text>
            )}
          </Section>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* FOOTER ACCIONES */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
          <Text style={styles.btnTxtW}>RECHAZAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
          <Text style={styles.btnTxtW}>ACEPTAR Y CREAR PLAN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Section = ({ title, color, children }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  container: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  infoRow: { marginBottom: 10, flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' },
  val: { fontSize: 14, color: '#334155', marginTop: 2, fontWeight: '500' },
  labelSub: { fontSize: 10, color: '#94a3b8', marginTop: 5, fontWeight: 'bold' },
  boxTxt: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginTop: 5, fontSize: 13, color: '#475569', fontStyle: 'italic' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 2 },
  parqText: { fontSize: 11, color: '#64748b' },
  parqVal: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
  aliRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  aliText: { fontSize: 12, color: '#334155' },
  aliVal: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6' },
  miniTxt: { fontSize: 10, color: '#94a3b8', marginBottom: 5 },
  firmaImg: { width: '100%', height: 120, resizeMode: 'contain', backgroundColor: '#f8fafc', borderRadius: 10 },
  firmaNombre: { fontSize: 20, fontStyle: 'italic', textAlign: 'center', marginTop: 10, color: '#1e293b' },
  footer: { position: 'absolute', bottom: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%' },
  btn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxtW: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});