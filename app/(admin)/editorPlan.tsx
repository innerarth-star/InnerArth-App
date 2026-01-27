import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
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

  // Estados para Macros (g por kg)
  const [gProteina, setGProteina] = useState(2.0);
  const [gGrasa, setGGrasa] = useState(0.8);

  // Estados para Buscador
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);

  useEffect(() => {
    if (!planId || !alumnoId) return;

    const cargarDatos = async () => {
      // 1. Obtener datos del alumno (Usando comidasDes como indicaste)
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) {
        setAlumno(aSnap.data());
      }

      // 2. Escuchar cambios en el plan
      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPlanData(data);
          if (data.gProteina) setGProteina(data.gProteina);
          if (data.gGrasa) setGGrasa(data.gGrasa);
        }
      });

      // 3. Cargar Biblioteca de alimentos
      const unsubRepo = onSnapshot(collection(db, "biblioteca_alimentos"), (snap) => {
        const items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setAlimentosRepo(items);
        setCargando(false);
      });

      return () => { unsubPlan(); unsubRepo(); };
    };
    cargarDatos();
  }, [planId, alumnoId]);

  // Cálculo de calorías y carbohidratos restantes
  const resumenMacros = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalMeta = planData.caloriasMeta || 0;

    const pGrams = Math.round(peso * gProteina);
    const gGrams = Math.round(peso * gGrasa);
    
    const kcalActuales = (pGrams * 4) + (gGrams * 9);
    const cGrams = Math.max(0, Math.round((kcalMeta - kcalActuales) / 4));
    
    return { pGrams, gGrams, cGrams, totalKcal: kcalMeta };
  }, [alumno, planData, gProteina, gGrasa]);

  const guardarConfiguracion = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        gProteina, 
        gGrasa, 
        gCarbo: resumenMacros?.cGrams || 0,
        macrosFinales: resumenMacros,
        fechaEdicion: serverTimestamp()
      });
      Alert.alert("Éxito", "Macros fijados correctamente.");
    } catch (e) { 
        Alert.alert("Error", "No se pudo guardar."); 
    }
  };

  const agregarAlimento = async (item: any) => {
    try {
        const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
        await updateDoc(planRef, {
          comidasReal: arrayUnion({ 
            ...item, 
            idInstancia: Date.now(), 
            numComida: comidaSeleccionada 
          })
        });
        setBusqueda('');
    } catch (e) {
        Alert.alert("Error", "No se pudo añadir el alimento.");
    }
  };

  const quitarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, { comidasReal: arrayRemove(item) });
  };

  // AQUÍ ESTÁ LA CORRECCIÓN: Leemos 'comidasDes'
  const numComidas = parseInt(alumno?.nutricion?.comidasDes) || 1;

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{nombreAlumno}</Text>
            <Text style={styles.headerSub}>Frecuencia: {numComidas} comidas</Text>
          </View>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalBadgeText}>{planData?.caloriasMeta || 0} kcal Meta</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === 'dieta' && (
            <View>
              {/* SECCIÓN MACROS */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Fijar Macros (g/kg)</Text>
                
                <Text style={styles.label}>Proteína</Text>
                <View style={styles.row}>
                  {[1.5, 1.8, 2.0, 2.2, 2.5].map(v => (
                    <Pressable key={v} onPress={() => setGProteina(v)} style={[styles.chip, gProteina === v && styles.chipProt]}>
                      <Text style={[styles.chipText, gProteina === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.label, {marginTop: 15}]}>Grasa</Text>
                <View style={styles.row}>
                  {[0.5, 0.6, 0.7, 0.8, 1.0].map(v => (
                    <Pressable key={v} onPress={() => setGGrasa(v)} style={[styles.chip, gGrasa === v && styles.chipGra]}>
                      <Text style={[styles.chipText, gGrasa === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.divider} />
                <View style={styles.macrosDisplay}>
                  <View style={styles.mBox}><Text style={styles.mVal}>{resumenMacros?.pGrams}g</Text><Text style={styles.mLab}>PROT</Text></View>
                  <View style={styles.mBox}><Text style={styles.mVal}>{resumenMacros?.gGrams}g</Text><Text style={styles.mLab}>GRASA</Text></View>
                  <View style={styles.mBox}><Text style={[styles.mVal, {color: '#10b981'}]}>{resumenMacros?.cGrams}g</Text><Text style={styles.mLab}>CARBS*</Text></View>
                </View>

                <Pressable style={styles.btnSave} onPress={guardarConfiguracion}>
                  <Text style={styles.btnSaveText}>FIJAR MACROS Y CALORÍAS</Text>
                </Pressable>
              </View>

              {/* SECCIÓN BUSCADOR */}
              <View style={[styles.card, {marginTop: 20}]}>
                <Text style={styles.cardTitle}>Agregar Alimento</Text>
                <Text style={styles.label}>Destino:</Text>
                <View style={styles.row}>
                  {Array.from({ length: numComidas }).map((_, i) => (
                    <Pressable key={i} onPress={() => setComidaSeleccionada(i+1)} style={[styles.miniChip, comidaSeleccionada === (i+1) && {backgroundColor: '#3b82f6'}]}>
                      <Text style={{fontSize: 11, fontWeight: 'bold', color: comidaSeleccionada === (i+1) ? '#fff' : '#475569'}}>C{i+1}</Text>
                    </Pressable>
                  ))}
                </View>
                
                <TextInput 
                  placeholder="Buscar en biblioteca..." 
                  style={styles.searchBar} 
                  value={busqueda} 
                  onChangeText={setBusqueda} 
                />
                
                {busqueda !== '' && (
                  <View style={styles.dropdown}>
                    {alimentosRepo.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(al => (
                      <Pressable key={al.id} style={styles.dropItem} onPress={() => agregarAlimento(al)}>
                        <Text style={{fontSize: 14}}>{al.nombre}</Text>
                        <Text style={{fontSize: 11, color: '#3b82f6'}}>+ Añadir a Comida {comidaSeleccionada}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* BLOQUES DE COMIDA ORGANIZADOS */}
              <View style={{marginTop: 20}}>
                {Array.from({ length: numComidas }).map((_, i) => (
                  <View key={i} style={styles.mealBlock}>
                    <Text style={styles.mealTitle}>Comida {i + 1}</Text>
                    <View style={styles.mealBox}>
                      {planData?.comidasReal?.filter((c: any) => c.numComida === (i + 1)).map((c: any) => (
                        <View key={c.idInstancia} style={styles.comidaRow}>
                          <Text style={{flex: 1, fontSize: 13, fontWeight: '500'}}>{c.nombre}</Text>
                          <Pressable onPress={() => quitarAlimento(c)} style={{padding: 5}}>
                            <FontAwesome5 name="trash" size={12} color="#ef4444" />
                          </Pressable>
                        </View>
                      ))}
                      {(!planData?.comidasReal || planData?.comidasReal?.filter((c: any) => c.numComida === (i + 1)).length === 0) && (
                        <Text style={styles.mealPlaceholder}>No hay alimentos...</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  mainContainer: { flex: 1, width: '100%', maxWidth: 800 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  kcalBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', minWidth: 50, alignItems: 'center' },
  miniChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#e2e8f0', minWidth: 40, alignItems: 'center' },
  chipProt: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipGra: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  macrosDisplay: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  mBox: { alignItems: 'center' },
  mVal: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  mLab: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  searchBar: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3 },
  dropItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  mealBlock: { marginBottom: 15 },
  mealTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b', marginBottom: 5 },
  mealBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 5, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  mealPlaceholder: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }
});