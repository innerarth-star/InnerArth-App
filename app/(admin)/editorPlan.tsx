import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TrackerItem = ({ label, restante, color }: any) => (
  <View style={styles.trackerItem}>
    <Text style={[styles.trackerVal, { color: restante < 0 ? '#ef4444' : color }]}>{restante}</Text>
    <Text style={styles.trackerLabel}>{label}</Text>
  </View>
);

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lun'); // Día por defecto
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DIETA ---
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [alimentoEditando, setAlimentoEditando] = useState<any>(null);
  const [cantidadInput, setCantidadInput] = useState('');

  // --- ESTADOS ENTRENO ---
  const [busquedaEj, setBusquedaEj] = useState('');
  const [ejerciciosRepo, setEjerciciosRepo] = useState<any[]>([]);

  useEffect(() => {
    if (!planId || !alumnoId) return;
    const cargarDatos = async () => {
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) setAlumno(aSnap.data());

      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) setPlanData(doc.data());
      });

      const unsubAlimentos = onSnapshot(collection(db, "alimentos"), (snap) => {
        const items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setAlimentosRepo(items);
      });

      const unsubEjercicios = onSnapshot(collection(db, "ejercicios"), (snap) => {
        const items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setEjerciciosRepo(items);
        setCargando(false);
      });

      return () => { unsubPlan(); unsubAlimentos(); unsubEjercicios(); };
    };
    cargarDatos();
  }, [planId, alumnoId]);

  const objetivos = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalMeta = planData.caloriasMeta || 0;
    const pMeta = Math.round(peso * 2.0); 
    const gMeta = Math.round(peso * 0.8);
    const cMeta = Math.max(0, Math.round((kcalMeta - (pMeta * 4 + gMeta * 9)) / 4));
    return { pMeta, gMeta, cMeta, kcalMeta };
  }, [alumno, planData]);

  const consumoActual = useMemo(() => {
    if (!planData?.comidasReal) return { p: 0, g: 0, c: 0, kcal: 0 };
    return planData.comidasReal.reduce((acc: any, al: any) => {
      const f = al.cantidad || 0; 
      acc.p += (al.proteina || 0) * f;
      acc.g += (al.grasa || 0) * f;
      acc.c += (al.carbohidratos || 0) * f;
      acc.kcal += (al.calorias || 0) * f;
      return acc;
    }, { p: 0, g: 0, c: 0, kcal: 0 });
  }, [planData?.comidasReal]);

  // --- FUNCIONES ---
  const agregarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, {
      comidasReal: arrayUnion({ ...item, idInstancia: Date.now(), numComida: comidaSeleccionada, cantidad: 1 })
    });
    setBusqueda('');
  };

  const agregarEjercicio = async (ej: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, {
      rutinaReal: arrayUnion({ 
        ...ej, 
        idInstancia: Date.now(), 
        dia: diaSeleccionado, // Guardamos el día
        seriesReps: "", 
        notas: "" 
      })
    });
    setBusquedaEj('');
  };

  const actualizarDetalleEjercicio = async (idInstancia: number, campo: string, valor: string) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    const nuevaRutina = planData.rutinaReal.map((r: any) => 
      r.idInstancia === idInstancia ? { ...r, [campo]: valor } : r
    );
    await updateDoc(planRef, { rutinaReal: nuevaRutina });
  };

  const eliminarEjercicio = async (ej: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, { rutinaReal: arrayRemove(ej) });
  };

  const numComidas = parseInt(alumno?.nutricion?.comidasDes) || 1;

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{nombreAlumno}</Text>
            <Text style={styles.headerSub}>{tab === 'dieta' ? `Dieta Diaria` : `Entrenamiento - ${diaSeleccionado}`}</Text>
          </View>
        </View>

        {/* Tabs Principales */}
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
              {/* Contenido de dieta (omitido por brevedad, igual al anterior) */}
              <View style={styles.trackerContainer}>
                <View style={styles.trackerRow}>
                  <TrackerItem label="KCAL" restante={Math.round((objetivos?.kcalMeta || 0) - consumoActual.kcal)} color="#1e293b" />
                  <TrackerItem label="PROT" restante={Math.round((objetivos?.pMeta || 0) - consumoActual.p)} color="#3b82f6" />
                  <TrackerItem label="GRASA" restante={Math.round((objetivos?.gMeta || 0) - consumoActual.g)} color="#f59e0b" />
                  <TrackerItem label="CARBS" restante={Math.round((objetivos?.cMeta || 0) - consumoActual.c)} color="#10b981" />
                </View>
              </View>
              {/* ... Resto de la UI de Dieta ... */}
            </View>
          ) : (
            <View>
              {/* SELECTOR DE DÍA */}
              <View style={styles.diasContainer}>
                {DIAS.map(d => (
                  <Pressable 
                    key={d} 
                    onPress={() => setDiaSeleccionado(d)} 
                    style={[styles.diaBtn, diaSeleccionado === d && styles.diaBtnActive]}
                  >
                    <Text style={[styles.diaText, diaSeleccionado === d && styles.diaTextActive]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              {/* BUSCADOR ENTRENO */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Añadir Ejercicio al {diaSeleccionado}</Text>
                <TextInput placeholder="Ej: Sentadilla..." style={styles.searchBar} value={busquedaEj} onChangeText={setBusquedaEj} />
                {busquedaEj !== '' && (
                  <View style={styles.dropdown}>
                    {ejerciciosRepo.filter(e => e.nombre.toLowerCase().includes(busquedaEj.toLowerCase())).map(ej => (
                      <Pressable key={ej.id} style={styles.dropItem} onPress={() => agregarEjercicio(ej)}>
                        <View><Text style={{fontWeight: 'bold'}}>{ej.nombre.toUpperCase()}</Text><Text style={{fontSize: 10, color: '#64748b'}}>{ej.grupo}</Text></View>
                        <FontAwesome5 name="plus" size={12} color="#1e293b" />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* LISTA DE EJERCICIOS DEL DÍA SELECCIONADO */}
              <View style={{marginTop: 20}}>
                {planData?.rutinaReal?.filter((r: any) => r.dia === diaSeleccionado).map((ej: any) => (
                  <View key={ej.idInstancia} style={styles.ejercicioCard}>
                    <View style={styles.ejHeader}>
                      <View style={{flex: 1}}><Text style={styles.ejNombre}>{ej.nombre.toUpperCase()}</Text><Text style={styles.ejGrupo}>{ej.grupo}</Text></View>
                      <Pressable onPress={() => eliminarEjercicio(ej)}><FontAwesome5 name="times-circle" size={20} color="#ef4444" /></Pressable>
                    </View>
                    <View style={styles.ejInputs}>
                       <View style={{flex: 1}}>
                          <Text style={styles.ejInputLabel}>Series x Reps</Text>
                          <TextInput style={styles.smallInput} placeholder="4x12" defaultValue={ej.seriesReps} onChangeText={(t) => actualizarDetalleEjercicio(ej.idInstancia, 'seriesReps', t)} />
                       </View>
                       <View style={{flex: 2}}>
                          <Text style={styles.ejInputLabel}>Notas</Text>
                          <TextInput style={styles.smallInput} placeholder="Descanso..." defaultValue={ej.notas} onChangeText={(t) => actualizarDetalleEjercicio(ej.idInstancia, 'notas', t)} />
                       </View>
                    </View>
                  </View>
                ))}
                {(!planData?.rutinaReal || planData?.rutinaReal?.filter((r: any) => r.dia === diaSeleccionado).length === 0) && (
                    <Text style={{textAlign: 'center', color: '#94a3b8', marginTop: 20}}>No hay ejercicios para el {diaSeleccionado}</Text>
                )}
              </View>
            </View>
          )}
          <View style={{height: 120}} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  mainContainer: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 800 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  diasContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, marginBottom: 10 },
  diaBtn: { padding: 10, borderRadius: 10, backgroundColor: '#fff', width: '13%', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  diaBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  diaText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  diaTextActive: { color: '#fff' },
  trackerContainer: { backgroundColor: '#fff', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trackerItem: { alignItems: 'center' },
  trackerVal: { fontSize: 18, fontWeight: '900' },
  trackerLabel: { fontSize: 8, color: '#64748b', fontWeight: 'bold' },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' },
  searchBar: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0', elevation: 5 },
  dropItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  ejercicioCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  ejHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  ejNombre: { fontWeight: 'bold', fontSize: 14, color: '#1e293b' },
  ejGrupo: { fontSize: 11, color: '#3b82f6', fontWeight: 'bold' },
  ejInputs: { flexDirection: 'row', gap: 15 },
  ejInputLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  smallInput: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 13 }
});