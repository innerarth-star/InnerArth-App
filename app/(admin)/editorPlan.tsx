import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Macros g/kg
  const [gProteina, setGProteina] = useState(2.0);
  const [gGrasa, setGGrasa] = useState(0.8);

  // Buscador
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);

  // Modal para editar gramos
  const [modalVisible, setModalVisible] = useState(false);
  const [alimentoEditando, setAlimentoEditando] = useState<any>(null);
  const [cantidadInput, setCantidadInput] = useState('');

  useEffect(() => {
    if (!planId || !alumnoId) return;
    const cargarDatos = async () => {
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) setAlumno(aSnap.data());

      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPlanData(data);
          if (data.gProteina) setGProteina(data.gProteina);
          if (data.gGrasa) setGGrasa(data.gGrasa);
        }
      });

      const unsubRepo = onSnapshot(collection(db, "alimentos"), (snap) => {
        const items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setAlimentosRepo(items);
        setCargando(false);
      });
      return () => { unsubPlan(); unsubRepo(); };
    };
    cargarDatos();
  }, [planId, alumnoId]);

  const objetivos = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalMeta = planData.caloriasMeta || 0;
    const pMeta = Math.round(peso * gProteina);
    const gMeta = Math.round(peso * gGrasa);
    const cMeta = Math.max(0, Math.round((kcalMeta - (pMeta * 4 + gMeta * 9)) / 4));
    return { pMeta, gMeta, cMeta, kcalMeta };
  }, [alumno, planData, gProteina, gGrasa]);

  const consumoActual = useMemo(() => {
    if (!planData?.comidasReal) return { p: 0, g: 0, c: 0, kcal: 0 };
    return planData.comidasReal.reduce((acc: any, al: any) => {
      const factor = al.cantidad || 0; 
      acc.p += (al.proteina || 0) * factor;
      acc.g += (al.grasa || 0) * factor;
      acc.c += (al.carbohidratos || 0) * factor;
      acc.kcal += (al.calorias || 0) * factor;
      return acc;
    }, { p: 0, g: 0, c: 0, kcal: 0 });
  }, [planData?.comidasReal]);

  const guardarConfiguracion = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        gProteina, gGrasa, 
        macrosObjetivo: objetivos,
        fechaActualizacion: serverTimestamp()
      });
      Alert.alert("Éxito", "Objetivos de macros fijados.");
    } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
  };

  const agregarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, {
      comidasReal: arrayUnion({ 
        ...item, 
        idInstancia: Date.now(), 
        numComida: comidaSeleccionada,
        cantidad: item.unidadMedida === 'gr' ? 100 : 1 
      })
    });
    setBusqueda('');
  };

  const abrirEditorGramos = (alimento: any) => {
    setAlimentoEditando(alimento);
    setCantidadInput(alimento.cantidad.toString());
    setModalVisible(true);
  };

  const guardarGramos = async () => {
    if (!alimentoEditando) return;
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      const nuevasComidas = planData.comidasReal.map((c: any) => 
        c.idInstancia === alimentoEditando.idInstancia 
        ? { ...c, cantidad: parseFloat(cantidadInput || "0") } 
        : c
      );
      await updateDoc(planRef, { comidasReal: nuevasComidas });
      setModalVisible(false);
    } catch (e) { Alert.alert("Error", "No se pudo actualizar."); }
  };

  const quitarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, { comidasReal: arrayRemove(item) });
  };

  // FUNCIÓN PRINCIPAL DE GUARDADO FINAL
const publicarPlanFinal = async () => {
  if (!planData?.comidasReal || planData.comidasReal.length === 0) {
    Alert.alert("Atención", "El plan no tiene alimentos agregados.");
    return;
  }
  try {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, {
      estatusDieta: "Completado", // Marcamos solo la dieta
      totalesFinalesDieta: {
          proteina: Math.round(consumoActual.p),
          grasa: Math.round(consumoActual.g),
          carbohidratos: Math.round(consumoActual.c),
          calorias: Math.round(consumoActual.kcal)
      },
      fechaGuardadoDieta: serverTimestamp()
    });

    Alert.alert("Dieta Guardada", "Nutrición lista. Ahora vamos a configurar el entrenamiento.", [
      { text: "Continuar", onPress: () => setTab('entreno') } // <--- AQUÍ PASA A ENTRENO
    ]);
  } catch (e) {
    Alert.alert("Error", "No se pudo guardar la dieta.");
  }
};

  const numComidas = parseInt(alumno?.nutricion?.comidasDes) || 1;

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{nombreAlumno}</Text>
            <Text style={styles.headerSub}>Frecuencia: {numComidas} comidas</Text>
          </View>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalBadgeText}>{objetivos?.kcalMeta} kcal Meta</Text>
          </View>
        </View>

        {/* Tracker de Descuento */}
        <View style={styles.trackerContainer}>
            <View style={styles.trackerRow}>
                <TrackerItem label="CALORÍAS" restante={Math.round((objetivos?.kcalMeta || 0) - consumoActual.kcal)} color="#1e293b" />
                <TrackerItem label="PROT" restante={Math.round((objetivos?.pMeta || 0) - consumoActual.p)} color="#3b82f6" />
                <TrackerItem label="GRASA" restante={Math.round((objetivos?.gMeta || 0) - consumoActual.g)} color="#f59e0b" />
                <TrackerItem label="CARBS" restante={Math.round((objetivos?.cMeta || 0) - consumoActual.c)} color="#10b981" />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === 'dieta' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>1. Objetivos Diarios</Text>
                <Text style={styles.label}>Proteína (g/kg)</Text>
                <View style={styles.row}>
                  {[1.5, 1.8, 2.0, 2.2, 2.5].map(v => (
                    <Pressable key={v} onPress={() => setGProteina(v)} style={[styles.chip, gProteina === v && styles.chipProt]}>
                      <Text style={[styles.chipText, gProteina === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, {marginTop: 10}]}>Grasa (g/kg)</Text>
                <View style={styles.row}>
                  {[0.5, 0.6, 0.7, 0.8, 1.0].map(v => (
                    <Pressable key={v} onPress={() => setGGrasa(v)} style={[styles.chip, gGrasa === v && styles.chipGra]}>
                      <Text style={[styles.chipText, gGrasa === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.btnSave} onPress={guardarConfiguracion}>
                  <Text style={styles.btnSaveText}>FIJAR OBJETIVOS</Text>
                </Pressable>
              </View>

              <View style={[styles.card, {marginTop: 20}]}>
                <Text style={styles.cardTitle}>2. Biblioteca de Alimentos</Text>
                <View style={styles.row}>
                  {Array.from({ length: numComidas }).map((_, i) => (
                    <Pressable key={i} onPress={() => setComidaSeleccionada(i+1)} style={[styles.miniChip, comidaSeleccionada === (i+1) && {backgroundColor: '#3b82f6'}]}>
                      <Text style={{fontSize: 10, color: comidaSeleccionada === (i+1) ? '#fff' : '#000'}}>C{i+1}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput placeholder="Buscar..." style={styles.searchBar} value={busqueda} onChangeText={setBusqueda} />
                {busqueda !== '' && (
                  <View style={styles.dropdown}>
                    {alimentosRepo.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(al => (
                      <Pressable key={al.id} style={styles.dropItem} onPress={() => agregarAlimento(al)}>
                        <Text>{al.nombre.toUpperCase()}</Text>
                        <Text style={{fontSize: 10, color: '#3b82f6'}}>+ C{comidaSeleccionada}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={{marginTop: 20}}>
                {Array.from({ length: numComidas }).map((_, i) => (
                  <View key={i} style={styles.mealBlock}>
                    <Text style={styles.mealTitle}>Comida {i + 1}</Text>
                    <View style={styles.mealBox}>
                      {planData?.comidasReal?.filter((c: any) => c.numComida === (i + 1)).map((c: any) => (
                        <View key={c.idInstancia} style={styles.comidaRow}>
                          <Pressable style={{flex: 1}} onPress={() => abrirEditorGramos(c)}>
                             <Text style={{fontWeight: 'bold', fontSize: 13}}>{c.nombre.toUpperCase()}</Text>
                             <Text style={{fontSize: 11, color: '#3b82f6'}}>{c.cantidad} {c.unidadMedida} • {Math.round(c.calorias * c.cantidad)} kcal</Text>
                          </Pressable>
                          <Pressable onPress={() => quitarAlimento(c)} style={{padding: 10}}>
                            <FontAwesome5 name="trash" size={14} color="#ef4444" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {/* BOTÓN FINAL DE GUARDADO */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.btnPublicar} 
                onPress={publicarPlanFinal}
              >
                <FontAwesome5 name="check-circle" size={18} color="#fff" />
                <Text style={styles.btnPublicarText}>PUBLICAR PLAN DE ALIMENTACIÓN</Text>
              </TouchableOpacity>
              
              <View style={{height: 50}} />
            </View>
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ajustar {alimentoEditando?.unidadMedida}</Text>
              <TextInput 
                style={styles.modalInput} 
                keyboardType="numeric" 
                value={cantidadInput} 
                onChangeText={setCantidadInput}
                autoFocus
              />
              <View style={[styles.row, {marginTop: 20}]}>
                <Pressable style={[styles.btnModal, {backgroundColor: '#e2e8f0'}]} onPress={() => setModalVisible(false)}>
                  <Text>Cerrar</Text>
                </Pressable>
                <Pressable style={[styles.btnModal, {backgroundColor: '#3b82f6'}]} onPress={guardarGramos}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>Actualizar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const TrackerItem = ({ label, restante, color }: any) => (
    <View style={styles.trackerItem}>
        <Text style={[styles.trackerVal, { color: restante < 0 ? '#ef4444' : color }]}>{restante}</Text>
        <Text style={styles.trackerLabel}>{label}</Text>
    </View>
);

// Agregado TouchableOpacity para el botón final
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  mainContainer: { flex: 1, width: '100%', maxWidth: 800 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  kcalBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  trackerContainer: { backgroundColor: '#fff', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trackerItem: { alignItems: 'center' },
  trackerVal: { fontSize: 18, fontWeight: '900' },
  trackerLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { padding: 10, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', minWidth: 45, alignItems: 'center' },
  miniChip: { padding: 8, borderRadius: 6, backgroundColor: '#e2e8f0', minWidth: 35, alignItems: 'center' },
  chipProt: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipGra: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  macrosDisplay: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  mBox: { alignItems: 'center' },
  mVal: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  mLab: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  searchBar: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3 },
  dropItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  mealBlock: { marginBottom: 15 },
  mealTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b', marginBottom: 5 },
  mealBox: { backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 5, alignItems: 'center' },
  btnPublicar: { backgroundColor: '#22c55e', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 30, elevation: 4 },
  btnPublicarText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalInput: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 10, fontSize: 24, textAlign: 'center', fontWeight: 'bold', marginTop: 15 },
  btnModal: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  mealPlaceholder: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: 10, textAlign: 'center' }
});