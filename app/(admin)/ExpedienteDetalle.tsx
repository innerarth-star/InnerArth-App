import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ExpedienteDetalle({ alumno, onClose, onAccept }: any) {
  if (!alumno) return null;

  // FUNCIÓN DE PDF CORREGIDA Y VINCULADA
  const generarPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #1e293b; }
            h1 { color: #3b82f6; text-align: center; border-bottom: 2px solid #3b82f6; }
            .section { margin-top: 20px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .title { font-weight: bold; background: #f1f5f9; padding: 5px; }
            .row { margin: 5px 0; display: flex; justify-content: space-between; border-bottom: 0.5px solid #eee; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; }
            .value { color: #1e293b; font-size: 13px; }
            img { width: 200px; display: block; margin: 20px auto; }
          </style>
        </head>
        <body>
          <h1>EXPEDIENTE DE ${alumno.nombre?.toUpperCase()}</h1>
          <div class="section">
            <div class="title">DATOS PERSONALES</div>
            <div class="row"><span class="label">Email:</span><span class="value">${alumno.email}</span></div>
            <div class="row"><span class="label">Teléfono:</span><span class="value">${alumno.telefono || 'N/A'}</span></div>
          </div>
          <div class="section">
            <div class="title">MEDIDAS</div>
            <div class="row"><span>Peso: ${alumno.datosFisicos?.peso}kg</span><span>Altura: ${alumno.datosFisicos?.altura}cm</span></div>
          </div>
          <p style="text-align: center; margin-top: 40px;">FIRMA DEL ALUMNO</p>
          <img src="${alumno.firma}" />
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el archivo PDF");
    }
  };

  // Componente de Bloque con información TOTALMENTE VISIBLE (No minimizada)
  const BloqueInformativo = ({ num, titulo, icono, color, children }: any) => (
    <View style={styles.bloqueContainer}>
      <View style={[styles.bloqueHeader, { borderLeftColor: color }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.circulo, { backgroundColor: color }]}>
            <Text style={styles.circuloText}>{num}</Text>
          </View>
          <MaterialCommunityIcons name={icono} size={20} color={color} />
          <Text style={styles.bloqueTitulo}>{titulo}</Text>
        </View>
      </View>
      <View style={styles.bloqueContenido}>
        {children}
      </View>
    </View>
  );

  const Campo = ({ label, value }: any) => (
    <View style={styles.campoRow}>
      <Text style={styles.campoLabel}>{label}:</Text>
      <Text style={styles.campoValue}>{value || '---'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* NAVBAR SUPERIOR CON REGRESAR FLUIDO */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.btnNav} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
          <Text style={styles.btnNavText}>Regresar</Text>
        </TouchableOpacity>
        
        <Text style={styles.navTitle}>Detalles</Text>

        <TouchableOpacity style={styles.btnNav} onPress={generarPDF}>
          <FontAwesome5 name="file-pdf" size={20} color="#ef4444" />
          <Text style={[styles.btnNavText, { color: '#ef4444' }]}>PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.centralizador}>
          
          <BloqueInformativo num="1" titulo="IDENTIFICACIÓN" icono="account-details" color="#3b82f6">
            <Campo label="Nombre" value={alumno.nombre} />
            <Campo label="Email" value={alumno.email} />
            <Campo label="WhatsApp" value={alumno.telefono} />
          </BloqueInformativo>

          <BloqueInformativo num="2" titulo="COMPOSICIÓN FISICA" icono="human-male-height" color="#10b981">
            <View style={styles.grid}>
              <Campo label="Peso" value={`${alumno.datosFisicos?.peso} kg`} />
              <Campo label="Altura" value={`${alumno.datosFisicos?.altura} cm`} />
              <Campo label="Edad" value={`${alumno.datosFisicos?.edad} años`} />
            </View>
            <View style={styles.grid}>
              <Campo label="Cintura" value={alumno.medidas?.cintura} />
              <Campo label="Cadera" value={alumno.medidas?.cadera} />
              <Campo label="Pecho" value={alumno.medidas?.pecho} />
            </View>
          </BloqueInformativo>

          <BloqueInformativo num="3" titulo="SALUD Y PAR-Q" icono="heart-pulse" color="#ef4444">
            <Campo label="Enfermedades" value={alumno.salud?.enfPers?.join(', ')} />
            <Campo label="¿Dolor Pecho?" value={alumno.salud?.parq?.p2} />
            <Campo label="¿Lesiones?" value={alumno.salud?.detalleLesion} />
          </BloqueInformativo>

          <BloqueInformativo num="4" titulo="IPAQ (ACTIVIDAD)" icono="walk" color="#f59e0b">
            <Campo label="Vigorosa" value={`${alumno.ipaq?.vDias} días / ${alumno.ipaq?.vMin} min`} />
            <Campo label="Horas sentado" value={alumno.ipaq?.sentado} />
          </BloqueInformativo>

          <BloqueInformativo num="5" titulo="ALIMENTACIÓN" icono="food-apple" color="#8b5cf6">
            <Campo label="Objetivo" value={alumno.nutricion?.objetivo} />
            <Campo label="Entrenamientos" value={alumno.nutricion?.entrenos} />
            <Campo label="Alergias" value={alumno.nutricion?.alergias} />
          </BloqueInformativo>

          <BloqueInformativo num="6" titulo="FIRMA" icono="fountain-pen-tip" color="#1e293b">
            {alumno.firma ? (
              <Image source={{ uri: alumno.firma }} style={styles.firmaImg} resizeMode="contain" />
            ) : <Text>No hay firma</Text>}
          </BloqueInformativo>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnAceptar} onPress={onAccept}>
              <Text style={styles.btnAceptarText}>APROBAR REGISTRO</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  btnNav: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnNavText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  navTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  scroll: { paddingVertical: 20 },
  centralizador: { width: width > 800 ? 800 : '95%', alignSelf: 'center' },
  bloqueContainer: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  bloqueHeader: { flexDirection: 'row', padding: 15, borderLeftWidth: 5, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circulo: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  circuloText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bloqueTitulo: { fontWeight: 'bold', color: '#334155', fontSize: 14 },
  bloqueContenido: { padding: 15, paddingTop: 0 },
  campoRow: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4 },
  campoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  campoValue: { fontSize: 14, color: '#1e293b', fontWeight: '600', marginTop: 2 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  firmaImg: { width: '100%', height: 120, backgroundColor: '#fdfdfd', borderRadius: 8 },
  footer: { marginTop: 20, marginBottom: 40 },
  btnAceptar: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnAceptarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});