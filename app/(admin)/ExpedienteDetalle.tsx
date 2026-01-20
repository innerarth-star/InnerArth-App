import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ExpedienteDetalle({ route, navigation }: any) {
  // Recibimos el cliente desde la navegación
  const { cliente } = route.params;

  const Seccion = ({ title, icon, color, children }: any) => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { borderLeftColor: color }]}>
        <FontAwesome5 name={icon} size={18} color={color} style={{ marginRight: 10 }} />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  const Dato = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.datoRow}>
      <Text style={styles.datoLabel}>{label}:</Text>
      <Text style={styles.datoValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Encabezado Principal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
          <FontAwesome5 name="arrow-left" size={16} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          <Text style={styles.email}>{cliente.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnPdf} onPress={() => alert('Generando PDF...')}>
        <FontAwesome5 name="file-pdf" size={16} color="#fff" />
        <Text style={styles.btnPdfText}>Exportar a PDF</Text>
      </TouchableOpacity>

      {/* BLOQUE 1: DATOS FÍSICOS */}
      <Seccion title="Composición Corporal" icon="weight" color="#3b82f6">
        <View style={styles.grid}>
          <Dato label="Edad" value={cliente.datosFisicos?.edad} />
          <Dato label="Género" value={cliente.datosFisicos?.genero} />
          <Dato label="Peso" value={`${cliente.datosFisicos?.peso} kg`} />
          <Dato label="Altura" value={`${cliente.datosFisicos?.altura} cm`} />
        </View>
      </Seccion>

      {/* BLOQUE 2: MEDIDAS (Para el PDF) */}
      <Seccion title="Medidas (CM)" icon="ruler-combined" color="#10b981">
        <View style={styles.grid}>
          <Dato label="Cuello" value={cliente.medidas?.cuello} />
          <Dato label="Pecho" value={cliente.medidas?.pecho} />
          <Dato label="Cintura" value={cliente.medidas?.cintura} />
          <Dato label="Cadera" value={cliente.medidas?.cadera} />
          <Dato label="Brazo R." value={cliente.medidas?.brazoR} />
          <Dato label="Brazo F." value={cliente.medidas?.brazoF} />
          <Dato label="Muslo" value={cliente.medidas?.muslo} />
          <Dato label="Pierna" value={cliente.medidas?.pierna} />
        </View>
      </Seccion>

      {/* BLOQUE 3: SALUD Y ALERTAS (Crítico) */}
      <Seccion title="Historial de Salud" icon="heartbeat" color="#ef4444">
        <Dato label="Lesiones" value={cliente.salud?.lesion === 'si' ? cliente.salud.detalleLesion : 'No'} />
        <Dato label="Operaciones" value={cliente.salud?.operacion === 'si' ? cliente.salud.detalleOperacion : 'No'} />
        <Dato label="Enf. Propias" value={cliente.salud?.enfPers?.join(', ')} />
        <Dato label="Frec. Cardíaca" value={cliente.salud?.frecuenciaCardiaca} />
      </Seccion>

      {/* BLOQUE 4: NUTRICIÓN */}
      <Seccion title="Nutrición y Objetivos" icon="utensils" color="#f59e0b">
        <Dato label="Objetivo" value={cliente.nutricion?.objetivo} />
        <Dato label="Comidas Deseadas" value={cliente.nutricion?.comidasDes} />
        <Dato label="Días Entrenamiento" value={cliente.nutricion?.entrenos} />
        <Text style={styles.labelArea}>Descripción dieta actual:</Text>
        <Text style={styles.textArea}>{cliente.nutricion?.descAct}</Text>
      </Seccion>

      {/* BLOQUE 5: FIRMA */}
      <Seccion title="Consentimiento y Firma" icon="pen-fancy" color="#1e293b">
        {cliente.firma?.includes('data:image') ? (
          <Image source={{ uri: cliente.firma }} style={styles.firmaImg} resizeMode="contain" />
        ) : (
          <Text style={styles.firmaTexto}>{cliente.firma}</Text>
        )}
      </Seccion>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 15, maxWidth: 800, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  btnBack: { padding: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  nombre: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 14, color: '#64748b' },
  btnPdf: { backgroundColor: '#1e293b', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 20, gap: 10 },
  btnPdfText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fdfdfd', borderLeftWidth: 4 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardBody: { padding: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  datoRow: { width: '50%', marginBottom: 10, paddingRight: 5 },
  datoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  datoValue: { fontSize: 14, color: '#334155', fontWeight: '600' },
  labelArea: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', marginTop: 10, textTransform: 'uppercase' },
  textArea: { fontSize: 14, color: '#334155', marginTop: 5, fontStyle: 'italic', lineHeight: 20 },
  firmaImg: { width: '100%', height: 100, marginTop: 10, backgroundColor: '#f1f5f9' },
  firmaTexto: { fontSize: 20, fontStyle: 'italic', textAlign: 'center', marginTop: 10, color: '#1e293b' }
});