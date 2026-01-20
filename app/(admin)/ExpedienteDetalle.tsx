import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  const [seccion, setSeccion] = useState<number | null>(1);

  const Section = ({ num, title, color, icon, children }: any) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setSeccion(seccion === num ? null : num)}>
        <View style={styles.titleRow}>
          <View style={[styles.badge, {backgroundColor: color}]}><Text style={styles.badgeText}>{num}</Text></View>
          <FontAwesome5 name={icon} size={14} color={color} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons name={seccion === num ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
      </TouchableOpacity>
      {seccion === num && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );

  const Info = ({ label, value }: any) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.modalNav}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.navTitle}>Detalle del Expediente</Text>
        <View style={{width: 26}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user">
          <Info label="Nombre" value={alumno.nombre} />
          <Info label="Email" value={alumno.email} />
          <Info label="Teléfono" value={alumno.telefono} />
          <Info label="Edad/Peso/Talla" value={`${alumno.datosFisicos?.edad}A / ${alumno.datosFisicos?.peso}KG / ${alumno.datosFisicos?.altura}CM`} />
        </Section>

        <Section num={2} title="Medidas" color="#10b981" icon="ruler">
          <Info label="Cintura" value={alumno.medidas?.cintura} />
          <Info label="Cadera" value={alumno.medidas?.cadera} />
          <Info label="Pecho" value={alumno.medidas?.pecho} />
        </Section>

        <Section num={9} title="Firma" color="#1e293b" icon="pen">
          <Image source={{ uri: alumno.firma }} style={styles.firma} resizeMode="contain" />
        </Section>

        {/* BOTONES DE ACCIÓN RESTAURADOS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnReject} onPress={onReject}>
            <Text style={styles.btnTextReject}>RECHAZAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
            <Text style={styles.btnTextAccept}>ACEPTAR ALUMNO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  modalNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  navTitle: { fontSize: 17, fontWeight: 'bold' },
  scroll: { padding: 15 },
  sectionContainer: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  sectionContent: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  infoRow: { marginBottom: 10 },
  infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  firma: { width: '100%', height: 120, marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20, paddingBottom: 40 },
  btnAccept: { flex: 2, backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnReject: { flex: 1, backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnTextAccept: { color: '#fff', fontWeight: 'bold' },
  btnTextReject: { color: '#ef4444', fontWeight: 'bold' }
});