import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExpedienteProps {
  alumno: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: ExpedienteProps) {
  
  if (!alumno) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Cargando datos del cliente...</Text>
      </View>
    );
  }

  // Lógica de numeración dinámica
  let currentSection = 0;
  const getNumero = () => {
    currentSection++;
    return `${currentSection}. `;
  };

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
        {/* CONTENEDOR LIMITADOR PARA WEB (Evita que se vea alargado) */}
        <View style={styles.contentWrapper}>
          
          {/* BLOQUE: DATOS FÍSICOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}DATOS FÍSICOS</Text>
            <View style={styles.grid}>
              <Dato label="Edad" value={alumno.datosFisicos?.edad} />
              <Dato label="Peso" value={`${alumno.datosFisicos?.peso} KG`} />
              <Dato label="Altura" value={`${alumno.datosFisicos?.altura} CM`} />
              <Dato label="Género" value={alumno.datosFisicos?.genero} />
            </View>
          </View>

          {/* BLOQUE: MEDIDAS CORPORALES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}MEDIDAS CORPORALES</Text>
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

          {/* BLOQUE: HISTORIAL DE SALUD */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}HISTORIAL DE SALUD Y PAR-Q</Text>
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

          {/* BLOQUE CONDICIONAL: SALUD FEMENINA */}
          {esMujer && (
            <View style={[styles.section, { borderLeftWidth: 4, borderLeftColor: '#f472b6' }]}>
              <Text style={[styles.sectionTitle, { color: '#f472b6' }]}>{getNumero()}SALUD FEMENINA</Text>
              <Dato label="¿Ciclo Regular?" value={alumno.salud?.cicloRegular} />
              <Dato label="Uso Anticonceptivos" value={alumno.salud?.anticonceptivos} />
              <Dato label="Nota sobre ciclo" value={alumno.salud?.cicloNotas} />
            </View>
          )}

          {/* BLOQUE: ACTIVIDAD FÍSICA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}ACTIVIDAD FÍSICA (IPAQ)</Text>
            <View style={styles.grid}>
              <Dato label="Vigorosa" value={`${display(alumno.ipaq?.vDias)} D / ${display(alumno.ipaq?.vMin)} M`} />
              <Dato label="Moderada" value={`${display(alumno.ipaq?.mDias)} D / ${display(alumno.ipaq?.mMin)} M`} />
              <Dato label="Caminata" value={`${display(alumno.ipaq?.cDias)} D / ${display(alumno.ipaq?.cMin)} M`} />
              <Dato label="Tiempo Sentado" value={`${display(alumno.ipaq?.sentado)} HRS/DÍA`} />
              <Dato label="Horas de Sueño" value={`${display(alumno.ipaq?.horasSueno)} HRS`} />
            </View>
          </View>

          {/* BLOQUE: NUTRICIÓN Y HÁBITOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}NUTRICIÓN Y HÁBITOS</Text>
            <View style={styles.column}>
                <Dato label="Alcohol" value={`${display(alumno.nutricion?.alcohol)} - FREC: ${display(alumno.nutricion?.alcoholFreq)}`} fullWidth />
                <Dato label="Sustancias / Tabaco" value={`${display(alumno.nutricion?.sust)} - FREC: ${display(alumno.nutricion?.sustFreq)}`} fullWidth />
                <Dato label="Comidas Actuales" value={alumno.nutricion?.comidasAct} fullWidth />
                <Dato label="Entrenamientos/Sem" value={alumno.nutricion?.entrenos} fullWidth />
                <Dato label="Objetivo Principal" value={alumno.nutricion?.objetivo} fullWidth />
            </View>
          </View>

          {/* BLOQUE: CONSENTIMIENTO Y FIRMA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNumero()}CONSENTIMIENTO Y FIRMA</Text>
            <View style={styles.firmaBox}>
              {alumno.firma?.startsWith('data:image') ? (
                <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
              ) : (
                <Text style={styles.firmaNombre}>{alumno.firma || alumno.nombre}</Text>
              )}
              <Text style={styles.firmaSub}>Firma del Cliente: {alumno.nombre}</Text>
            </View>
          </View>

          {/* BOTONES */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
              <Text style={styles.btnText}>RECHAZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
              <Text style={styles.btnText}>ACEPTAR CLIENTE</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Dato = ({ label, value, fullWidth }: any) => (
  <View style={[styles.datoItem, fullWidth && { width: '100%' }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "NO"}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#e2e8f0', 
    alignItems: 'center',
    zIndex: 10
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  container: { flex: 1 },
  // ESTE WRAPPER ES LA CLAVE PARA LA WEB
  contentWrapper: {
    padding: 16,
    width: '100%',
    maxWidth: 600, // Evita que se estire en pantallas grandes
    alignSelf: 'center',
  },
  section: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20, 
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
        android: { elevation: 3 },
        web: { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
    })
  },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#3b82f6', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  column: { flexDirection: 'column' },
  datoItem: { width: '48%', marginBottom: 16 },
  label: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  subTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: '#475569' },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f8fafc' },
  parqText: { fontSize: 12, color: '#475569', flex: 0.8, lineHeight: 18 },
  parqValue: { fontSize: 12, fontWeight: 'bold' },
  firmaBox: { alignItems: 'center', padding: 20, backgroundColor: '#f8fafc', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },
  firmaImg: { width: '100%', height: 120 },
  firmaNombre: { fontSize: 32, fontStyle: 'italic', color: '#1e293b', fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif' },
  firmaSub: { fontSize: 10, color: '#94a3b8', marginTop: 10 },
  footerActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, height: 55, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});