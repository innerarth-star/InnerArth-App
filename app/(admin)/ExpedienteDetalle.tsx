import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// Diccionario para el PAR-Q (Asegúrate que estas llaves coincidan con tu index)
const PREGUNTAS_PARQ: any = {
  p1: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco?",
  p2: "¿Siente dolor en el pecho cuando realiza actividad física?",
  p3: "¿En el último mes, ha sentido dolor en el pecho sin actividad física?",
  p4: "¿Pierde el equilibrio debido a mareos o pérdida de conocimiento?",
  p5: "¿Tiene algún problema óseo o articular que podría empeorar?",
  p6: "¿Le receta actualmente medicamentos para la presión o corazón?",
  p7: "¿Sabe de alguna otra razón por la cual no debería hacer ejercicio?"
};

export default function ExpedienteDetalle({ alumno, onClose, onAccept }: any) {
  if (!alumno) return null;

  const exportarPDF = async () => {
    // Generar filas de alimentos para el HTML
    const alimentosHtml = alumno.frecuenciaAlimentos 
      ? Object.entries(alumno.frecuenciaAlimentos).map(([ali, frec]) => `<tr><td>${ali}</td><td><b>${frec}</b></td></tr>`).join('')
      : '<tr><td>No hay datos</td><td>---</td></tr>';

    const htmlContent = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica'; color: #334155; line-height: 1.4; }
          .h { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          .section { margin-top: 15px; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; page-break-inside: avoid; }
          .title { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 10px; font-weight: bold; font-size: 11px; display: inline-block; }
          .row { display: flex; justify-content: space-between; border-bottom: 0.5px solid #eee; padding: 4px 0; font-size: 10px; }
          img { width: 250px; display: block; margin: 20px auto; border-bottom: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="h"><h1>EXPEDIENTE TÉCNICO: ${alumno.nombre?.toUpperCase()}</h1></div>
        <div class="section">
          <div class="title">1. DATOS DE IDENTIFICACIÓN</div>
          <div class="row"><span>Email:</span> <b>${alumno.email}</b></div>
          <div class="row"><span>Teléfono:</span> <b>${alumno.telefono}</b></div>
        </div>
        <div class="section">
          <div class="title">2. COMPOSICIÓN FÍSICA</div>
          <div class="row"><span>Peso: ${alumno.datosFisicos?.peso}kg</span><span>Altura: ${alumno.datosFisicos?.altura}cm</span><span>Edad: ${alumno.datosFisicos?.edad}</span></div>
          <div class="row"><span>Cintura: ${alumno.medidas?.cintura}cm</span><span>Cadera: ${alumno.medidas?.cadera}cm</span></div>
        </div>
        <div class="section">
          <div class="title">8. FRECUENCIA ALIMENTARIA</div>
          <table style="width:100%">${alimentosHtml}</table>
        </div>
        <div style="page-break-before: always;"></div>
        <p style="text-align:center">FIRMA DEL ALUMNO</p>
        <img src="${alumno.firma}" />
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  const Bloque = ({ num, titulo, color, children }: any) => (
    <View style={styles.bloque}>
      <View style={[styles.bloqueHeader, { borderLeftColor: color }]}>
        <View style={[styles.num, { backgroundColor: color }]}><Text style={styles.numTxt}>{num}</Text></View>
        <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
      </View>
      <View style={styles.bloqueContenido}>{children}</View>
    </View>
  );

  const Campo = ({ label, value }: any) => (
    <View style={styles.campo}>
      <Text style={styles.labelApp}>{label}</Text>
      <Text style={styles.valueApp}>{value || 'SIN DATO'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.btnBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
          <Text style={styles.btnTxt}>REGRESAR</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>EXPEDIENTE</Text>
        <TouchableOpacity onPress={exportarPDF} style={styles.btnPdf}>
          <FontAwesome5 name="file-pdf" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.central}>
          
          <Bloque num="1" titulo="Datos Personales" color="#3b82f6">
            <Campo label="Nombre Completo" value={alumno.nombre} />
            <Campo label="Correo Electrónico" value={alumno.email} />
            <Campo label="WhatsApp / Teléfono" value={alumno.telefono} />
          </Bloque>

          <Bloque num="2" titulo="Medidas y Composición" color="#10b981">
            <View style={styles.row}>
              <Campo label="Peso" value={alumno.datosFisicos?.peso ? `${alumno.datosFisicos.peso} kg` : null} />
              <Campo label="Estatura" value={alumno.datosFisicos?.altura ? `${alumno.datosFisicos.altura} cm` : null} />
              <Campo label="Edad" value={alumno.datosFisicos?.edad} />
            </View>
            <View style={styles.row}>
              <Campo label="Cintura" value={alumno.medidas?.cintura} />
              <Campo label="Cadera" value={alumno.medidas?.cadera} />
              <Campo label="Cuello" value={alumno.medidas?.cuello} />
            </View>
          </Bloque>

          {alumno.datosFisicos?.genero === 'mujer' && (
            <Bloque num="3" titulo="Ciclo Menstrual" color="#ec4899">
              <Campo label="Tipo de Ciclo" value={alumno.ciclo?.tipo} />
              <Campo label="Anticonceptivos" value={alumno.ciclo?.anticonceptivo} />
            </Bloque>
          )}

          <Bloque num="4" titulo="Salud y Antecedentes" color="#ef4444">
            <Campo label="Enfermedades Propias" value={alumno.salud?.enfPers?.join(', ')} />
            <Campo label="Enfermedades Familiares" value={alumno.salud?.enfFam} />
            <Campo label="Lesiones" value={alumno.salud?.detalleLesion} />
            <Campo label="Cirugías / Operaciones" value={alumno.salud?.detalleOperacion} />
            <Campo label="Frecuencia Cardiaca (FCR)" value={alumno.salud?.frecuenciaCardiaca} />
          </Bloque>

          <Bloque num="5" titulo="Estilo de Vida (IPAQ)" color="#f59e0b">
            <Campo label="Actividad Vigorosa" value={`${alumno.ipaq?.vDias || 0} días / ${alumno.ipaq?.vMin || 0} min`} />
            <Campo label="Caminata" value={`${alumno.ipaq?.cDias || 0} días / ${alumno.ipaq?.cMin || 0} min`} />
            <Campo label="Horas sentado" value={alumno.ipaq?.sentado} />
          </Bloque>

          <Bloque num="6" titulo="Riesgos (PAR-Q)" color="#0ea5e9">
            {Object.keys(PREGUNTAS_PARQ).map(k => (
              <View key={k} style={styles.parqRow}>
                <Text style={styles.parqTxt}>{PREGUNTAS_PARQ[k]}</Text>
                <Text style={styles.parqVal}>{alumno.salud?.parq?.[k]?.toUpperCase()}</Text>
              </View>
            ))}
          </Bloque>

          <Bloque num="7" titulo="Nutrición y Objetivos" color="#8b5cf6">
            <Campo label="Objetivo" value={alumno.nutricion?.objetivo} />
            <Campo label="Entrenamientos por semana" value={alumno.nutricion?.entrenos} />
            <Campo label="Comidas diarias deseadas" value={alumno.nutricion?.comidasDes} />
            <Campo label="Alcohol / Sustancias" value={`${alumno.nutricion?.alcohol} / ${alumno.nutricion?.sust}`} />
          </Bloque>

          <Bloque num="8" titulo="Frecuencia Alimentaria" color="#22c55e">
            {alumno.frecuenciaAlimentos && Object.entries(alumno.frecuenciaAlimentos).map(([k,v]: any) => (
              <View key={k} style={styles.parqRow}><Text style={{fontSize:12}}>{k}</Text><Text style={{fontWeight:'bold'}}>{v}</Text></View>
            ))}
          </Bloque>

          <Bloque num="9" titulo="Firma Digital" color="#1e293b">
            <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
          </Bloque>

          <Bloque num="10" titulo="Consentimiento" color="#64748b">
            <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'justify' }}>El alumno ha aceptado el consentimiento informado legal al momento de su registro.</Text>
          </Bloque>

          <TouchableOpacity style={styles.btnAceptar} onPress={onAccept}>
            <Text style={styles.btnAceptarTxt}>APROBAR EXPEDIENTE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  btnBack: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnTxt: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  navTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  btnPdf: { padding: 5 },
  scroll: { paddingVertical: 15 },
  central: { width: width > 800 ? 800 : '95%', alignSelf: 'center' },
  bloque: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2 },
  bloqueHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderLeftWidth: 5, gap: 10 },
  num: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  numTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bloqueTitulo: { fontWeight: 'bold', fontSize: 13, color: '#334155' },
  bloqueContenido: { padding: 15, paddingTop: 0 },
  campo: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  labelApp: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  valueApp: { fontSize: 14, color: '#1e293b', fontWeight: 'bold', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  parqTxt: { flex: 0.8, fontSize: 11, color: '#64748b' },
  parqVal: { fontWeight: 'bold', color: '#1e293b' },
  firmaImg: { width: '100%', height: 150, backgroundColor: '#fafafa', borderRadius: 10 },
  btnAceptar: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  btnAceptarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});