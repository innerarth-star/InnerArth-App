import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExpedienteDetalle(props: any) {
  // Extraemos las funciones y el objeto alumno de las props
  const { alumno, onClose, onAccept, onReject } = props;

  // Si no hay alumno, mostramos un aviso en lugar de pantalla en blanco
  if (!alumno) {
    return (
      <View style={styles.center}>
        <Text>Cargando datos del cliente...</Text>
        <TouchableOpacity onPress={onClose}><Text style={{color: 'blue', marginTop: 20}}>Cerrar</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXPEDIENTE COMPLETO</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>DATOS DEL CUESTIONARIO</Text>
            
            {/* Renderizamos dinámicamente lo que venga en el objeto alumno */}
            {Object.entries(alumno).map(([key, value]: [string, any]) => {
              // No mostrar IDs o campos de sistema
              if (key === 'id' || typeof value === 'function') return null;
              
              return (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                  <Text style={styles.val}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Text>
                </View>
              );
            })}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 14, fontWeight: 'bold' },
  container: { flex: 1 },
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginBottom: 15 },
  infoRow: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 5 },
  label: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold' },
  val: { fontSize: 14, color: '#1e293b', marginTop: 2 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 20, paddingBottom: 40 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnAccept: { backgroundColor: '#10b981' },
  btnReject: { backgroundColor: '#ef4444' },
  btnTxt: { color: '#fff', fontWeight: 'bold' }
});