import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  if (!alumno) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
        <TouchableOpacity onPress={() => console.log("Generar PDF")}>
          <Ionicons name="document-text" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DATOS DEL CUESTIONARIO</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.val}>{alumno.nombre || alumno.displayName || 'No disponible'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.val}>{alumno.email || 'No disponible'}</Text>
            </View>

            {/* Muestra los datos físicos si existen en tu objeto de Firebase */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Edad:</Text>
              <Text style={styles.val}>{alumno.datosFisicos?.edad || alumno.edad || 'N/A'}</Text>
            </View>
          </View>

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
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginBottom: 15 },
  infoRow: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 5 },
  label: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' },
  val: { fontSize: 14, color: '#1e293b', fontWeight: 'bold', marginTop: 2 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 30 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold' }
});