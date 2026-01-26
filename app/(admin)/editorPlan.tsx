import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
// IMPORTANTE: Se agregó serverTimestamp aquí abajo
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Estados para Edición de Macros (g por kg de peso)
  const [gProteina, setGProteina] = useState(2.0);
  const [gGrasa, setGGrasa] = useState(0.8);

  useEffect(() => {
    if (!planId || !alumnoId) return;

    const cargarDatos = async () => {
      // 1. Obtener datos del alumno para sacar el peso real
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) {
        setAlumno(aSnap.data());
      }

      // 2. Escuchar cambios en el plan actual
      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPlanData(data);
          if (data.gProteina) setGProteina(data.gProteina);
          if (data.gGrasa) setGGrasa(data.gGrasa);
        }
        setCargando(false);
      });
      return unsubPlan;
    };

    cargarDatos();
  }, [planId, alumnoId]);

  // CALCULO DE MACROS EN TIEMPO REAL
  const macros = useMemo(() => {
    if (!alumno || !planData) return null;
    
    // Obtenemos el peso de los datos físicos
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalTotales = planData.caloriasMeta || 2000;

    // Cálculo: Gramos = Peso * factor (g/kg)
    const pGrams = Math.round(peso * gProteina);
    const gGrams = Math.round(peso * gGrasa);
    
    // Calorías restantes para carbohidratos
    // (Proteína = 4 kcal/g, Grasa = 9 kcal/g, Carbo = 4 kcal/g)
    const kcalRestantes = kcalTotales - (pGrams * 4 + gGrams * 9);
    const cGrams = Math.max(0, Math.round(kcalRestantes / 4));

    return { proteina: pGrams, grasa: gGrams, carbo: cGrams, total: kcalTotales };
  }, [alumno, planData, gProteina, gGrasa]);

  const guardarMacros = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        gProteina: gProteina,
        gGrasa: gGrasa,
        macrosCalculados: macros,
        fechaActualizacion: serverTimestamp()
      });
      Alert.alert("Éxito", "Distribución de macros guardada correctamente.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo conectar con la base de datos.");
    }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.container}>
      {/* Header con navegación corregida a Mis Alumnos */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{nombreAlumno}</Text>
          <Text style={styles.headerSub}>
            Frecuencia: {alumno?.nutricion?.comidas || 'N/A'} comidas/día
          </Text>
        </View>
        <View style={styles.kcalBadge}>
          <Text style={styles.kcalBadgeText}>{planData?.caloriasMeta} kcal</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('dieta')} style={[styles.tab, tab === 'dieta' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'dieta' && styles.tabTextActive]}>DIETA</Text>
        </Pressable>
        <Pressable onPress={() => setTab('entreno')} style={[styles.tab, tab === 'entreno' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'entreno' && styles.tabTextActive]}>ENTRENO</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'dieta' ? (
          <View>
            <View style={styles.macroCard}>
              <Text style={styles.cardTitle}>Configuración de Macros (g/kg)</Text>
              
              {/* Selector Proteína */}
              <Text style={styles.label}>Proteína (Recomendado 1.8 - 2.5)</Text>
              <View style={styles.row}>
                {[1.5, 1.8, 2.0, 2.2, 2.5].map(v => (
                  <Pressable key={v} onPress={() => setGProteina(v)} style={[styles.chip, gProteina === v && styles.chipActive]}>
                    <Text style={[styles.chipText, gProteina === v && styles.chipTextActive]}>{v}g</Text>
                  </Pressable>
                ))}
              </View>

              {/* Selector Grasa */}
              <Text style={[styles.label, {marginTop: 20}]}>Grasas (Recomendado 0.5 - 1.0)</Text>
              <View style={styles.row}>
                {[0.5, 0.7, 0.8, 1.0, 1.2].map(v => (
                  <Pressable key={v} onPress={() => setGGrasa(v)} style={[styles.chip, gGrasa === v && styles.chipActive]}>
                    <Text style={[styles.chipText, gGrasa === v && styles.chipTextActive]}>{v}g</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.macrosDisplay}>
                <View style={[styles.mBox, {borderBottomColor: '#3b82f6'}]}>
                   <Text style={styles.mVal}>{macros?.proteina}g</Text>
                   <Text style={styles.mLab}>PROT</Text>
                </View>
                <View style={[styles.mBox, {borderBottomColor: '#f59e0b'}]}>
                   <Text style={styles.mVal}>{macros?.grasa}g</Text>
                   <Text style={styles.mLab}>GRASA</Text>
                </View>
                <View style={[styles.mBox, {borderBottomColor: '#10b981'}]}>
                   <Text style={styles.mVal}>{macros?.carbo}g</Text>
                   <Text style={styles.mLab}>CARBS</Text>
                </View>
              </View>

              <Pressable style={styles.btnSave} onPress={guardarMacros}>
                <FontAwesome5 name="check" size={14} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.btnSaveText}>FIJAR MACROS</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}><Text>Rutina de Entrenamiento</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 10, marginRight: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 13, color: '#64748b' },
  kcalBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontWeight: 'bold', color: '#94a3b8', fontSize: 12 },
  tabTextActive: { color: '#3b82f6' },
  scroll: { padding: 20 },
  macroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },
  macrosDisplay: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  mBox: { flex: 1, alignItems: 'center', paddingVertical: 15, marginHorizontal: 5, borderRadius: 15, borderBottomWidth: 4, backgroundColor: '#f8fafc' },
  mVal: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  mLab: { fontSize: 10, color: '#94a3b8', fontWeight: '800', marginTop: 5 },
  btnSave: { backgroundColor: '#1e293b', padding: 16, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { padding: 50, alignItems: 'center' }
});