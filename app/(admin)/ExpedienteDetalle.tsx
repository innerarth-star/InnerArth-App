import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1); // El primero abierto por defecto

  const exportarPDF = async () => {
    const htmlContent = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica'; color: #334155; }
          h1 { color: #1e3a8a; text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          .section { margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; page-break-inside: avoid; }
          .title { background: #3b82f6; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; margin-bottom: 10px; display: inline-block; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
          .label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .value { font-size: 12px; font-weight: bold; color: #1e293b; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <h1>EXPEDIENTE: ${alumno.nombre?.toUpperCase()}</h1>
        
        <div class="section">
          <div class="title">1. DATOS PERSONALES</div>
          <div class="row"><span class="label">Email</span><span class="value">${alumno.email}</span></div>
          <div class="row"><span class="label">Teléfono</span><span class="value">${alumno.telefono}</span></div>
          <div class="row"><span class="label">Edad / Peso / Altura</span><span class="value">${alumno.datosFisicos?.edad} años / ${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm</span></div>
        </div>

        <div class="section">
          <div class="title">2. MEDIDAS CORPORALES</div>
          <div class="row"><span>Cintura: ${alumno.medidas?.cintura}</span><span>Cadera: ${alumno.medidas?.cadera}</span></div>
          <div class="row"><span>Pecho: ${alumno.medidas?.pecho}</span><span>Cuello: ${alumno.medidas?.cuello}</span></div>
          <div class="row"><span>Brazo R: ${alumno.medidas?.brazoR}</span><span>Brazo F: ${alumno.medidas?.brazoF}</span></div>
        </div>

        <div class="section">
          <div class="title">4. SALUD</div>
          <div class="row"><span class="label">Enfermedades</span><span class="value">${alumno.salud?.enfPers || 'Ninguna'}</span></div>
          <div class="row"><span class="label">Lesiones</span><span class="value">${alumno.salud?.detalleLesion || 'No'}</span></div>
        </div>

        <div class="page-break"></div>
        <div style="text-align:center;">
          <p class="label">FIRMA DEL ALUMNO</p>
          <img src="${alumno.firma}" style="width:200px; border-bottom:1px solid #000;" />
        </div>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  const Section = ({ num, title, color, icon, children }: any) => (
    <View style={styles.cardSection}>
      <TouchableOpacity style={styles.headerToggle} onPress={() => setSeccionActiva(seccionActiva === num ? null : num)}>
        <View style={styles.titleRow}>
          <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
          <FontAwesome5 name={icon} size={14} color={color} /><Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FontAwesome name={seccionActiva === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
      </TouchableOpacity>
      {seccionActiva === num && <View style={styles.content}>{children}</View>}
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Ionicons name="chevron-back" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.modalTitle}>Expediente</Text>
        <TouchableOpacity onPress={exportarPDF}><FontAwesome5 name="file-pdf" size={22} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{padding: 15}}>
        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user">
          <Text style={styles.val}>{alumno.nombre}</Text>
          <Text style={styles.val}>{alumno.email}</Text>
        </Section>
        {/* Agrega los demás bloques aquí siguiendo la estructura de Section */}
        <View style={{marginTop: 20}}>
          <TouchableOpacity style={styles.btnAceptar} onPress={onAccept}><Text style={styles.btnText}>ACEPTAR Y CONTINUAR</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1 },
  headerToggle: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  val: { fontSize: 14, marginBottom: 5, fontWeight: '600' },
  btnAceptar: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});