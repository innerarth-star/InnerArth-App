import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExpedienteProps {
  alumno: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: ExpedienteProps) {
  
  // VALIDACIÓN VITAL: Si no hay alumno, no intentes renderizar el resto
  if (!alumno) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Cargando datos del cliente...</Text>
      </View>
    );
  }

  const display = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'no' || val === 0) return "NO";
    return String(val).toUpperCase();
  };

  const esMujer = alumno.datosFisicos?.genero?.toLowerCase() === 'mujer';

  return (
    <SafeAreaView style={styles.safe}>
      {/* CABECERA */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Cuestionario de Inicio</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* BLOQUE 1: DATOS FÍSICOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DATOS FÍSICOS</Text>
          <View style={styles.grid}>
            <Dato label="Edad" value={alumno.datosFisicos?.edad} />
            <Dato label="Peso" value={`${alumno.datosFisicos?.peso} KG`} />
            <Dato label="Altura" value={`${alumno.datosFisicos?.altura} CM`} />
            <Dato label="Género" value={alumno.datosFisicos?.genero} />
          </View>
        </View>

        {/* BLOQUE 2: MEDIDAS CORPORALES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. MEDIDAS CORPORALES</Text>
          <View style={styles.grid}>
            <Dato label="Cuello" value={alumno.medidas?.cuello} />
            <Dato label="Pecho" value={alumno.medidas?.pecho} />
            <Dato label="Cintura" value={alumno.medidas?.cintura} />
            <Dato label="Cadera" value={alumno.medidas?.cadera} />
            <Dato label="Brazo R." value={alumno.medidas?.brazoR} />
            <Dato label="Brazo F." value={alumno.medidas?.brazoF} />
            <Dato label="Muslo" value={alumno.medidas?.muslo} />
            <Dato label="Pierna" value={alumno.medidas?.pierna} />
          </View>
        </View>

        {/* BLOQUE 3: HISTORIAL DE SALUD Y PAR-Q */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. HISTORIAL DE SALUD Y PAR-Q</Text>
          <Dato label="Frecuencia Cardíaca Reposo (FCR)" value={`${alumno.salud?.frecuenciaCardiaca} LPM`} />
          <View style={styles.separator} />
          <Text style={styles.subTitle}>Cuestionario PAR-Q:</Text>
          {alumno.salud?.parq && Object.entries(alumno.salud.parq).map(([key, value]: any) => (
            <View key={key} style={styles.parqRow}>
              <Text style={styles.parqText}>{key}</Text>
              <Text style={[styles.parqValue, { color: value === 'si' ? '#ef4444' : '#10b981' }]}>
                {value === 'si' ? 'SÍ' : 'NO'}
              </Text>
            </View>
          ))}
        </View>

        {/* BLOQUE EXTRA: SALUD FEMENINA (CICLO MENSTRUAL) */}
        {esMujer && (
          <View style={[styles.section, { borderLeftWidth: 4, borderLeftColor: '#f472b6' }]}>
            <Text style={[styles.sectionTitle, { color: '#f472b6' }]}>BLOQUE: SALUD FEMENINA</Text>
            <Dato label="¿Ciclo Regular?" value={alumno.salud?.cicloRegular} />
            <Dato label="Uso Anticonceptivos" value={alumno.salud?.anticonceptivos} />
            <Dato label="Nota sobre ciclo" value={alumno.salud?.cicloNotas} />
          </View>
        )}

        {/* BLOQUE 4: ACTIVIDAD FÍSICA (IPAQ) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ACTIVIDAD FÍSICA (IPAQ)</Text>
          <View style={styles.grid}>
            <Dato label="Vigorosa" value={`${display(alumno.ipaq?.vDias)} D / ${display(alumno.ipaq?.vMin)} M`} />
            <Dato label="Moderada" value={`${display(alumno.ipaq?.mDias)} D / ${display(alumno.ipaq?.mMin)} M`} />
            <Dato label="Caminata" value={`${display(alumno.ipaq?.cDias)} D / ${display(alumno.ipaq?.cMin)} M`} />
            <Dato label="Tiempo Sentado" value={`${display(alumno.ipaq?.sentado)} HRS/DÍA`} />
            <Dato label="Horas de Sueño" value={`${display(alumno.ipaq?.horasSueno)} HRS`} />
          </View>
        </View>

        {/* BLOQUE 5: NUTRICIÓN Y HÁBITOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. NUTRICIÓN Y HÁBITOS</Text>
          <Dato label="Alcohol" value={`${display(alumno.nutricion?.alcohol)} - FREC: ${display(alumno.nutricion?.alcoholFreq)}`} />
          <Dato label="Sustancias / Tabaco" value={`${display(alumno.nutricion?.sust)} - FREC: ${display(alumno.nutricion?.sustFreq)}`} />
          <Dato label="Comidas Actuales" value={alumno.nutricion?.comidasAct} />
          <Dato label="Entrenamientos/Sem" value={alumno.nutricion?.entrenos} />
          <Dato label="Objetivo Principal" value={alumno.nutricion?.objetivo} />
        </View>

        {/* BLOQUE 6: CONSENTIMIENTO Y FIRMA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. CONSENTIMIENTO Y FIRMA</Text>
          <View style={styles.firmaBox}>
            {alumno.firma?.startsWith('data:image') ? (
              <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
            ) : (
              <Text style={styles.firmaNombre}>{alumno.firma || alumno.nombre}</Text>
            )}
            <Text style={styles.firmaSub}>Firma del Cliente: {alumno.nombre}</Text>
          </View>
        </View>

        {/* BOTONES DE DECISIÓN FINAL */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
            <Text style={styles.btnText}>RECHAZAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
            <Text style={styles.btnText}>ACEPTAR CLIENTE</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar interno
const Dato = ({ label, value }: any) => (
  <View style={styles.datoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "NO"}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  container: { padding: 16 },
  section: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#3b82f6', marginBottom: 12, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  datoItem: { width: '48%', marginBottom: 12 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  subTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#f1f5f9' },
  parqText: { fontSize: 11, color: '#475569', flex: 0.8 },
  parqValue: { fontSize: 11, fontWeight: 'bold' },
  firmaBox: { alignItems: 'center', padding: 20, backgroundColor: '#f8fafc', borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  firmaImg: { width: '100%', height: 100 },
  firmaNombre: { fontSize: 26, fontStyle: 'italic', color: '#1e293b' },
  firmaSub: { fontSize: 9, color: '#94a3b8', marginTop: 10 },
  footerActions: { flexDirection: 'row', gap: 12, marginTop: 10, paddingBottom: 20 },
  btn: { flex: 1, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});