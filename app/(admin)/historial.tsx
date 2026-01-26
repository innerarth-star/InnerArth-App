import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // ESTADOS DE CONTROL MANUAL (COACH)
  const [modo, setModo] = useState<'mantenimiento' | 'deficit' | 'superavit'>('mantenimiento');
  const [ajusteCalorico, setAjusteCalorico] = useState(300); 
  const [factorManual, setFactorManual] = useState(1.2); // Default Sedentario

  const router = useRouter();
  const rangosAjuste = [100, 200, 300, 400, 500];
  
  const nivelesActividad = [
    { label: 'Sedentario', valor: 1.2, desc: 'Poca actividad' },
    { label: 'Ligero', valor: 1.375, desc: '1-3 días/sem' },
    { label: 'Moderado', valor: 1.55, desc: '3-5 días/sem' },
    { label: 'Fuerte', valor: 1.725, desc: '6-7 días/sem' },
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAlumno(data);
          
          // Pre-selección de modo por texto (opcional)
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

    let peso = parseFloat(alumno.datosFisicos.peso || 0);
    let altura = parseFloat(alumno.datosFisicos.altura || 0);
    let edad = parseInt(alumno.datosFisicos.edad || 0);
    const genero = (alumno.datosFisicos.genero || 'hombre').toLowerCase();

    if (altura > 0 && altura < 3) altura = altura * 100;
    if (peso <= 0 || altura <= 0 || edad <= 0) return null;

    // TMB Mifflin-St Jeor
    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;

    // USAMOS EL FACTOR SELECCIONADO POR EL COACH
    const get = tmb * factorManual;
    
    let final = get;
    if (modo === 'deficit') final = get - ajusteCalorico;
    if (modo === 'superavit') final = get + ajusteCalorico;

    return { 
      tmb: Math.round(tmb), 
      get: Math.round(get), 
      final: Math.round(final)
    };
  }, [alumno, ajusteCalorico, modo, factorManual]);

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
        factorActividad: factorManual,
        caloriasMeta: metricas.final
      });
      Alert.alert("Éxito", "Plan generado correctamente");
    } catch (e) { Alert.alert("Error", "No se guardó el plan"); }
  };

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
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              
              {/* SELECTOR DE MODO */}
              <View style={styles.row}>
                <Pressable onPress={() => setModo('deficit')} style={[styles.modeBtn, modo === 'deficit' && {backgroundColor: '#ef4444'}]}>
                  <Text style={styles.btnText}>Déficit</Text>
                </Pressable>
                <Pressable onPress={() => setModo('mantenimiento')} style={[styles.modeBtn, modo === 'mantenimiento' && {backgroundColor: '#64748b'}]}>
                  <Text style={styles.btnText}>Mantenimiento</Text>
                </Pressable>
                <Pressable onPress={() => setModo('superavit')} style={[styles.modeBtn, modo === 'superavit' && {backgroundColor: '#10b981'}]}>
                  <Text style={styles.btnText}>Superávit</Text>
                </Pressable>
              </View>

              <Text style={styles.subTitle}>Factor de Actividad Manual:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollFactor}>
                {nivelesActividad.map((n) => (
                  <Pressable key={n.valor} onPress={() => setFactorManual(n.valor)} style={[styles.factorCard, factorManual === n.valor && styles.factorCardActive]}>
                    <Text style={[styles.factorLabel, factorManual === n.valor && {color:'#fff'}]}>{n.label}</Text>
                    <Text style={[styles.factorVal, factorManual === n.valor && {color:'#fff'}]}>x{n.valor}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.subTitle}>Margen de Ajuste (Kcal):</Text>
              <View style={styles.row}>
                {rangosAjuste.map((v) => (
                  <Pressable key={v} onPress={() => setAjusteCalorico(v)} style={[styles.chip, ajusteCalorico === v && styles.chipActive]}>
                    <Text style={[styles.chipText, ajusteCalorico === v && {color:'#fff'}]}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />
              <View style={styles.miniRow}>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.tmb}</Text><Text style={styles.miniLab}>Basal</Text></View>
                <View style={styles.miniItem}><Text style={styles.miniVal}>{metricas.get}</Text><Text style={styles.miniLab}>Mantenimiento</Text></View>
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}><Text>Faltan datos físicos del alumno.</Text></View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <Text style={styles.btnAddText}>+ CREAR PLAN</Text>
            </Pressable>
          </View>

          {planes.map((p) => (
            <View key={p.id} style={styles.folderCard}>
              <Pressable style={styles.folderMain} onPress={() => router.push({ pathname: '/(admin)/editorPlan' as any, params: { planId: p.id, alumnoId: id, nombreAlumno: nombre } })}>
                <FontAwesome5 name="folder" size={20} color="#3b82f6" />
                <View style={styles.folderInfo}>
                   <Text style={styles.folderTitle}>{p.titulo}</Text>
                   <Text style={styles.folderSub}>{p.modo?.toUpperCase()} | {p.caloriasMeta} kcal</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
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
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 25, alignItems: 'center' },
  caloriesMain: { color: '#fff', fontSize: 58, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#334155' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  subTitle: { color: '#94a3b8', fontSize: 11, marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
  scrollFactor: { width: '100%', marginBottom: 10 },
  factorCard: { backgroundColor: '#334155', padding: 12, borderRadius: 12, marginRight: 10, width: 100, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  factorCardActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  factorLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  factorVal: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, backgroundColor: '#334155' },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  miniRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  miniItem: { alignItems: 'center' },
  miniVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  miniLab: { color: '#64748b', fontSize: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold' },
  folderCard: { backgroundColor: '#fff', borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  folderMain: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  folderInfo: { marginLeft: 15, flex: 1 },
  folderTitle: { fontWeight: 'bold' },
  folderSub: { fontSize: 11, color: '#94a3b8' },
  errorCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});