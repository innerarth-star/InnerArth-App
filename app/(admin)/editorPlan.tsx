import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

// Componente para el Tracker de Macros
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
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const [gProteina, setGProteina] = useState(2.0);
  const [gGrasa, setGGrasa] = useState(0.8);
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);

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
    const kcalActuales = (pMeta * 4 + gMeta * 9);
    const cMeta = Math.max(0, Math.round((kcalMeta - kcalActuales) / 4));
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

  const publicarPlanFinal = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        estatusDieta: "Completado",
        totalesFinalesDieta: {
            proteina: Math.round(consumoActual.p),
            grasa: Math.round(consumoActual.g),
            carbohidratos: Math.round(consumoActual.c),
            calorias: Math.round(consumoActual.kcal)
        },
        fechaGuardadoDieta: serverTimestamp()
      });

      Alert.alert("¡Dieta Guardada!", "Nutrición enviada. Pulsa continuar para armar la rutina.", [
        { text: "Continuar", onPress: () => {
          setTab('entreno'); // Cambia la pestaña
        }}
      ]);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar en la base de datos.");
    }
  };

  const numComidas = parseInt(alumno?.nutricion?.comidasDes) || 1;

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        {/* Header Fijo */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{nombreAlumno}</Text>
            <Text style={styles.headerSub}>Frecuencia: {numComidas} comidas</Text>
          </View>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalBadgeText}>{objetivos?.kcalMeta} kcal</Text>
          </View>
        </View>

        {/* Tabs Fijos */}
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('dieta')} style={[styles.tab, tab === 'dieta' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'dieta' && styles.tabTextActive]}>DIETA</Text>
          </Pressable>
          <Pressable onPress={() => setTab('entreno')} style={[styles.tab, tab === 'entreno' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'entreno' && styles.tabTextActive]}>ENTRENO</Text>
          </Pressable>
        </View>

        {/* Tracker Fijo (Solo en Dieta) */}
        {tab === 'dieta' && (
          <View style={styles.trackerContainer}>
              <View style={styles.trackerRow}>
                  <TrackerItem label="KCAL" restante={Math.round((objetivos?.kcalMeta || 0) - consumoActual.kcal)} color="#1e293b" />
                  <TrackerItem label="PROT" restante={Math.round((objetivos?.pMeta || 0) - consumoActual.p)} color="#3b82f6" />
                  <TrackerItem label="GRASA" restante={Math.round((objetivos?.gMeta || 0) - consumoActual.g)} color="#f59e0b" />
                  <TrackerItem label="CARBS" restante={Math.round((objetivos?.cMeta || 0) - consumoActual.c)} color="#10b981" />
              </View>
          </View>
        )}

        {/* Contenido con Scroll */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
          {tab === 'dieta' ? (
            <View>
              {/* BUSCADOR */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Agregar Alimento a C{comidaSeleccionada}</Text>
                <View style={styles.row}>
                  {Array.from({ length: numComidas }).map((_, i) => (
                    <Pressable key={i} onPress={() => setComidaSeleccionada(i+1)} style={[styles.miniChip, comidaSeleccionada === (i+1) && {backgroundColor: '#3b82f6'}]}>
                      <Text style={{fontSize: 10, color: comidaSeleccionada === (i+1) ? '#fff' : '#000'}}>C{i+1}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput placeholder="Ej: Pollo..." style={styles.searchBar} value={busqueda} onChangeText={setBusqueda} />
                {busqueda !== '' && (
                  <View style={styles.dropdown}>
                    {alimentosRepo.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(al => (
                      <Pressable key={al.id} style={styles.dropItem} onPress={() => {
                        const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
                        updateDoc(planRef, {
                          comidasReal: arrayUnion({ ...al, idInstancia: Date.now(), numComida: comidaSeleccionada, cantidad: 1 })
                        });
                        setBusqueda('');
                      }}>
                        <Text>{al.nombre.toUpperCase()}</Text>
                        <FontAwesome5 name="plus" size={12} color="#3b82f6" />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* BLOQUES DE COMIDA */}
              {Array.from({ length: numComidas }).map((_, i) => (
                <View key={i} style={[styles.mealBlock, {marginTop: 15}]}>
                  <Text style={styles.mealTitle}>Comida {i + 1}</Text>
                  <View style={styles.mealBox}>
                    {planData?.comidasReal?.filter((c: any) => c.numComida === (i + 1)).map((c: any) => (
                      <View key={c.idInstancia} style={styles.comidaRow}>
                        <Pressable style={{flex: 1}} onPress={() => {
                          setAlimentoEditando(c);
                          setCantidadInput(c.cantidad.toString());
                          setModalVisible(true);
                        }}>
                           <Text style={{fontWeight: 'bold', fontSize: 13}}>{c.nombre.toUpperCase()}</Text>
                           <Text style={{fontSize: 11, color: '#3b82f6'}}>{c.cantidad} {c.unidadMedida} • {Math.round(c.calorias * c.cantidad)} kcal</Text>
                        </Pressable>
                        <Pressable onPress={() => {
                          const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
                          updateDoc(planRef, { comidasReal: arrayRemove(c) });
                        }} style={{padding: 10}}>
                          <FontAwesome5 name="trash" size={14} color="#ef4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              <View style={{ height: 100 }} />
            </View>
          ) : (
            <View style={styles.placeholder}>
              <FontAwesome5 name="dumbbell" size={60} color="#e2e8f0" />
              <Text style={{marginTop: 20, color: '#94a3b8', fontWeight: 'bold'}}>RUTINA DE ENTRENAMIENTO</Text>
              <Text style={{color: '#cbd5e1'}}>Configura ejercicios, series y repeticiones</Text>
              <TouchableOpacity style={styles.btnAgregarEjercicios}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>Añadir Ejercicio</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Botón Flotante/Fijo (Solo Dieta) */}
        {tab === 'dieta' && (
          <View style={styles.footerSticky}>
            <TouchableOpacity activeOpacity={0.7} style={styles.btnPublicar} onPress={publicarPlanFinal}>
              <Text style={styles.btnPublicarText}>GUARDAR DIETA Y CONTINUAR</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ajustar Cantidad</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={cantidadInput} onChangeText={setCantidadInput} autoFocus />
              <View style={[styles.row, {marginTop: 20}]}>
                <Pressable style={[styles.btnModal, {backgroundColor: '#f1f5f9'}]} onPress={() => setModalVisible(false)}><Text>Cerrar</Text></Pressable>
                <Pressable style={[styles.btnModal, {backgroundColor: '#3b82f6'}]} onPress={async () => {
                  const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
                  const nuevasComidas = planData.comidasReal.map((c: any) => 
                    c.idInstancia === alimentoEditando.idInstancia ? { ...c, cantidad: parseFloat(cantidadInput || "0") } : c
                  );
                  await updateDoc(planRef, { comidasReal: nuevasComidas });
                  setModalVisible(false);
                }}><Text style={{color: '#fff', fontWeight: 'bold'}}>Actualizar</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  kcalBadge: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  trackerContainer: { backgroundColor: '#fff', paddingBottom: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trackerItem: { alignItems: 'center' },
  trackerVal: { fontSize: 18, fontWeight: '900' },
  trackerLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { padding: 8, borderRadius: 6, backgroundColor: '#f1f5f9', minWidth: 40, alignItems: 'center' },
  miniChip: { padding: 8, borderRadius: 6, backgroundColor: '#f1f5f9', minWidth: 40, alignItems: 'center' },
  chipProt: { backgroundColor: '#3b82f6' },
  chipGra: { backgroundColor: '#f59e0b' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  searchBar: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0', elevation: 5 },
  dropItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  mealBlock: { marginBottom: 10 },
  mealTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b', marginBottom: 5 },
  mealBox: { backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 60 },
  comidaRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 5, alignItems: 'center' },
  footerSticky: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0' },
  btnPublicar: { backgroundColor: '#22c55e', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnPublicarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { backgroundColor: '#f1f5f9', width: '100%', padding: 12, borderRadius: 10, fontSize: 24, textAlign: 'center', fontWeight: 'bold' },
  btnModal: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 400 },
  btnAgregarEjercicios: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginTop: 20, width: 200, alignItems: 'center' }
});