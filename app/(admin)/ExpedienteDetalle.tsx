import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface ExpedienteProps {
  alumno: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: ExpedienteProps) {
  
  // Función para normalizar las respuestas vacías o negativas
  const display = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'no' || val === 0) return "NO";
    return String(val).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER FIJO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Revisión de Cuestionario</Text>
          <Text style={styles.headerSub}>{alumno.nombre}</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* BLOQUE 1: DATOS PERSONALES Y FÍSICOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DATOS PERSONALES Y FÍSICOS</Text>
          <View style={styles.grid}>
            <Dato label="Edad" value={alumno.datosFisicos?.edad} />
            <Dato label="Género" value={alumno.datosFisicos?.genero} />
            <Dato label="Peso Actual" value={`${alumno.datosFisicos?.peso} KG`} />
            <Dato label="Altura" value={`${alumno.datosFisicos?.altura} CM`} />
          </View>
        </View>

        {/* BLOQUE 2: COMPOSICIÓN CORPORAL (MEDIDAS) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. MEDIDAS CORPORALES (CM)</Text>
          <View style={styles.grid}>
            <Dato label="Cuello" value={alumno.medidas?.cuello} />
            <Dato label="Pecho" value={alumno.medidas?.pecho} />
            <Dato label="Cintura" value={alumno.medidas?.cintura} />
            <Dato label="Cadera" value={alumno.medidas?.cadera} />
            <Dato label="Brazo Relajado" value={alumno.medidas?.brazoR} />
            <Dato label="Brazo Flexionado" value={alumno.medidas?.brazoF} />
          </View>
        </View>

        {/* BLOQUE 3: SALUD Y PAR-Q */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ESTADO DE SALUD Y RIESGO (PAR-Q)</Text>
          <View style={styles.cardInfo}>
            <Dato label="Frecuencia Cardíaca Reposo (FCR)" value={`${alumno.salud?.frecuenciaCardiaca} LPM`} />
            <View style={styles.separator} />
            <Text style={styles.subTitle}>Respuestas PAR-Q:</Text>
            {alumno.salud?.parq && Object.entries(alumno.salud.parq).map(([key, value]: any) => (
              <View key={key} style={styles.parqRow}>
                <Text style={styles.parqText}>{key}</Text>
                <Text style={[styles.parqValue, { color: value === 'si' ? '#ef4444' : '#10b981' }]}>
                  {value === 'si' ? 'SÍ' : 'NO'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* BLOQUE 4: ACTIVIDAD FÍSICA (IPAQ) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. NIVEL DE ACTIVIDAD (IPAQ)</Text>
          <View style={styles.cardInfo}>
            <Dato label="Actividad Vigorosa" value={`${display(alumno.ipaq?.vDias)} DÍAS / ${display(alumno.ipaq?.vMin)} MIN`} />
            <Dato label="Actividad Moderada" value={`${display(alumno.ipaq?.mDias)} DÍAS / ${display(alumno.ipaq?.mMin)} MIN`} />
            <Dato label="Caminata" value={`${display(alumno.ipaq?.cDias)} DÍAS / ${display(alumno.ipaq?.cMin)} MIN`} />
            <Dato label="Tiempo Sentado" value={`${display(alumno.ipaq?.sentado)} HORAS/DÍA`} />
          </View>
        </View>

        {/* BLOQUE 5: NUTRICIÓN Y HÁBITOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. NUTRICIÓN Y HÁBITOS SOCIALES</Text>
          <View style={styles.cardInfo}>
            <Dato label="Consumo de Alcohol" value={`${display(alumno.nutricion?.alcohol)} - FRECUENCIA: ${display(alumno.nutricion?.alcoholFreq)}`} />
            <Dato label="Sustancias / Tabaco" value={`${display(alumno.nutricion?.sust)} - FRECUENCIA: ${display(alumno.nutricion?.sustFreq)}`} />
            <Dato label="Comidas al día actuales" value={alumno.nutricion?.comidasAct} />
            <Dato label="Días de entrenamiento previstos" value={alumno.nutricion?.entrenos} />
            <Dato label="Objetivo Principal" value={alumno.nutricion?.objetivo} />
          </View>
        </View>

        {/* BLOQUE 6: FIRMA Y CONSENTIMIENTO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. FIRMA DE CONFORMIDAD</Text>
          <View style={styles.firmaContainer}>
            {alumno.firma?.startsWith('data:image') ? (
              <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
            ) : (
              <Text style={styles.firmaTexto}>{alumno.firma}</Text>
            )}
            <Text style={styles.firmaLabel}>Firma Digital del Alumno</Text>
          </View>
        </View>

        {/* BOTONES DE ACCIÓN FINAL */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnReject]} 
            onPress={() => Alert.alert("Confirmar", "¿Rechazar y borrar esta solicitud?", [
              { text: "No" }, { text: "Sí, Rechazar", onPress: onReject }
            ])}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.btnText}>RECHAZAR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnAccept]} 
            onPress={onAccept}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.btnText}>APROBAR CLIENTE</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente pequeño para mostrar etiquetas y valores
const Dato = ({ label, value }: { label: string, value: any }) => (
  <View style={styles.datoContainer}>
    <Text style={styles.datoLabel}>{label}</Text>
    <Text style={styles.datoValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  backBtn: { padding: 4 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 15, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  datoContainer: { width: '48%', marginBottom: 15 },
  datoLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  datoValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardInfo: { width: '100%' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  subTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  parqText: { fontSize: 12, color: '#475569', flex: 0.8 },
  parqValue: { fontSize: 12, fontWeight: 'bold' },
  firmaContainer: { alignItems: 'center', padding: 10 },
  firmaImg: { width: '100%', height: 100, backgroundColor: '#f8fafc' },
  firmaTexto: { fontSize: 24, fontStyle: 'italic', color: '#1e293b', marginVertical: 20 },
  firmaLabel: { fontSize: 10, color: '#94a3b8', marginTop: 10 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  actionBtn: { flex: 1, height: 55, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});