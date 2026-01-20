import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

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

  const formatoDato = (val: any) => {
    if (val === undefined || val === null || val === '') return "---";
    const str = String(val).toLowerCase();
    if (str === 'no' || str === 'false') return "NO";
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ').toUpperCase() : "NO";
    return String(val).toUpperCase();
  };

  const generarPDF = async () => {
    // Filas para la tabla de frecuencia en el PDF
    const filasAli = Object.entries(alumno.frecuenciaAlimentos || {})
      .map(([k, v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('');

    const html = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica'; color: #1e293b; padding: 0; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; margin-bottom: 20px; padding-bottom: 10px; }
          .block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .title { background: #3b82f6; color: white; padding: 5px 15px; border-radius: 15px; font-weight: bold; font-size: 11px; display: inline-block; margin-bottom: 10px; }
          .grid { display: flex; flex-wrap: wrap; }
          .item { width: 48%; margin-bottom: 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; }
          .label { color: #64748b; font-weight: bold; font-size: 8px; text-transform: uppercase; }
          .page-break { page-break-before: always; }
          img { width: 250px; display: block; margin: 20px auto; border-bottom: 2px solid #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0">EXPEDIENTE TÉCNICO: ${formatoDato(alumno.nombre)}</h1>
          <p style="margin:5px; color:#64748b;">ID: ${alumno.id} | FitTech Coaching</p>
        </div>
        
        <div class="block">
          <div class="title">1. DATOS PERSONALES</div>
          <div class="grid">
            <div class="item"><span class="label">EDAD:</span><br/>${formatoDato(alumno.datosFisicos?.edad)} AÑOS</div>
            <div class="item"><span class="label">PESO:</span><br/>${formatoDato(alumno.datosFisicos?.peso)} KG</div>
            <div class="item"><span class="label">ESTATURA:</span><br/>${formatoDato(alumno.datosFisicos?.altura)} CM</div>
            <div class="item"><span class="label">TELÉFONO:</span><br/>${formatoDato(alumno.telefono)}</div>
          </div>
        </div>

        <div class="block">
          <div class="title">2. MEDIDAS CORPORALES</div>
          <div class="grid">
            <div class="item">CUELLO: ${formatoDato(alumno.medidas?.cuello)} CM</div>
            <div class="item">PECHO: ${formatoDato(alumno.medidas?.pecho)} CM</div>
            <div class="item">CINTURA: ${formatoDato(alumno.medidas?.cintura)} CM</div>
            <div class="item">CADERA: ${formatoDato(alumno.medidas?.cadera)} CM</div>
          </div>
        </div>

        <div class="page-break"></div>
        <p style="text-align:center; font-weight:bold; margin-top:50px;">FIRMA DIGITAL DEL ALUMNO</p>
        <img src="${alumno.firma}" />
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el documento PDF");
    }
  };

  const Bloque = ({ num, titulo, children }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardT}>{num}. {titulo.toUpperCase()}</Text>
      <View style={styles.cardC}>{children}</View>
    </View>
  );

  const Dato = ({ label, value, full }: any) => (
    <View style={[styles.datoW, full ? { width: '100%' } : { width: '48%' }]}>
      <Text style={styles.datoL}>{label}</Text>
      <Text style={[styles.datoV, formatoDato(value) === "NO" && { color: '#ef4444' }]}>
        {formatoDato(value)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerT}>DETALLE DEL ALUMNO</Text>
        <TouchableOpacity onPress={generarPDF}><FontAwesome5 name="file-pdf" size={22} color="#ef4444" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.cont}>
          
          <Bloque num="1" titulo="Datos Personales">
            <Dato label="Nombre" value={alumno.nombre} full />
            <Dato label="Edad" value={alumno.datosFisicos?.edad} />
            <Dato label="Peso" value={alumno.datosFisicos?.peso} />
            <Dato label="Estatura" value={alumno.datosFisicos?.altura} />
            <Dato label="Teléfono" value={alumno.telefono} />
          </Bloque>

          <Bloque num="2" titulo="Medidas Corporales">
            <Dato label="Cuello" value={alumno.medidas?.cuello} />
            <Dato label="Pecho" value={alumno.medidas?.pecho} />
            <Dato label="Cintura" value={alumno.medidas?.cintura} />
            <Dato label="Cadera" value={alumno.medidas?.cadera} />
            <Dato label="Brazo R" value={alumno.medidas?.brazoR} />
            <Dato label="Brazo F" value={alumno.medidas?.brazoF} />
            <Dato label="Muslo" value={alumno.medidas?.muslo} />
            <Dato label="Pierna" value={alumno.medidas?.pierna} />
          </Bloque>

          <Bloque num="3" titulo="Ciclo Menstrual">
            <Dato label="Estado" value={alumno.ciclo?.tipo} />
            <Dato label="Anticonceptivo" value={alumno.ciclo?.anticonceptivo} />
          </Bloque>

          <Bloque num="4" titulo="Historial Salud">
            <Dato label="Enfermedades" value={alumno.salud?.enfPers} full />
            <Dato label="Lesiones" value={alumno.salud?.detalleLesion} full />
            <Dato label="Cirugías" value={alumno.salud?.detalleOperacion} full />
          </Bloque>

          <Bloque num="5" titulo="Estilo de Vida (IPAQ)">
            <Dato label="Act. Vigorosa" value={alumno.ipaq?.vDias} />
            <Dato label="Horas Sueño" value={alumno.ipaq?.horasSueno} />
            <Dato label="Horas Sentado" value={alumno.ipaq?.sentado} />
          </Bloque>

          <Bloque num="6" titulo="PAR-Q">
            {Object.keys(PREGUNTAS_PARQ).map(k => (
              <View key={k} style={styles.rowQ}>
                <Text style={styles.txtQ}>{PREGUNTAS_PARQ[k]}</Text>
                <Text style={styles.valQ}>{formatoDato(alumno.salud?.parq?.[k])}</Text>
              </View>
            ))}
          </Bloque>

          <Bloque num="7" titulo="Nutrición">
            <Dato label="Objetivo" value={alumno.nutricion?.objetivo} full />
            <Dato label="Alcohol" value={alumno.nutricion?.alcohol} />
            <Dato label="Sustancias" value={alumno.nutricion?.sust} />
          </Bloque>

          <Bloque num="8" titulo="Frecuencia Alimentaria">
            {alumno.frecuenciaAlimentos && Object.entries(alumno.frecuenciaAlimentos).map(([k,v]: any) => (
              <View key={k} style={styles.rowQ}><Text style={{fontSize:11}}>{k}</Text><Text style={{fontWeight:'bold'}}>{v}</Text></View>
            ))}
          </Bloque>

          <Bloque num="9" titulo="Consentimiento">
            <Text style={styles.cons}>El alumno ha aceptado el consentimiento informado legal.</Text>
          </Bloque>

          <Bloque num="10" titulo="Firma del Alumno">
            <Image source={{ uri: alumno.firma }} style={styles.firma} resizeMode="contain" />
          </Bloque>

          <TouchableOpacity style={styles.btn} onPress={onAccept}>
            <Text style={styles.btnT}>APROBAR REGISTRO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
  headerT: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cont: { width: width > 800 ? 800 : '90%', alignSelf: 'center', marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 1 },
  cardT: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6', marginBottom: 10 },
  cardC: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  datoW: { marginBottom: 10 },
  datoL: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  datoV: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rowQ: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txtQ: { flex: 0.8, fontSize: 11, color: '#64748b' },
  valQ: { fontWeight: 'bold', fontSize: 12 },
  firma: { width: '100%', height: 150, backgroundColor: '#f8fafc', borderRadius: 10, marginTop: 10 },
  btn: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cons: { fontSize: 11, color: '#64748b', fontStyle: 'italic' }
});