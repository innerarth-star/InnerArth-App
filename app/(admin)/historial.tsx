import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  // Planes estáticos por ahora (puedes luego traerlos de Firebase)
  const planes = [
    { id: '1', titulo: 'Plan 1', fecha: 'Reciente' },
    { id: '2', titulo: 'Plan 2', fecha: 'Anterior' },
    { id: '3', titulo: 'Plan 3', fecha: 'Histórico' },
  ];

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAlumno(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
  }, [id]);

  // LÓGICA DE CÁLCULO (Mifflin-St Jeor + METs)
  const calcularMetricas = () => {
    if (!alumno) return null;

    const { edad, peso, estatura, sexo, actividadFisica } = alumno;
    // Asumimos que actividadFisica contiene el valor MET o factor de actividad
    const factorActividad = actividadFisica || 1.2; 

    // 1. Tasa Metabólica Basal (TMB)
    let tmb = (10 * peso) + (6.25 * estatura) - (5 * edad);
    tmb = sexo === 'hombre' ? tmb + 5 : tmb - 161;

    // 2. Gasto Energético Total (GET)
    const get = tmb * factorActividad;

    // 3. Ajuste por Objetivo (Déficit -500 o Superávit +300-500)
    const objetivo = alumno.nutricion?.objetivo?.toLowerCase();
    let caloriasObjetivo = get;
    let tipoPlan = "Mantenimiento";

    if (objetivo?.includes('perder') || objetivo?.includes('definicion')) {
      caloriasObjetivo = get - 500;
      tipoPlan = "Déficit Calórico";
    } else if (objetivo?.includes('ganar') || objetivo?.includes('volumen')) {
      caloriasObjetivo = get + 400;
      tipoPlan = "Superávit Calórico";
    }

    return {
      tmb: Math.round(tmb),
      get: Math.round(get),
      final: Math.round(caloriasObjetivo),
      tipoPlan
    };
  };

  const metricas = calcularMetricas();

  if (cargando) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header con retroceso */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </Pressable>
        <Text style={styles.headerTitle}>{nombre}</Text>
      </View>

      {/* Resumen Metabólico */}
      {metricas && (
        <View style={styles.metricsCard}>
          <Text style={styles.cardTitle}>Análisis Metabólico</Text>
          <View style={styles.row}>
            <View style={styles.metricItem}>
              <Text style={styles.label}>TMB (Basal)</Text>
              <Text style={styles.value}>{metricas.tmb} kcal</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.label}>GET (Total)</Text>
              <Text style={styles.value}>{metricas.get} kcal</Text>
            </View>
          </View>
          <View style={[styles.resultBox, { backgroundColor: metricas.tipoPlan.includes('Déficit') ? '#fee2e2' : '#dcfce7' }]}>
            <Text style={styles.resultLabel}>Calorías Objetivo ({metricas.tipoPlan}):</Text>
            <Text style={styles.resultValue}>{metricas.final} kcal/día</Text>
          </View>
        </View>
      )}

      {/* Listado de Planes (Carpetas) */}
      <Text style={styles.sectionTitle}>Planes de Alimentación</Text>
      {planes.map((plan) => (
        <Pressable 
          key={plan.id} 
          style={styles.folderCard}
          onPress={() => Alert.alert("Próximamente", "Aquí abriremos el editor del " + plan.titulo)}
        >
          <FontAwesome5 name="folder" size={24} color="#3b82f6" />
          <View style={styles.folderInfo}>
            <Text style={styles.folderTitle}>{plan.titulo}</Text>
            <Text style={styles.folderSub}>{plan.fecha}</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  header: { 
    width: '100%', 
    maxWidth: 800, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  metricsCard: { 
    width: '90%', 
    maxWidth: 760, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricItem: { alignItems: 'center', flex: 1 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 5 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  resultBox: { padding: 15, borderRadius: 12, alignItems: 'center' },
  resultLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  resultValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 5 },
  sectionTitle: { width: '90%', maxWidth: 760, fontSize: 18, fontWeight: 'bold', marginTop: 30, marginBottom: 15, color: '#1e293b' },
  folderCard: { 
    width: '90%', 
    maxWidth: 760, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  folderInfo: { flex: 1, marginLeft: 15 },
  folderTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  folderSub: { fontSize: 12, color: '#94a3b8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});