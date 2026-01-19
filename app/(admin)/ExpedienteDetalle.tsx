import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definimos la interfaz con campos opcionales (?) para evitar errores de TS
export interface ExpedienteProps {
  alumno?: any;
  onClose?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function ExpedienteDetalle({ 
  alumno = null, 
  onClose = () => {}, 
  onAccept = () => {}, 
  onReject = () => {} 
}: ExpedienteProps) {

  // Si no hay alumno seleccionado, se mantiene oculto sin dar error
  if (!alumno) return null;

  let n = 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE DEL CLIENTE</Text>
        <TouchableOpacity onPress={() => console.log("Generando PDF...")}>
          <Ionicons name="document-text" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{++n}. DATOS GENERALES</Text>
            <Text style={styles.label}>Nombre: <Text style={styles.val}>{alumno.nombre || 'No registrado'}</Text></Text>
            <Text style={styles.label}>Edad: <Text style={styles.val}>{alumno.datosFisicos?.edad || 'N/A'} años</Text></Text>
            <Text style={styles.label}>Objetivo: <Text style={styles.val}>{alumno.objetivo || 'Recomposición'}</Text></Text>
          </View>

          {/* Aquí puedes seguir agregando más secciones del cuestionario */}

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
              <Text style={styles.btnTxt}>RECHAZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
              <Text style={styles.btnTxt}>ACEPTAR Y CREAR PLAN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  container: { flex: 1 },
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginBottom: 10 },
  label: { fontSize: 11, color: '#64748b', marginBottom: 5 },
  val: { color: '#1e293b', fontWeight: 'bold' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 30 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});