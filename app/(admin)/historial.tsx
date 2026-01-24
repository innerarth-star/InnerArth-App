import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ajusteCalorico, setAjusteCalorico] = useState(300);
  const router = useRouter();

  const rangosAjuste = [100, 200, 300, 400, 500];

  useEffect(() => {
    const obtenerTodo = async () => {
      if (!id) return;
      setCargando(true);
      try {
        // 1. Obtener expediente del alumno
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("DATOS RECUPERADOS:", data);
          setAlumno(data);
        }

        // 2. Suscribirse a planes
        const q = query(collection(db, "alumnos_activos", id as string, "planes"), orderBy("numero", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
          const lista: any[] = [];
          snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
          setPlanes(lista);
          setCargando(false);
        });

        return unsub;
      } catch (e) {
        console.error("Error inicial:", e);
        setCargando(false);
      }
    };

    obtenerTodo();
  }, [id]);

  const calcularMetricas = () => {
    if (!alumno) return null;

    // BUSQUEDA AGRESIVA DE DATOS (Mapeo de tu Index)
    const peso = parseFloat(alumno.datosFisicos?.peso || alumno.peso || 0);
    const altura = parseFloat(alumno.datosFisicos?.altura || alumno.altura || 0);
    const edad = parseInt(alumno.datosFisicos?.edad || alumno.edad || 0);
    const genero = (alumno.datosFisicos?.genero || alumno.genero || 'hombre').toLowerCase();
    
    if (!peso || !altura || !edad) return null;

    // Lógica IPAQ (Actividad)
    const vDias = parseInt(alumno.ipaq?.vDias || 0);
    const mDias = parseInt(alumno.ipaq?.mDias || 0);
    let factor = 1.2; 
    if (vDias >= 3) factor = 1.725; 
    else if (vDias > 0 || mDias >= 3) factor = 1.55; 
    else if (mDias > 0) factor = 1.375;

    // Mifflin-St Jeor
    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;
    const get = tmb * factor;
    
    const obj = (alumno.nutricion?.objetivo || '').toLowerCase();
    let final = get;
    let tipo = "Mantenimiento";

    if (obj.includes('perder') || obj.includes('definicion')) {
      final = get - ajusteCalorico;
      tipo = `Déficit (-${ajusteCalorico})`;
    } else if (obj.includes('ganar') || obj.includes('volumen')) {
      final = get + ajusteCalorico;
      tipo = `Superávit (+${ajusteCalorico})`;
    }

    return { tmb: Math.round(tmb), get: Math.round(get), final: Math.round(final), tipo };
  };

  const crearNuevoPlan = async () => {
    try {
      const num = planes.length > 0 ? Math.max(...planes.map(p => p.numero)) + 1 : 1;
      await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${num}`,
        numero: num,
        fechaCreacion: serverTimestamp(),
        ajusteAplicado: ajusteCalorico
      });
      console.log("Plan creado con éxito");
    } catch (e) {
      console.error("Error creando plan:", e);
      Alert.alert("Error", "No se pudo crear el plan.");
    }
  };

  const eliminarPlan = async (pId: string) => {
    try {
      await deleteDoc(doc(db, "alumnos_activos", id as string, "planes", pId));
    } catch (e) { console.error(e); }
  };

  const metricas = calcularMetricas();

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>{nombre}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {metricas ? (
            <View style={styles.metricsCard}>
              <Text style={styles.cardLabel}>OBJETIVO: {metricas.tipo}</Text>
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              <View style={styles.selectorRow}>
                {rangosAjuste.map((v) => (
                  <Pressable key={v} onPress={() => setAjusteCalorico(v)} style={[styles.chip, ajusteCalorico === v && styles.chipActive]}>
                    <Text style={[styles.chipText, ajusteCalorico === v && styles.chipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.divider} />
              <View style={styles.miniRow}>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.tmb}</Text><Text style={styles.miniLab}>Basal</Text></View>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.get}</Text><Text style={styles.miniLab}>Total</Text></View>
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>No se detectan datos de Peso o Altura.</Text>
              <Pressable style={styles.btnDebug} onPress={() => {
                console.log("ALUMNO ACTUAL:", alumno);
                alert("Data enviada a consola. Presiona F12.");
              }}>
                <Text style={{color:'#fff', fontWeight:'bold'}}>VER DATA EN CONSOLA</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <FontAwesome5 name="plus" size={12} color="#fff" />
              <Text style={styles.btnAddText}>NUEVO PLAN</Text>
            </Pressable>
          </View>

          {planes.map((plan) => (
            <View key={plan.id} style={styles.folderCard}>
              <Pressable style={styles.folderMain} onPress={() => router.push({ pathname: '/(admin)/editorPlan' as any, params: { planId: plan.id, alumnoId: id, nombreAlumno: nombre } })}>
                <FontAwesome5 name="folder" size={20} color="#3b82f6" />
                <View style={styles.folderInfo}><Text style={styles.folderTitle}>{plan.titulo}</Text></View>
                <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
              </Pressable>
              <Pressable style={styles.btnDelete} onPress={() => eliminarPlan(plan.id)}>
                <FontAwesome5 name="trash-alt" size={14} color="#ef4444" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  mainContainer: { flex: 1, width: '100%', maxWidth: 800, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 10, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 25, alignItems: 'center' },
  cardLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  caloriesMain: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
  selectorRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#475569', backgroundColor: '#334155' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  miniRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  miniItem: { alignItems: 'center' },
  miniVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  miniLab: { color: '#64748b', fontSize: 10, marginTop: 4 },
  errorCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  errorText: { color: '#64748b', textAlign: 'center' },
  btnDebug: { backgroundColor: '#334155', padding: 12, borderRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, gap: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  folderCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderRadius: 15, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  folderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
  folderInfo: { flex: 1, marginLeft: 15 },
  folderTitle: { fontWeight: 'bold' },
  btnDelete: { padding: 20, backgroundColor: '#fff5f5' }
});