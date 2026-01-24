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
    const obtenerDatos = async () => {
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAlumno(docSnap.data());
        }
      } catch (error) { console.error(error); }
    };

    const q = query(collection(db, "alumnos_activos", id as string, "planes"), orderBy("numero", "desc"));
    const unsubPlanes = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
      setPlanes(lista);
      setCargando(false);
    });

    obtenerDatos();
    return () => unsubPlanes();
  }, [id]);

  const calcularMetricas = () => {
    if (!alumno) return null;

    // EXTRACCIÓN ROBUSTA (Busca en raíz y en datosFisicos)
    const peso = parseFloat(alumno.datosFisicos?.peso || alumno.peso || 0);
    const altura = parseFloat(alumno.datosFisicos?.altura || alumno.altura || alumno.estatura || 0);
    const edad = parseInt(alumno.datosFisicos?.edad || alumno.edad || 0);
    const genero = (alumno.datosFisicos?.genero || alumno.genero || 'hombre').toLowerCase();
    
    if (!peso || !altura || !edad) return null;

    // LÓGICA DE ACTIVIDAD BASADA EN IPAQ (Sección 5 de tu formulario)
    const vDias = parseInt(alumno.ipaq?.vDias || 0);
    const mDias = parseInt(alumno.ipaq?.mDias || 0);
    
    let factorActividad = 1.2; 
    if (vDias >= 3) factorActividad = 1.725; 
    else if (vDias > 0 || mDias >= 3) factorActividad = 1.55; 
    else if (mDias > 0) factorActividad = 1.375;

    // FÓRMULA MIFFLIN-ST JEOR
    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero.includes('mujer') ? tmb - 161 : tmb + 5;
    const get = tmb * factorActividad;
    
    const obj = (alumno.nutricion?.objetivo || alumno.objetivo || '').toLowerCase();
    let final = get;
    let tipo = "Mantenimiento";

    if (obj.includes('perder') || obj.includes('definicion') || obj.includes('bajar')) {
      final = get - ajusteCalorico;
      tipo = `Déficit (-${ajusteCalorico})`;
    } else if (obj.includes('ganar') || obj.includes('volumen') || obj.includes('subir')) {
      final = get + ajusteCalorico;
      tipo = `Superávit (+${ajusteCalorico})`;
    }

    return { tmb: Math.round(tmb), get: Math.round(get), final: Math.round(final), tipo };
  };

  const metricas = calcularMetricas();

  const crearNuevoPlan = async () => {
    try {
      const proximoNumero = planes.length > 0 ? Math.max(...planes.map(p => p.numero)) + 1 : 1;
      await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${proximoNumero}`,
        numero: proximoNumero,
        fechaCreacion: serverTimestamp(),
        ajusteAplicado: ajusteCalorico
      });
    } catch (error) { console.error(error); }
  };

  const eliminarPlan = async (pId: string) => {
    try {
      await deleteDoc(doc(db, "alumnos_activos", id as string, "planes", pId));
    } catch (error) { console.error(error); }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{nombre}</Text>
            <Text style={styles.headerSub}>Análisis Metabólico</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {metricas ? (
            <View style={styles.metricsCard}>
              <Text style={styles.cardLabel}>OBJETIVO: {metricas.tipo}</Text>
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              <Text style={styles.selectorTitle}>Ajustar margen (kcal):</Text>
              <View style={styles.selectorRow}>
                {rangosAjuste.map((valor) => (
                  <Pressable key={valor} onPress={() => setAjusteCalorico(valor)} style={[styles.chip, ajusteCalorico === valor && styles.chipActive]}>
                    <Text style={[styles.chipText, ajusteCalorico === valor && styles.chipTextActive]}>{valor}</Text>
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
              <FontAwesome5 name="exclamation-triangle" size={24} color="#f59e0b" />
              <Text style={styles.errorText}>No se detectan datos de Peso, Altura o Edad.</Text>
              <Pressable style={styles.btnDebug} onPress={() => console.log("DATA:", alumno)}>
                <Text style={{color:'#fff', fontSize:10}}>Ver Data en Consola</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes Históricos</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <FontAwesome5 name="plus" size={12} color="#fff" />
              <Text style={styles.btnAddText}>Nuevo Plan</Text>
            </Pressable>
          </View>

          {planes.map((plan) => (
            <View key={plan.id} style={styles.folderCard}>
              <Pressable style={styles.folderMain} onPress={() => router.push({ pathname: '/(admin)/editorPlan' as any, params: { planId: plan.id, alumnoId: id, nombreAlumno: nombre } })}>
                <FontAwesome5 name="folder-open" size={20} color="#3b82f6" />
                <View style={styles.folderInfo}><Text style={styles.folderTitle}>{plan.titulo}</Text><Text style={styles.folderSub}>Margen: {plan.ajusteAplicado || '300'} kcal</Text></View>
                <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
              </Pressable>
              <Pressable onPress={() => { if(Platform.OS === 'web'){ if(confirm("¿Borrar?")) eliminarPlan(plan.id) } else { Alert.alert("Borrar", "¿Confirmas?", [{text:"No"}, {text:"Si", onPress:()=>eliminarPlan(plan.id)}])}}} style={styles.btnDelete}>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 11, color: '#64748b' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 25, alignItems: 'center', marginBottom: 25 },
  cardLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.2, marginBottom: 5, textTransform: 'uppercase' },
  caloriesMain: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  selectorTitle: { color: '#94a3b8', fontSize: 11, marginTop: 20, marginBottom: 10 },
  selectorRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#475569', backgroundColor: '#334155' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  miniRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  miniItem: { alignItems: 'center' },
  miniVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  miniLab: { color: '#64748b', fontSize: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  btnAdd: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  folderCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  folderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
  folderInfo: { flex: 1, marginLeft: 15 },
  folderTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  folderSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  btnDelete: { paddingHorizontal: 15, height: 70, justifyContent: 'center', backgroundColor: '#fff5f5' },
  errorCard: { backgroundColor: '#fff', padding: 25, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#f59e0b', gap: 10 },
  errorText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  btnDebug: { backgroundColor: '#334155', padding: 8, borderRadius: 5 }
});