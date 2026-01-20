import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ExpedienteDetalle({ alumno, onClose, onAccept }: any) {
  if (!alumno) return null;

  // Función para procesar los "NO" y evitar el "SIN DATO"
  const mostrarVal = (val: any) => {
    if (val === undefined || val === null || val === '') return "---";
    if (val === 'no' || val === false) return "NO";
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ').toUpperCase() : "NO";
    return String(val).toUpperCase();
  };

  const generarPDF = async () => {
    const html = `
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica'; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 5px solid #3b82f6; padding-bottom: 10px; }
          .section-title { background: #3b82f6; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; margin-top: 20px; }
          .data-grid { display: flex; flex-wrap: wrap; margin-top: 10px; }
          .data-item { width: 48%; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
          .label { font-size: 10px; color: #64748b; font-weight: bold; }
          .value { font-size: 12px; font-weight: bold; }
          .page-break { page-break-before: always; }
          img { width: 250px; display: block; margin: 20px auto; border-bottom: 2px solid #000; }
        </style>
      </head>
      <body>
        <div class="header"><h1>EXPEDIENTE TÉCNICO: ${mostrarVal(alumno.nombre)}</h1></div>
        <div class="section-title">1. DATOS PERSONALES</div>
        <div class="data-grid">
          <div class="data-item"><span class="label">EDAD:</span><br/><span class="value">${mostrarVal(alumno.datosFisicos?.edad)} AÑOS</span></div>
          <div class="data-item"><span class="label">PESO:</span><br/><span class="value">${mostrarVal(alumno.datosFisicos?.peso)} KG</span></div>
          <div class="data-item"><span class="label">ESTATURA:</span><br/><span class="value">${mostrarVal(alumno.datosFisicos?.altura)} CM</span></div>
        </div>
        <div class="page-break"></div>
        <p style="text-align:center">FIRMA DIGITAL</p>
        <img src="${alumno.firma}" />
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar PDF"); }
  };

  const Bloque = ({ num, titulo, children }: any) => (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{num}. {titulo.toUpperCase()}</Text>
      <View style={styles.bloqueContenido}>{children}</View>
    </View>
  );

  const Campo = ({ label, value, full }: any) => (
    <View style={[styles.campo, full ? { width: '100%' } : { width: '48%' }]}>
      <Text style={styles.labelApp}>{label}</Text>
      <Text style={[styles.valueApp, mostrarVal(value) === "NO" && { color: '#ef4444' }]}>
        {mostrarVal(value)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.btnNav} onPress={onClose}>
          <Ionicons name="close-circle" size={30} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>EXPEDIENTE</Text>
        <TouchableOpacity onPress={generarPDF}>
          <FontAwesome5 name="file-pdf" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.central}>
          
          <Bloque num="1" titulo="Datos Personales">
            <Campo label="Nombre" value={alumno.nombre} full />
            <Campo label="Edad" value={alumno.datosFisicos?.edad} />
            <Campo label="Peso" value={alumno.datosFisicos?.peso} />
            <Campo label="Estatura" value={alumno.datosFisicos?.altura} />
            <Campo label="Teléfono" value={alumno.telefono} />
          </Bloque>

          <Bloque num="2" titulo="Medidas Corporales">
            <View style={styles.grid}>
              <Campo label="Cuello" value={alumno.medidas?.cuello} />
              <Campo label="Pecho" value={alumno.medidas?.pecho} />
              <Campo label="Cintura" value={alumno.medidas?.cintura} />
              <Campo label="Cadera" value={alumno.medidas?.cadera} />
              <Campo label="Brazo R" value={alumno.medidas?.brazoR} />
              <Campo label="Brazo F" value={alumno.medidas?.brazoF} />
              <Campo label="Muslo" value={alumno.medidas?.muslo} />
              <Campo label="Pierna" value={alumno.medidas?.pierna} />
            </View>
          </Bloque>

          <Bloque num="4" titulo="Salud">
            <Campo label="Enfermedades" value={alumno.salud?.enfPers} full />
            <Campo label="Lesiones" value={alumno.salud?.detalleLesion} full />
            <Campo label="Cirugías" value={alumno.salud?.detalleOperacion} full />
          </Bloque>

          <Bloque num="5" titulo="Estilo de Vida">
            <Campo label="Vigorosa" value={alumno.ipaq?.vDias} />
            <Campo label="Moderada" value={alumno.ipaq?.mDias} />
            <Campo label="Caminata" value={alumno.ipaq?.cDias} />
            <Campo label="Horas Sueño" value={alumno.ipaq?.horasSueno} />
            <Campo label="Horas Sentado" value={alumno.ipaq?.sentado} />
          </Bloque>

          <Bloque num="7" titulo="Nutrición">
            <Campo label="Objetivo" value={alumno.nutricion?.objetivo} full />
            <Campo label="Alcohol" value={alumno.nutricion?.alcohol} />
            <Campo label="Sustancias" value={alumno.nutricion?.sust} />
          </Bloque>

          <Bloque num="9" titulo="Firma Digital">
            <View style={styles.firmaContainer}>
              <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
            </View>
          </Bloque>

          <TouchableOpacity style={styles.btnAprobar} onPress={onAccept}>
            <Text style={styles.btnAprobarTxt}>ACEPTAR ALUMNO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnNav: { padding: 5 },
  scroll: { paddingBottom: 50 },
  central: { width: width > 800 ? 800 : '90%', alignSelf: 'center' },
  bloque: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 3 },
  bloqueTitulo: { fontSize: 13, fontWeight: 'bold', color: '#3b82f6', marginBottom: 15 },
  bloqueContenido: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  campo: { marginBottom: 15 },
  labelApp: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  valueApp: { fontSize: 15, color: '#1e293b', fontWeight: '700', marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  firmaContainer: { width: '100%', height: 150, backgroundColor: '#f1f5f9', borderRadius: 15, justifyContent: 'center' },
  firmaImg: { width: '100%', height: '100%' },
  btnAprobar: { backgroundColor: '#10b981', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  btnAprobarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});