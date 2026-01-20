import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PREGUNTAS_PARQ: any = {
  p1: "¿Problema cardíaco?", p2: "¿Dolor pecho ejercicio?", p3: "¿Dolor pecho reposo?",
  p4: "¿Mareos/Equilibrio?", p5: "¿Problema óseo?", p6: "¿Medicamentos presión?", p7: "¿Otra razón?"
};

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  const [activa, setActiva] = useState<number | null>(1);

  const exportarPDF = async () => {
    const a = alumno;
    const html = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica'; color: #334155; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .block { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 20px; }
          .title { background: #3b82f6; color: white; padding: 5px 15px; border-radius: 15px; font-weight: bold; font-size: 12px; margin-bottom: 10px; display: inline-block; }
          .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 5px 0; }
          .label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .value { font-size: 11px; font-weight: bold; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header"><h1>EXPEDIENTE TÉCNICO: ${a.nombre?.toUpperCase()}</h1></div>
        <div class="block">
          <div class="title">1. DATOS PERSONALES</div>
          <div class="row"><span class="label">Teléfono</span><span class="value">${a.telefono}</span></div>
          <div class="row"><span class="label">Edad / Peso / Talla</span><span class="value">${a.datosFisicos?.edad}A / ${a.datosFisicos?.peso}KG / ${a.datosFisicos?.altura}CM</span></div>
        </div>
        <div class="block">
          <div class="title">2. MEDIDAS CORPORALES</div>
          <div class="row"><span>Cintura: ${a.medidas?.cintura}</span><span>Cadera: ${a.medidas?.cadera}</span><span>Pecho: ${a.medidas?.pecho}</span></div>
        </div>
        <div class="block">
          <div class="title">4. SALUD</div>
          <div class="row"><span class="label">Enfermedades</span><span class="value">${a.salud?.enfPers?.join(', ') || 'Ninguna'}</span></div>
        </div>
        <div class="page-break"></div>
        <div style="text-align:center;">
          <p class="label">FIRMA DIGITAL</p>
          <img src="${a.firma}" style="width:250px; border-bottom:2px solid #000;" />
        </div>
      </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar PDF"); }
  };

  const Section = ({ num, title, color, icon, children }: any) => (
    <View style={styles.sectionCard}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setActiva(activa === num ? null : num)}>
        <View style={styles.titleRow}>
          <View style={[styles.num, {backgroundColor: color}]}><Text style={styles.numTxt}>{num}</Text></View>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
          <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
        </View>
        <Ionicons name={activa === num ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
      </TouchableOpacity>
      {activa === num && <View style={styles.content}>{children}</View>}
    </View>
  );

  const Dato = ({ label, value }: any) => (
    <View style={styles.datoBox}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValue}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onClose}><Ionicons name="chevron-back" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.navTitle}>Expediente</Text>
        <TouchableOpacity onPress={exportarPDF}><FontAwesome5 name="file-pdf" size={22} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.webContainer}>
          <Section num={1} title="Datos Personales" color="#3b82f6" icon="account">
            <Dato label="Nombre" value={alumno.nombre} />
            <Dato label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
            <Dato label="Peso/Altura" value={`${alumno.datosFisicos?.peso}kg / ${alumno.datosFisicos?.altura}cm`} />
          </Section>

          <Section num={2} title="Medidas" color="#10b981" icon="ruler">
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
              <Dato label="Cintura" value={alumno.medidas?.cintura} />
              <Dato label="Cadera" value={alumno.medidas?.cadera} />
              <Dato label="Pecho" value={alumno.medidas?.pecho} />
            </View>
          </Section>

          <Section num={4} title="Salud" color="#ef4444" icon="heart-pulse">
            <Dato label="Enfermedades" value={alumno.salud?.enfPers?.join(', ')} />
          </Section>

          <Section num={9} title="Firma" color="#1e293b" icon="fountain-pen-tip">
            <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
          </Section>

          <View style={styles.footerBtns}>
            <TouchableOpacity style={styles.btnReject} onPress={onReject}><Text style={styles.btnTxtReject}>RECHAZAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={onAccept}><Text style={styles.btnTxtAccept}>ACEPTAR ALUMNO</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingVertical: 15 },
  webContainer: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: 15 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  numTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  content: { padding: 16, borderTopWidth: 1, borderColor: '#f8fafc', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 12 },
  datoLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  datoValue: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  firmaImg: { width: '100%', height: 120, marginTop: 10 },
  footerBtns: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 50 },
  btnAccept: { flex: 2, backgroundColor: '#10b981', padding: 16, borderRadius: 14, alignItems: 'center' },
  btnReject: { flex: 1, backgroundColor: '#fee2e2', padding: 16, borderRadius: 14, alignItems: 'center' },
  btnTxtAccept: { color: '#fff', fontWeight: 'bold' },
  btnTxtReject: { color: '#ef4444', fontWeight: 'bold' }
});