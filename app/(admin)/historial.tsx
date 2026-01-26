import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [modo, setModo] = useState<'mantenimiento' | 'deficit' | 'superavit'>('mantenimiento');
  const [ajusteCalorico, setAjusteCalorico] = useState(300); 

  const router = useRouter();
  const rangosAjuste = [100, 200, 300, 400, 500];

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAlumno(data);
          const obj = (data.nutricion?.objetivo || '').toLowerCase();
          if (obj.includes('perder') || obj.includes('bajar')) setModo('deficit');
          else if (obj.includes('ganar') || obj.includes('subir')) setModo('superavit');
        }
        const q = query(collection(db, "alumnos_activos", id as string, "planes"), orderBy("numero", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
          const lista: any[] = [];
          snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
          setPlanes(lista);
          setCargando(false);
        });
        return unsub;
      } catch (e) { setCargando(false); }
    };
    cargarDatos();
  }, [id]);

  const metricas = useMemo(() => {
    if (!alumno || !alumno.datosFisicos) return null;

    let peso = parseFloat(alumno.datosFisicos.weight || alumno.datosFisicos.peso || 0);
    let altura = parseFloat(alumno.datosFisicos.height || alumno.datosFisicos.altura || 0);
    let edad = parseInt(alumno.datosFisicos.age || alumno.datosFisicos.edad || 0);
    const genero = (alumno.datosFisicos.gender || alumno.datosFisicos.genero || 'hombre').toLowerCase();

    if (altura > 0 && altura < 3) altura = altura * 100;
    if (peso <= 0 || altura <= 0 || edad <= 0) return null;

    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;

    const vDias = parseInt(alumno.ipaq?.vDias) || 0;
    const mDias = parseInt(alumno.ipaq?.mDias) || 0;
    let factor = 1.2;
    if (vDias >= 3) factor = 1.725;
    else if (vDias >= 1 || mDias >= 3) factor = 1.55;
    else if (mDias >= 1) factor = 1.375;

    const get = tmb * factor;
    
    let final = get;
    if (modo === 'deficit') final = get - ajusteCalorico;
    if (modo === 'superavit') final = get + ajusteCalorico;

    return { 
      tmb: Math.round(tmb), 
      get: Math.round(get), 
      final: Math.round(final)
    };
  }, [alumno, ajusteCalorico, modo]);

  const crearNuevoPlan = async () => {
    if (!id || !metricas) return;
    try {
      const num = planes.length + 1;
      await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${num}`,
        numero: num,
        fechaCreacion: serverTimestamp(),
        modo,
        ajuste: ajusteCalorico,
        caloriasMeta: metricas.final
      });
    } catch (e) { Alert.alert("Error", "No se guardó el plan"); }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>{nombre}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {metricas ? (
            <View style={styles.metricsCard}>
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              
              <View style={styles.modeRow}>
                <Pressable onPress={() => setModo('deficit')} style={[styles.modeBtn, modo === 'deficit' && {backgroundColor: '#ef4444'}]}>
                  <Text style={styles.modeBtnText}>Déficit</Text>
                </Pressable>
                <Pressable onPress={() => setModo('mantenimiento')} style={[styles.modeBtn, modo === 'mantenimiento' && {backgroundColor: '#64748b'}]}>
                  <Text style={styles.modeBtnText}>Mantenimiento</Text>
                </Pressable>
                <Pressable onPress={() => setModo('superavit')} style={[styles.modeBtn, modo === 'superavit' && {backgroundColor: '#10b981'}]}>
                  <Text style={styles.modeBtnText}>Superávit</Text>
                </Pressable>
              </View>

              <Text style={styles.selectorTitle}>Ajustar Margen Manual (Kcal):</Text>
              <View style={styles.selectorRow}>
                {rangosAjuste.map((v) => (
                  <Pressable key={v} onPress={() => setAjusteCalorico(v)} style={[styles.chip, ajusteCalorico === v && styles.chipActive]}>
                    <Text style={[styles.chipText, ajusteCalorico === v && { color: '#fff' }]}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />
              <View style={styles.miniRow}>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.tmb}</Text><Text style={styles.miniLab}>TMB</Text></View>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.get}</Text><Text style={styles.miniLab}>GET</Text></View>
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}><Text>Error: Revisa peso/altura en Firebase</Text></View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <Text style={styles.btnAddText}>+ CREAR PLAN</Text>
            </Pressable>
          </View>

          {planes.map((p) => (
            <View key={p.id} style={styles.folderCard}>
              <Pressable style={styles.folderMain} onPress={() => router.push({ pathname: '/editorPlan' as any, params: { planId: p.id, alumnoId: id, nombreAlumno: nombre } })}>
                <FontAwesome5 name="folder" size={20} color="#3b82f6" />
                <View style={styles.folderInfo}>
                   <Text style={styles.folderTitle}>{p.titulo}</Text>
                   <Text style={styles.folderSub}>{p.modo?.toUpperCase()} | {p.caloriasMeta} kcal</Text>
                </View>
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
  mainContainer: { flex: 1, width: '100%', maxWidth: 800 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { padding: 10, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 25, alignItems: 'center' },
  caloriesMain: { color: '#fff', fontSize: 58, fontWeight: 'bold', marginBottom: 20 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#334155' },
  modeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  selectorTitle: { color: '#94a3b8', fontSize: 11, marginBottom: 10 },
  selectorRow: { flexDirection: 'row', gap: 8 },
  chip: { padding: 10, borderRadius: 8, backgroundColor: '#334155' },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  miniRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  miniItem: { alignItems: 'center' },
  miniVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  miniLab: { color: '#64748b', fontSize: 10 },
  errorCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold' },
  folderCard: { backgroundColor: '#fff', borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  folderMain: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  folderInfo: { marginLeft: 15 },
  folderTitle: { fontWeight: 'bold' },
  folderSub: { fontSize: 11, color: '#94a3b8' }
});