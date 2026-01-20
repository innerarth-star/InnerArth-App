import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const PREGUNTAS_TEXTO: any = {
  p1: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco?",
  p2: "¿Siente dolor en el pecho cuando realiza actividad física?",
  p3: "¿En el último mes, ha sentido dolor en el pecho sin actividad física?",
  p4: "¿Pierde el equilibrio debido a mareos o pérdida de conocimiento?",
  p5: "¿Tiene algún problema óseo o articular que podría empeorar?",
  p6: "¿Le receta actualmente medicamentos para la presión o corazón?",
  p7: "¿Sabe de alguna otra razón por la cual no debería hacer ejercicio?"
};

const consentimientoTexto = `Por medio de la presente, el alumno declara que la información proporcionada es verídica y acepta los términos del programa FitTech. Reconoce que el ejercicio físico conlleva riesgos y libera de responsabilidad a los entrenadores por omisiones en su historial de salud.`;

export default function ExpedienteDetalle({ alumno, onClose, onAccept }: any) {
  if (!alumno) return null;

  const generarPDF = async () => {
    const filasAlimentos = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([ali, op]) => `<tr><td>${ali}</td><td><b>${op}</b></td></tr>`).join('');

    const filasParq = Object.keys(PREGUNTAS_TEXTO)
      .map(k => `<tr><td>${PREGUNTAS_TEXTO[k]}</td><td style="text-align:right"><b>${alumno.salud?.parq?.[k]?.toUpperCase() || 'N/A'}</b></td></tr>`).join('');

    const html = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica'; color: #1e293b; line-height: 1.4; padding: 0; }
          .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; page-break-inside: avoid; }
          .title { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; margin-bottom: 10px; display: inline-block; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; }
          td { border-bottom: 0.5px solid #eee; padding: 5px; font-size: 10px; }
          .label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .page-break { page-break-before: always; }
          .firma { width: 250px; display: block; margin: 20px auto; border-bottom: 2px solid #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EXPEDIENTE TÉCNICO: ${alumno.nombre?.toUpperCase()}</h1>
        </div>

        <div class="block">
          <div class="title">1. Datos Personales</div>
          <table>
            <tr><td><span class="label">Nombre:</span><br/>${alumno.nombre}</td><td><span class="label">Email:</span><br/>${alumno.email}</td></tr>
            <tr><td><span class="label">Teléfono:</span><br/>${alumno.telefono}</td><td><span class="label">Edad:</span><br/>${alumno.datosFisicos?.edad} años</td></tr>
          </table>
        </div>

        <div class="block">
          <div class="title">2. Medidas Corporales</div>
          <table>
            <tr><td>Peso: <b>${alumno.datosFisicos?.peso}kg</b></td><td>Altura: <b>${alumno.datosFisicos?.altura}cm</b></td><td>Cintura: <b>${alumno.medidas?.cintura}cm</b></td></tr>
            <tr><td>Cadera: <b>${alumno.medidas?.cadera}cm</b></td><td>Pecho: <b>${alumno.medidas?.pecho}cm</b></td><td>Cuello: <b>${alumno.medidas?.cuello}cm</b></td></tr>
          </table>
        </div>

        ${alumno.datosFisicos?.genero === 'mujer' ? `
        <div class="block">
          <div class="title">3. Ciclo Menstrual</div>
          <p><span class="label">Estado:</span> ${alumno.ciclo?.tipo} | <span class="label">Anticonceptivo:</span> ${alumno.ciclo?.anticonceptivo}</p>
        </div>` : ''}

        <div class="block">
          <div class="title">4. Historial de Salud</div>
          <p><span class="label">Enfermedades:</span> ${alumno.salud?.enfPers?.join(', ') || 'Ninguna'}</p>
          <p><span class="label">Lesiones/Cirugías:</span> ${alumno.salud?.detalleLesion || 'No'} / ${alumno.salud?.detalleOperacion || 'No'}</p>
        </div>

        <div class="block">
          <div class="title">5. Estilo de Vida (IPAQ)</div>
          <p><span class="label">Actividad Vigorosa:</span> ${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min</p>
          <p><span class="label">Horas Sentado:</span> ${alumno.ipaq?.sentado} hrs</p>
        </div>

        <div class="page-break"></div>

        <div class="block">
          <div class="title">6. Cuestionario Riesgo PAR-Q</div>
          <table>${filasParq}</table>
        </div>

        <div class="block">
          <div class="title">7. Nutrición y Objetivos</div>
          <p><span class="label">Objetivo:</span> <b>${alumno.nutricion?.objetivo}</b></p>
          <p><span class="label">Plan deseado:</span> ${alumno.nutricion?.entrenos} días / ${alumno.nutricion?.comidasDes} comidas</p>
        </div>

        <div class="block">
          <div class="title">8. Frecuencia Alimentaria</div>
          <table>${filasAlimentos}</table>
        </div>

        <div class="block">
          <div class="title">9. Consentimiento Informado</div>
          <p style="font-size: 9px; text-align: justify;">${consentimientoTexto}</p>
        </div>

        <div class="block" style="text-align: center;">
          <div class="title">10. Firma del Alumno</div>
          <img src="${alumno.firma}" class="firma" />
          <p>ID: ${alumno.id}</p>
        </div>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  const Bloque = ({ num, titulo, color, children }: any) => (
    <View style={styles.bloque}>
      <View style={[styles.bloqueHeader, { borderLeftColor: color }]}>
        <View style={[styles.num, { backgroundColor: color }]}><Text style={styles.numTxt}>{num}</Text></View>
        <Text style={styles.bloqueTitulo}>{titulo}</Text>
      </View>
      <View style={styles.bloqueContenido}>{children}</View>
    </View>
  );

  const Campo = ({ label, value }: any) => (
    <View style={styles.campo}>
      <Text style={styles.labelApp}>{label}</Text>
      <Text style={styles.valueApp}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.btnBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
          <Text style={styles.btnTxt}>Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Expediente Completo</Text>
        <TouchableOpacity onPress={generarPDF} style={styles.btnPdf}>
          <FontAwesome5 name="file-pdf" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.central}>
          <Bloque num="1" titulo="DATOS PERSONALES" color="#3b82f6">
            <Campo label="Nombre" value={alumno.nombre} />
            <Campo label="Email" value={alumno.email} />
            <Campo label="Teléfono" value={alumno.telefono} />
          </Bloque>

          <Bloque num="2" titulo="MEDIDAS CORPORALES" color="#10b981">
            <View style={styles.row}>
              <Campo label="Peso" value={`${alumno.datosFisicos?.peso}kg`} />
              <Campo label="Altura" value={`${alumno.datosFisicos?.altura}cm`} />
              <Campo label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
            </View>
            <View style={styles.row}>
              <Campo label="Cintura" value={alumno.medidas?.cintura} />
              <Campo label="Cadera" value={alumno.medidas?.cadera} />
              <Campo label="Cuello" value={alumno.medidas?.cuello} />
            </View>
          </Bloque>

          {alumno.datosFisicos?.genero === 'mujer' && (
            <Bloque num="3" titulo="CICLO MENSTRUAL" color="#ec4899">
              <Campo label="Estado" value={alumno.ciclo?.tipo} />
              <Campo label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
            </Bloque>
          )}

          <Bloque num="4" titulo="HISTORIAL SALUD" color="#ef4444">
            <Campo label="Enfermedades" value={alumno.salud?.enfPers?.join(', ')} />
            <Campo label="Lesiones/Cirugías" value={`${alumno.salud?.detalleLesion} / ${alumno.salud?.detalleOperacion}`} />
          </Bloque>

          <Bloque num="5" titulo="ESTILO DE VIDA (IPAQ)" color="#f59e0b">
            <Campo label="Vigorosa" value={`${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min`} />
            <Campo label="Moderada" value={`${alumno.ipaq?.mDias} días / ${alumno.ipaq?.mMin} min`} />
          </Bloque>

          <Bloque num="6" titulo="PAR-Q" color="#0ea5e9">
            {Object.keys(PREGUNTAS_TEXTO).map(k => (
              <View key={k} style={styles.parqRow}>
                <Text style={styles.parqTxt}>{PREGUNTAS_TEXTO[k]}</Text>
                <Text style={styles.parqVal}>{alumno.salud?.parq?.[k]?.toUpperCase()}</Text>
              </View>
            ))}
          </Bloque>

          <Bloque num="7" titulo="NUTRICIÓN Y OBJETIVOS" color="#8b5cf6">
            <Campo label="Objetivo" value={alumno.nutricion?.objetivo} />
            <Campo label="Días Entrenamiento" value={alumno.nutricion?.entrenos} />
            <Campo label="Comidas Deseadas" value={alumno.nutricion?.comidasDes} />
          </Bloque>

          <Bloque num="8" titulo="FRECUENCIA ALIMENTARIA" color="#22c55e">
            {Object.entries(alumno.frecuenciaAlimentos || {}).map(([k,v]: any) => (
              <View key={k} style={styles.parqRow}><Text>{k}</Text><Text style={{fontWeight:'bold'}}>{v}</Text></View>
            ))}
          </Bloque>

          <Bloque num="9" titulo="CONSENTIMIENTO" color="#64748b">
            <Text style={{ fontSize: 11, textAlign: 'justify', color: '#475569' }}>{consentimientoTexto}</Text>
          </Bloque>

          <Bloque num="10" titulo="FIRMA" color="#1e293b">
            <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
          </Bloque>

          <TouchableOpacity style={styles.btnAprobar} onPress={onAccept}>
            <Text style={styles.btnAprobarTxt}>APROBAR Y CREAR PLAN</Text>
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
  btnTxt: { fontSize: 16, fontWeight: '600' },
  navTitle: { fontSize: 16, fontWeight: 'bold' },
  btnPdf: { padding: 5 },
  scroll: { paddingVertical: 20 },
  central: { width: width > 800 ? 800 : '95%', alignSelf: 'center' },
  bloque: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2 },
  bloqueHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderLeftWidth: 5, gap: 10 },
  num: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  numTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bloqueTitulo: { fontWeight: 'bold', fontSize: 13, color: '#334155' },
  bloqueContenido: { padding: 15, paddingTop: 0 },
  campo: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  labelApp: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  valueApp: { fontSize: 14, color: '#1e293b', fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  parqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  parqTxt: { flex: 0.8, fontSize: 11, color: '#64748b' },
  parqVal: { fontWeight: 'bold', color: '#1e293b' },
  firmaImg: { width: '100%', height: 150, backgroundColor: '#fafafa', borderRadius: 10 },
  btnAprobar: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  btnAprobarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});