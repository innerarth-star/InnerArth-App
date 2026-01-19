import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{value || 'No especificado'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
        <TouchableOpacity onPress={() => console.log("Generar PDF")}><Ionicons name="print-outline" size={24} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* BLOQUE 1: DATOS PERSONALES */}
          <Section title="1. DATOS PERSONALES" icon="person-outline">
            <InfoRow label="Nombre Completo" value={alumno.nombre} />
            <InfoRow label="Edad" value={alumno.edad} />
            <InfoRow label="Email" value={alumno.email} />
          </Section>

          {/* BLOQUE 2: COMPOSICIÓN FÍSICA */}
          <Section title="2. COMPOSICIÓN FÍSICA" icon="body-outline">
            <View style={styles.row}>
              <View style={{ flex: 1 }}><InfoRow label="Peso Actual" value={`${alumno.peso || '--'} kg`} /></View>
              <View style={{ flex: 1 }}><InfoRow label="Estatura" value={`${alumno.estatura || '--'} cm`} /></View>
            </View>
            <InfoRow label="Porcentaje de Grasa (est.)" value={alumno.porcentajeGrasa} />
          </Section>

          {/* BLOQUE 3: OBJETIVOS */}
          <Section title="3. OBJETIVOS" icon="trophy-outline">
            <InfoRow label="Meta Principal" value={alumno.objetivo} />
            <InfoRow label="Plazo Deseado" value={alumno.plazo} />
          </Section>

          {/* BLOQUE 4: SALUD Y ANTECEDENTES */}
          <Section title="4. SALUD Y ANTECEDENTES" icon="medkit-outline" color="#ef4444">
            <InfoRow label="Lesiones Actuales" value={alumno.lesiones} />
            <InfoRow label="Enfermedades" value={alumno.enfermedades} />
            <InfoRow label="Medicamentos" value={alumno.medicamentos} />
          </Section>

          {/* BLOQUE 5: ESTILO DE VIDA */}
          <Section title="5. ESTILO DE VIDA" icon="walk-outline">
            <InfoRow label="Nivel de Actividad Diaria" value={alumno.nivelActividad} />
            <InfoRow label="Horas de Sueño" value={alumno.horasSueno} />
            <InfoRow label="Nivel de Estrés" value={alumno.estres} />
          </Section>

          {/* BLOQUE 6: NUTRICIÓN ACTUAL */}
          <Section title="6. NUTRICIÓN ACTUAL" icon="restaurant-outline">
            <InfoRow label="Comidas al día" value={alumno.comidasDia} />
            <InfoRow label="Consumo de Agua" value={alumno.agua} />
            <InfoRow label="Suplementos usados" value={alumno.suplementos} />
          </Section>

          {/* BLOQUE 7: ENTRENAMIENTO PREVIO */}
          <Section title="7. HISTORIAL DE ENTRENAMIENTO" icon="barbell-outline">
            <InfoRow label="Experiencia" value={alumno.experiencia} />
            <InfoRow label="¿Entrena actualmente?" value={alumno.entrenaActual} />
          </Section>

          {/* BLOQUE 8: DISPONIBILIDAD */}
          <Section title="8. DISPONIBILIDAD" icon="calendar-outline">
            <InfoRow label="Días por semana" value={alumno.diasDisponibles} />
            <InfoRow label="Tiempo por sesión" value={alumno.tiempoSesion} />
            <InfoRow label="Lugar (Gym/Casa)" value={alumno.lugarEntreno} />
          </Section>

          {/* BLOQUE 9: EQUIPAMIENTO */}
          <Section title="9. EQUIPAMIENTO" icon="construct-outline">
            <InfoRow label="Equipo disponible" value={alumno.equipo} />
          </Section>

          {/* BLOQUE 10: MOTIVACIÓN Y EXTRAS */}
          <Section title="10. MOTIVACIÓN" icon="heart-outline">
            <InfoRow label="¿Qué te motiva?" value={alumno.motivacion} />
            <InfoRow label="Notas adicionales" value={alumno.notas} />
          </Section>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
          <Text style={styles.btnTxt}>RECHAZAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
          <Text style={styles.btnTxt}>ACEPTAR Y CREAR PLAN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Sub-componente para Secciones
const Section = ({ title, icon, children, color = "#3b82f6" }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  container: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8, marginLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  infoRow: { marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 1 },
  val: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', gap: 10, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  btn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});