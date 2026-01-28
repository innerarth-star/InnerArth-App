import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

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
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lun');
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Estados Dieta
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [alimentoEditando, setAlimentoEditando] = useState<any>(null);
  const [cantidadInput, setCantidadInput] = useState('');

  // Estados Entreno
  const [busquedaEj, setBusquedaEj] = useState('');
  const [ejerciciosRepo, setEjerciciosRepo] = useState<any[]>([]);

  useEffect(() => {
    if (!planId || !alumnoId) return;
    const cargarDatos = async () => {
      try {
        const aSnap = await getDoc(doc(db, "alumnos_activos", String(alumnoId)));
        if (aSnap.exists()) setAlumno(aSnap.data());

        const unsubPlan = onSnapshot(doc(db, "alumnos_activos", String(alumnoId), "planes", String(planId)), (doc) => {
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
      } catch (err) { setCargando(false); }
    };
    cargarDatos();
  }, [planId, alumnoId]);

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

  const objetivos = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalMeta = planData.caloriasMeta || 0;
    const pMeta = Math.round(peso * 2.0); 
    const gMeta = Math.round(peso * 0.8);
    const cMeta = Math.max(0, Math.round((kcalMeta - (pMeta * 4 + gMeta * 9)) / 4));
    return { pMeta, gMeta, cMeta, kcalMeta };
  }, [alumno, planData]);

  // --- FUNCIÓN DE PUBLICACIÓN REFORZADA ---
  const publicarYArchivar = async () => {
    if (!planData?.comidasReal?.length && !planData?.rutinaReal?.length) {
      Alert.alert("Error", "Agrega contenido antes de publicar.");
      return;
    }

    const cAlumnoId = String(alumnoId).trim();
    const cPlanId = String(planId).trim();

    // Usamos confirm de navegador si es Web para asegurar respuesta
    const confirmar = Platform.OS === 'web' 
        ? window.confirm("¿Publicar plan ahora?") 
        : true;

    if (!confirmar) return;

    try {
      const timestamp = Date.now().toString();
      const planSellado = {
        estatus: "Publicado",
        fechaPublicacion: new Date(),
        totalesFinales: consumoActual,
        dieta: planData.comidasReal || [],
        rutina: planData.rutinaReal || [],
        nombreAlumno: String(nombreAlumno),
        alumnoId: cAlumnoId
      };

      // USAMOS SETDOC PARA FORZAR LA CREACIÓN
      // 1. Historial
      await setDoc(doc(db, "historial_planes", `hist_${timestamp}`), planSellado);
      // 2. Expediente alumno
      await setDoc(doc(db, "alumnos_activos", cAlumnoId, "planes_publicados", `plan_${timestamp}`), planSellado);
      // 3. Cerrar edición
      await updateDoc(doc(db, "alumnos_activos", cAlumnoId, "planes", cPlanId), { estatus: "Archivado" });

      if (Platform.OS === 'web') alert("¡Plan Publicado!");
      else Alert.alert("Éxito", "Plan publicado correctamente.");

      router.replace('/(admin)/alumnos' as any);
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    }
  };

  const agregarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", String(alumnoId), "planes", String(planId));
    await updateDoc(planRef, { comidasReal: arrayUnion({ ...item, idInstancia: Date.now(), numComida: comidaSeleccionada, cantidad: 1 }) });
    setBusqueda('');
  };

  const guardarGramos = async () => {
    const planRef = doc(db, "alumnos_activos", String(alumnoId), "planes", String(planId));
    const nuevas = planData.comidasReal.map((c: any) => c.idInstancia === alimentoEditando.idInstancia ? { ...c, cantidad: parseFloat(cantidadInput || "0") } : c);
    await updateDoc(planRef, { comidasReal: nuevas });
    setModalVisible(false);
  };

  const agregarEjercicio = async (ej: any) => {
    const planRef = doc(db, "alumnos_activos", String(alumnoId), "planes", String(planId));
    await updateDoc(planRef, { rutinaReal: arrayUnion({ ...ej, idInstancia: Date.now(), dia: diaSeleccionado, seriesReps: "", notas: "" }) });
    setBusquedaEj('');
  };

  const actualizarDetalleEjercicio = async (idInstancia: number, campo: string, valor: string) => {
    const planRef = doc(db, "alumnos_activos", String(alumnoId), "planes", String(planId));
    const nueva = planData.rutinaReal.map((r: any) => r.idInstancia === idInstancia ? { ...r, [campo]: valor } : r);
    await updateDoc(planRef, { rutinaReal: nueva });
  };

  const numComidas = parseInt(alumno?.nutricion?.comidasDes) || 1;

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1e293b" /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.headerTitle}>{nombreAlumno}</Text><Text style={styles.headerSub}>{tab==='dieta'?'Nutrición':`Rutina: ${diaSeleccionado}`}</Text></View>
        </View>

        <View style={styles.tabs}>
          <Pressable onPress={()=>setTab('dieta')} style={[styles.tab, tab==='dieta'&&styles.tabActive]}><Text style={[styles.tabText, tab==='dieta'&&styles.tabTextActive]}>DIETA</Text></Pressable>
          <Pressable onPress={()=>setTab('entreno')} style={[styles.tab, tab==='entreno'&&styles.tabActive]}><Text style={[styles.tabText, tab==='entreno'&&styles.tabTextActive]}>ENTRENO</Text></Pressable>
        </View>

        {tab === 'dieta' && (
          <View style={styles.trackerContainer}>
            <View style={styles.trackerRow}>
              <TrackerItem label="KCAL" restante={Math.round((objetivos?.kcalMeta||0)-consumoActual.kcal)} color="#1e293b" />
              <TrackerItem label="PROT" restante={Math.round((objetivos?.pMeta||0)-consumoActual.p)} color="#3b82f6" />
              <TrackerItem label="GRASA" restante={Math.round((objetivos?.gMeta||0)-consumoActual.g)} color="#f59e0b" />
              <TrackerItem label="CARBS" restante={Math.round((objetivos?.cMeta||0)-consumoActual.c)} color="#10b981" />
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === 'dieta' ? (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Comida {comidaSeleccionada}</Text>
                <View style={styles.row}>
                  {Array.from({ length: numComidas }).map((_, i) => (
                    <Pressable key={i} onPress={()=>setComidaSeleccionada(i+1)} style={[styles.miniChip, comidaSeleccionada===(i+1)&&{backgroundColor:'#3b82f6'}]}><Text style={{fontSize:10, color:comidaSeleccionada===(i+1)?'#fff':'#000'}}>C{i+1}</Text></Pressable>
                  ))}
                </View>
                <TextInput placeholder="Buscar..." style={styles.searchBar} value={busqueda} onChangeText={setBusqueda} />
                {busqueda !== '' && (
                  <View style={styles.dropdown}>
                    {alimentosRepo.filter(a=>a.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(al => (
                      <Pressable key={al.id} style={styles.dropItem} onPress={()=>agregarAlimento(al)}><Text style={{fontSize:13}}>{al.nombre.toUpperCase()}</Text><FontAwesome5 name="plus" size={12} color="#3b82f6" /></Pressable>
                    ))}
                  </View>
                )}
              </View>
              {Array.from({ length: numComidas }).map((_, i) => (
                <View key={i} style={styles.mealBlock}>
                  <Text style={styles.mealTitle}>Comida {i + 1}</Text>
                  <View style={styles.mealBox}>
                    {planData?.comidasReal?.filter((c:any)=>c.numComida===(i+1)).map((c:any) => (
                      <View key={c.idInstancia} style={styles.comidaRow}>
                        <Pressable style={{flex:1}} onPress={()=>{setAlimentoEditando(c);setCantidadInput(c.cantidad.toString());setModalVisible(true);}}><Text style={{fontWeight:'bold',fontSize:13}}>{c.nombre.toUpperCase()}</Text><Text style={{fontSize:11,color:'#3b82f6'}}>{c.cantidad} {c.unidadMedida} • {Math.round(c.calorias*c.cantidad)} kcal</Text></Pressable>
                        <Pressable onPress={()=>updateDoc(doc(db,"alumnos_activos",String(alumnoId),"planes",String(planId)),{comidasReal:arrayRemove(c)})}><FontAwesome5 name="trash" size={14} color="#ef4444"/></Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View>
              <View style={styles.diasContainer}>{DIAS.map(d=>(<Pressable key={d} onPress={()=>setDiaSeleccionado(d)} style={[styles.diaBtn, diaSeleccionado===d&&styles.diaBtnActive]}><Text style={[styles.diaText, diaSeleccionado===d&&styles.diaTextActive]}>{d}</Text></Pressable>))}</View>
              <View style={styles.card}><Text style={styles.cardTitle}>Añadir Ejercicio</Text><TextInput placeholder="Ej: Press..." style={styles.searchBar} value={busquedaEj} onChangeText={setBusquedaEj} />
                {busquedaEj !== '' && (
                  <View style={styles.dropdown}>{ejerciciosRepo.filter(e=>e.nombre.toLowerCase().includes(busquedaEj.toLowerCase())).map(ej=>(<Pressable key={ej.id} style={styles.dropItem} onPress={()=>agregarEjercicio(ej)}><View><Text style={{fontWeight:'bold'}}>{ej.nombre.toUpperCase()}</Text><Text style={{fontSize:10,color:'#3b82f6'}}>{ej.grupo}</Text></View><FontAwesome5 name="plus" size={12}/></Pressable>))}</View>
                )}
              </View>
              <View style={{marginTop:20}}>
                {planData?.rutinaReal?.filter((r:any)=>r.dia===diaSeleccionado).map((ej:any)=>(
                  <View key={ej.idInstancia} style={styles.ejercicioCard}>
                    <View style={styles.ejHeader}><View style={{flex:1}}><Text style={styles.ejNombre}>{ej.nombre.toUpperCase()}</Text><Text style={styles.ejGrupo}>{ej.grupo}</Text></View><Pressable onPress={()=>updateDoc(doc(db,"alumnos_activos",String(alumnoId),"planes",String(planId)),{rutinaReal:arrayRemove(ej)})}><FontAwesome5 name="times-circle" size={20} color="#ef4444"/></Pressable></View>
                    <View style={styles.ejInputs}><View style={{flex:1}}><Text style={styles.ejInputLabel}>Reps</Text><TextInput style={styles.smallInput} defaultValue={ej.seriesReps} onChangeText={(t)=>actualizarDetalleEjercicio(ej.idInstancia,'seriesReps',t)} /></View><View style={{flex:2}}><Text style={styles.ejInputLabel}>Notas</Text><TextInput style={styles.smallInput} defaultValue={ej.notas} onChangeText={(t)=>actualizarDetalleEjercicio(ej.idInstancia,'notas',t)} /></View></View>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={{height: 120}} />
        </ScrollView>
        <View style={styles.footerSticky}>
          <TouchableOpacity style={[styles.btnAction,{backgroundColor: tab==='dieta'?'#22c55e':'#1e293b'}]} onPress={tab==='dieta' ? ()=>setTab('entreno') : publicarYArchivar}>
            <Text style={styles.txtW}>{tab==='dieta' ? 'SIGUIENTE: CONFIGURAR ENTRENO' : 'PUBLICAR PLAN COMPLETO'}</Text>
          </TouchableOpacity>
        </View>
        <Modal visible={modalVisible} transparent><View style={styles.modalOverlay}><View style={styles.modalContent}><Text>Cantidad</Text><TextInput style={styles.modalInput} keyboardType="numeric" value={cantidadInput} onChangeText={setCantidadInput} /><View style={{flexDirection:'row',gap:10,marginTop:20}}><Pressable onPress={()=>setModalVisible(false)}><Text>Cerrar</Text></Pressable><Pressable onPress={guardarGramos}><Text style={styles.txtB}>Actualizar</Text></Pressable></View></View></View></Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  mainContainer: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 600, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  trackerContainer: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trackerItem: { alignItems: 'center' },
  trackerVal: { fontSize: 16, fontWeight: 'bold' },
  trackerLabel: { fontSize: 8, color: '#64748b' },
  scroll: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  searchBar: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  dropdown: { backgroundColor: '#fff', borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  dropItem: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  mealBlock: { marginTop: 15 },
  mealTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  mealBox: { backgroundColor: '#fff', borderRadius: 10, padding: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  diasContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  diaBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fff', width: '13%', alignItems: 'center' },
  diaBtnActive: { backgroundColor: '#1e293b' },
  diaText: { fontSize: 9 },
  diaTextActive: { color: '#fff' },
  ejercicioCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  ejHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  ejNombre: { fontWeight: 'bold', fontSize: 13 },
  ejGrupo: { fontSize: 10, color: '#3b82f6' },
  ejInputs: { flexDirection: 'row', gap: 10, marginTop: 10 },
  ejInputLabel: { fontSize: 9, color: '#64748b' },
  smallInput: { backgroundColor: '#f1f5f9', padding: 5, borderRadius: 5, fontSize: 12, flex: 1 },
  footerSticky: { position: 'absolute', bottom: 0, width: '100%', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  btnAction: { padding: 15, borderRadius: 10, alignItems: 'center' },
  txtW: { color: '#fff', fontWeight: 'bold' },
  txtB: { color: '#3b82f6', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '80%' },
  modalInput: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, fontSize: 20, textAlign: 'center', marginTop: 10 },
  miniChip: { padding: 5, borderRadius: 5, backgroundColor: '#f1f5f9', minWidth: 35, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' }
});