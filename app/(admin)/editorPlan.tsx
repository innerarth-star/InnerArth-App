import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, query, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  const [gCarbo, setGCarbo] = useState(3.0);

  // Estados para Buscador
  const [busqueda, setBusqueda] = useState('');
  const [alimentosRepo, setAlimentosRepo] = useState<any[]>([]);

  useEffect(() => {
    if (!planId || !alumnoId) return;

    const cargarDatos = async () => {
      // Cargar Datos del Alumno
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) setAlumno(aSnap.data());

      // Cargar Planes y Biblioteca
      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPlanData(data);
          if (data.gProteina) setGProteina(data.gProteina);
          if (data.gGrasa) setGGrasa(data.gGrasa);
          if (data.gCarbo) setGCarbo(data.gCarbo);
        }
      });

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

  const resumenMacros = useMemo(() => {
    if (!alumno) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const pGrams = Math.round(peso * gProteina);
    const gGrams = Math.round(peso * gGrasa);
    const cGrams = Math.round(peso * gCarbo);
    const totalKcal = (pGrams * 4) + (gGrams * 9) + (cGrams * 4);
    return { pGrams, gGrams, cGrams, totalKcal };
  }, [alumno, gProteina, gGrasa, gCarbo]);

  const guardarConfiguracion = async () => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        gProteina, gGrasa, gCarbo,
        macrosFinales: resumenMacros,
        fechaEdicion: serverTimestamp()
      });
      Alert.alert("Éxito", "Configuración de macros guardada.");
    } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
  };

  const agregarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, {
      comidasReal: arrayUnion({ ...item, idInstancia: Date.now() })
    });
    setBusqueda('');
  };

  const quitarAlimento = async (item: any) => {
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    await updateDoc(planRef, { comidasReal: arrayRemove(item) });
  };

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
            <Text style={styles.headerSub}>Frecuencia pedida: {alumno?.nutricion?.comidas || 'N/A'} comidas</Text>
          </View>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalBadgeText}>{resumenMacros?.totalKcal} kcal</Text>
          </View>
        </View>

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
              {/* SECCIÓN MACROS */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Configuración de Macros (g/kg)</Text>
                <Text style={styles.label}>Proteína</Text>
                <View style={styles.row}>
                  {[1.5, 1.8, 2.0, 2.2, 2.5].map(v => (
                    <Pressable key={v} onPress={() => setGProteina(v)} style={[styles.chip, gProteina === v && styles.chipProt]}>
                      <Text style={[styles.chipText, gProteina === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, {marginTop: 10}]}>Grasa</Text>
                <View style={styles.row}>
                  {[0.5, 0.7, 0.8, 1.0, 1.2].map(v => (
                    <Pressable key={v} onPress={() => setGGrasa(v)} style={[styles.chip, gGrasa === v && styles.chipGra]}>
                      <Text style={[styles.chipText, gGrasa === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, {marginTop: 10}]}>Carbohidratos</Text>
                <View style={styles.row}>
                  {[2.0, 3.0, 4.0, 5.0, 6.0].map(v => (
                    <Pressable key={v} onPress={() => setGCarbo(v)} style={[styles.chip, gCarbo === v && styles.chipCarb]}>
                      <Text style={[styles.chipText, gCarbo === v && {color:'#fff'}]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.btnSave} onPress={guardarConfiguracion}>
                  <Text style={styles.btnSaveText}>FIJAR MACROS</Text>
                </Pressable>
              </View>

              {/* SECCIÓN ALIMENTOS */}
              <View style={[styles.card, {marginTop: 20}]}>
                <Text style={styles.cardTitle}>Asignar Alimentos</Text>
                <TextInput 
                  placeholder="Buscar alimento..." 
                  style={styles.searchBar} 
                  value={busqueda} 
                  onChangeText={setBusqueda} 
                />
                
                {busqueda !== '' && (
                  <View style={styles.dropdown}>
                    {alimentosRepo.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(al => (
                      <Pressable key={al.id} style={styles.dropItem} onPress={() => agregarAlimento(al)}>
                        <Text>{al.nombre}</Text>
                        <FontAwesome5 name="plus" size={12} color="#3b82f6" />
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.listComidas}>
                  {planData?.comidasReal?.map((c: any) => (
                    <View key={c.idInstancia} style={styles.comidaRow}>
                      <Text style={{flex: 1}}>{c.nombre}</Text>
                      <Pressable onPress={() => quitarAlimento(c)}><FontAwesome5 name="times" color="red" /></Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}><Text>Próximamente: Entrenamiento</Text></View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  mainContainer: { flex: 1, width: '100%', maxWidth: 800, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 10, marginRight: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 13, color: '#3b82f6' },
  kcalBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  chip: { padding: 8, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  chipProt: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipGra: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipCarb: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  btnSave: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  searchBar: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  dropItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listComidas: { marginTop: 15 },
  comidaRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 5, alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  macrosResult: { flexDirection: 'row', justifyContent: 'space-around' },
  placeholder: { padding: 50, alignItems: 'center' }
});