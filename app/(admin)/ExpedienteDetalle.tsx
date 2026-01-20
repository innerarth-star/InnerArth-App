import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ExpedienteDetalle({ alumno, onClose, onAccept, onReject }: any) {
  // Estado para controlar qué bloque está abierto. Por defecto el 1.
  const [seccionAbierta, setSeccionAbierta] = useState<number | null>(1);

  if (!alumno) return null;

  const Section = ({ num, title, color, icon, children }: any) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => setSeccionAbierta(seccionAbierta === num ? null : num)}
      >
        <View style={styles.titleGroup}>
          <View style={[styles.bullet, {backgroundColor: color}]}><Text style={styles.bulletTxt}>{num}</Text></View>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>
        </View>
        <Ionicons name={seccionAbierta === num ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
      </TouchableOpacity>
      {seccionAbierta === num && <View style={styles.cardContent}>{children}</View>}
    </View>
  );

  const Dato = ({ label, value }: any) => (
    <View style={styles.datoContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'NO REGISTRA'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.main}>
      {/* HEADER CON BOTÓN DE REGRESAR FUNCIONAL */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Ionicons name="arrow-back" size={26} color="#1e293b" />
          <Text style={styles.backTxt}>Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Expediente Técnico</Text>
        <TouchableOpacity onPress={() => {/* Función PDF */}}>
          <FontAwesome5 name="file-pdf" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          
          <Section num={1} title="Datos e Identificación" color="#3b82f6" icon="account">
            <Dato label="Nombre Completo" value={alumno.nombre} />
            <Dato label="Correo Electrónico" value={alumno.email} />
            <Dato label="Teléfono" value={alumno.telefono} />
            <Dato label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
            <Dato label="Género" value={alumno.datosFisicos?.genero} />
          </Section>

          <Section num={2} title="Composición Física" color="#10b981" icon="scale-bathroom">
            <Dato label="Peso Actual" value={`${alumno.datosFisicos?.peso} kg`} />
            <Dato label="Estatura" value={`${alumno.datosFisicos?.altura} cm`} />
            <View style={styles.grid}>
              <Dato label="Cintura" value={alumno.medidas?.cintura} />
              <Dato label="Cadera" value={alumno.medidas?.cadera} />
              <Dato label="Pecho" value={alumno.medidas?.pecho} />
            </View>
          </Section>

          <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="flower">
            <Dato label="Estado de ciclo" value={alumno.ciclo?.tipo} />
            <Dato label="Anticonceptivos" value={alumno.ciclo?.anticonceptivo} />
          </Section>

          <Section num={4} title="Historial Médico" color="#ef4444" icon="hospital-box">
            <Dato label="Enfermedades" value={alumno.salud?.enfPers?.join(', ')} />
            <Dato label="Lesiones / Cirugías" value={alumno.salud?.detalleLesion} />
          </Section>

          <Section num={5} title="Actividad Física (IPAQ)" color="#f59e0b" icon="run">
            <Dato label="Días actividad vigorosa" value={alumno.ipaq?.vDias} />
            <Dato label="Minutos por día" value={alumno.ipaq?.vMin} />
            <Dato label="Horas sentado al día" value={alumno.ipaq?.sentado} />
          </Section>

          <Section num={6} title="Riesgos (PAR-Q)" color="#0ea5e9" icon="clipboard-check">
            <Dato label="¿Dolor en el pecho?" value={alumno.salud?.parq?.p2} />
            <Dato label="¿Problemas óseos?" value={alumno.salud?.parq?.p5} />
          </Section>

          <Section num={7} title="Nutrición y Objetivos" color="#8b5cf6" icon="food-apple">
            <Dato label="Objetivo Principal" value={alumno.nutricion?.objetivo} />
            <Dato label="Días de entrenamiento" value={alumno.nutricion?.entrenos} />
            <Dato label="Comidas al día" value={alumno.nutricion?.comidasDes} />
          </Section>

          <Section num={8} title="Frecuencia Alimentaria" color="#22c55e" icon="nutrition">
            {alumno.frecuenciaAlimentos && Object.entries(alumno.frecuenciaAlimentos).map(([key, val]: any) => (
              <Dato key={key} label={key} value={val} />
            ))}
          </Section>

          <Section num={9} title="Firma del Alumno" color="#1e293b" icon="fountain-pen-tip">
            {alumno.firma ? (
              <Image source={{ uri: alumno.firma }} style={styles.firma} resizeMode="contain" />
            ) : <Text>Sin firma registrada</Text>}
          </Section>

          <Section num={10} title="Consentimiento" color="#64748b" icon="file-document-edit">
            <Text style={styles.consentTxt}>El alumno aceptó los términos y condiciones de entrenamiento personal el día de su registro.</Text>
          </Section>

          {/* BOTONES DE ACCIÓN */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnReject} onPress={onReject}>
              <Text style={styles.btnTextReject}>RECHAZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
              <Text style={styles.btnTextAccept}>ACEPTAR Y CREAR PLAN</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#f1f5f9' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backTxt: { marginLeft: 5, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  scroll: { paddingVertical: 10 },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  bulletTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  cardContent: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  datoContainer: { marginBottom: 12 },
  label: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  firma: { width: '100%', height: 150, marginTop: 10, backgroundColor: '#fff' },
  consentTxt: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 50 },
  btnAccept: { flex: 2, backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnReject: { flex: 1, backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnTextAccept: { color: '#fff', fontWeight: 'bold' },
  btnTextReject: { color: '#ef4444', fontWeight: 'bold' }
});