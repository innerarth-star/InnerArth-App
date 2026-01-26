import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, onSnapshot, updateDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Estados para Edición de Macros
  const [gProteina, setGProteina] = useState(2.0); // g por kg
  const [gGrasa, setGGrasa] = useState(0.8);    // g por kg

  useEffect(() => {
    if (!planId || !alumnoId) return;

    // 1. Obtener datos del alumno (necesitamos el peso)
    const getAlumno = async () => {
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) setAlumno(aSnap.data());
    };

    // 2. Obtener datos del plan
    const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPlanData(data);
        if (data.gProteina) setGProteina(data.gProteina);
        if (data.gGrasa) setGGrasa(data.gGrasa);
      }
      setCargando(false);
    });

    getAlumno();
    return () => unsubPlan();
  }, [planId, alumnoId]);

  // CALCULO DE MACROS EN TIEMPO REAL
  const macros = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalTotales = planData.caloriasMeta || 2000;

    const totalProteinaGrams = Math.round(peso * gProteina);
    const totalGrasaGrams = Math.round(peso * gGrasa);
    
    const kcalProteina = totalProteinaGrams * 4;
    const kcalGrasa = totalGrasaGrams * 9;
    
    const kcalRestantes = kcalTotales - (kcalProteina + kcalGrasa);
    const totalCarboGrams = Math.max(0, Math.round(kcalRestantes / 4));

    return {
      proteina: totalProteinaGrams,
      grasa: totalGrasaGrams,
      carbo: totalCarboGrams,
      kcalTotales
    };
  }, [alumno, planData, gProteina, gGrasa]);

  const guardarMacros = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        gProteina,
        gGrasa,
        macrosFinales: macros
      });
      Alert.alert("Éxito", "Distribución de macros guardada");
    } catch (e) { console.error(e); }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      {/* Header con navegación corregida */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>{nombreAlumno}</Text>
          <Text style={styles.headerSub}>Meta: {planData?.caloriasMeta} kcal</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('dieta')} style={[styles.tab, tab === 'dieta' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'dieta' && styles.tabTextActive]}>DIETA (MACROS)</Text>
        </Pressable>
        <Pressable onPress={() => setTab('entreno')} style={[styles.tab, tab === 'entreno' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'entreno' && styles.tabTextActive]}>ENTRENO</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'dieta' ? (
          <View>
            <View style={styles.macroCard}>
              <Text style={styles.cardTitle}>Distribución de Macros</Text>
              
              {/* Selector Proteína */}
              <Text style={styles.label}>Proteína: {gProteina} g/kg</Text>
              <View style={styles.row}>
                {[1.5, 1.8, 2.0, 2.2, 2.5].map(v => (
                  <Pressable key={v} onPress={() => setGProteina(v)} style={[styles.chip, gProteina === v && styles.chipProt]}>
                    <Text style={[styles.chipText, gProteina === v && {color: '#fff'}]}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Selector Grasa */}
              <Text style={[styles.label, {marginTop: 20}]}>Grasas: {gGrasa} g/kg</Text>
              <View style={styles.row}>
                {[0.5, 0.7, 0.8, 1.0, 1.2].map(v => (
                  <Pressable key={v} onPress={() => setGGrasa(v)} style={[styles.chip, gGrasa === v && styles.chipGra]}>
                    <Text style={[styles.chipText, gGrasa === v && {color: '#fff'}]}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Resultado Final */}
              <View style={styles.macrosResult}>
                <View style={styles.macroBox}><Text style={styles.mVal}>{macros?.proteina}g</Text><Text style={styles.mLab}>PROT</Text></View>
                <View style={styles.macroBox}><Text style={styles.mVal}>{macros?.grasa}g</Text><Text style={styles.mLab}>GRASA</Text></View>
                <View style={styles.macroBox}><Text style={styles.mVal}>{macros?.carbo}g</Text><Text style={styles.mLab}>HC</Text></View>
              </View>

              <Pressable style={styles.btnSave} onPress={guardarMacros}>
                <Text style={styles.btnSaveText}>FIJAR MACROS</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}><Text>Sección de Entrenamiento en construcción...</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  backBtn: { padding: 10, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#3b82f6', fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  scroll: { padding: 20 },
  macroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  chipProt: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipGra: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  macrosResult: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  macroBox: { alignItems: 'center' },
  mVal: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  mLab: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { padding: 40, alignItems: 'center' }
});