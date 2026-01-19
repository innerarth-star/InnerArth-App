import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  if (!alumno) return null;

  // Función opcional para compartir los datos como texto rápido
  const compartirDatos = () => {
    const resumen = `Expediente de ${alumno.nombre}\nEdad: ${alumno.edad}\nObjetivo: ${alumno.objetivo}`;
    Share.share({ message: resumen });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER FIXO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLE DEL CUESTIONARIO</Text>
        <TouchableOpacity onPress={compartirDatos}>
          <Ionicons name="share-outline" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* SECCIÓN 1: PERFIL BÁSICO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. INFORMACIÓN PERSONAL</Text>
            <View style={styles.card}>
              <InfoItem label="Nombre Completo" value={alumno.nombre} />
              <InfoItem label="Correo" value={alumno.email} />
              <InfoItem label="Teléfono" value={alumno.telefono} />
              <InfoItem label="Edad" value={`${alumno.edad || alumno.datosFisicos?.edad || '--'} años`} />
            </View>
          </View>

          {/* SECCIÓN 2: DATOS FÍSICOS (Lo que llenó en el index) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. COMPOSICIÓN ACTUAL</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <InfoItem label="Peso" value={`${alumno.peso || alumno.datosFisicos?.peso || '--'} kg`} half />
                <InfoItem label="Estatura" value={`${alumno.estatura || alumno.datosFisicos?.estatura || '--'} cm`} half />
              </View>
              <InfoItem label="Objetivo Principal" value={alumno.objetivo || 'Recomposición'} />
              <InfoItem label="Nivel de Actividad" value={alumno.nivelActividad || 'No especificado'} />
            </View>
          </View>

          {/* SECCIÓN 3: SALUD Y HÁBITOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. SALUD Y ESTILO DE VIDA</Text>
            <View style={styles.card}>
              <InfoItem label="Lesiones/Dolores" value={alumno.lesiones || 'Ninguna'} />
              <InfoItem label="Enfermedades" value={alumno.enfermedades || 'Ninguna'} />
              <InfoItem label="Medicamentos" value={alumno.medicamentos || 'Ninguno'} />
              <InfoItem label="¿Fuma/Bebe?" value={alumno.habitos || 'No especificado'} />
            </View>
          </View>

          {/* SECCIÓN 4: DISPONIBILIDAD */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. ENTRENAMIENTO</Text>
            <View style={styles.card}>
              <InfoItem label="Días disponibles" value={alumno.diasEntrenamiento || '--'} />
              <InfoItem label="Lugar de entreno" value={alumno.lugarEntreno || 'Gym / Casa'} />
            </View>
          </View>

          {/* ESPACIO PARA NO TAPAR BOTONES */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ACCIONES FIJAS ABAJO */}
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

// Componente pequeño para las filas de información
const InfoItem = ({ label, value, half }: any) => (
  <View style={[styles.infoItem, half && { width: '50%' }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.val}>{value || 'No contestó'}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center', elevation: 4 },
  headerTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', letterSpacing: 1 },
  container: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6', marginBottom: 8, marginLeft: 5 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  infoItem: { marginBottom: 15 },
  row: { flexDirection: 'row' },
  label: { fontSize: 10, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase' },
  val: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  btn: { flex: 1, height: 55, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  backBtn: { padding: 5 }
});