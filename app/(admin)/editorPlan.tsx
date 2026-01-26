import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'; 
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [alumno, setAlumno] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [comidaDestino, setComidaDestino] = useState<number | null>(null);

  const [gProteina, setGProteina] = useState(2.0);
  const [gGrasa, setGGrasa] = useState(0.8);

  useEffect(() => {
    if (!planId || !alumnoId) return;

    const cargarDatos = async () => {
      const aSnap = await getDoc(doc(db, "alumnos_activos", alumnoId as string));
      if (aSnap.exists()) setAlumno(aSnap.data());

      const bSnap = await getDocs(collection(db, "biblioteca_alimentos"));
      setBiblioteca(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const unsubPlan = onSnapshot(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPlanData(data);
          if (data.gProteina) setGProteina(data.gProteina);
          if (data.gGrasa) setGGrasa(data.gGrasa);
        }
        setCargando(false);
      });
      return unsubPlan;
    };
    cargarDatos();
  }, [planId, alumnoId]);

  const macros = useMemo(() => {
    if (!alumno || !planData) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso || 70);
    const kcalTotales = planData.caloriasMeta || 2000;
    const pGrams = Math.round(peso * gProteina);
    const gGrams = Math.round(peso * gGrasa);
    const cGrams = Math.max(0, Math.round((kcalTotales - (pGrams * 4 + gGrams * 9)) / 4));
    return { proteina: pGrams, grasa: gGrams, carbo: cGrams, total: kcalTotales };
  }, [alumno, planData, gProteina, gGrasa]);

  const numComidas = parseInt(alumno?.nutricion?.comidas || 3);

  const agregarAlimento = async (alimento: any) => {
    if (comidaDestino === null) return;
    const nuevasComidas = planData.dietaDetalle || {};
    const claveComida = `comida${comidaDestino}`;
    
    if (!nuevasComidas[claveComida]) nuevasComidas[claveComida] = [];
    nuevasComidas[claveComida].push({ ...alimento, idRef: Date.now() });

    try {
      await updateDoc(doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string), {
        dietaDetalle: nuevasComidas,
        gProteina,
        gGrasa,
        macrosCalculados: macros
      });
      setBusqueda('');
      setComidaDestino(null);
    } catch (e) { Alert.alert("Error", "No se pudo agregar"); }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{nombreAlumno}</Text>
          <Text style={styles.headerSub}>{numComidas} Comidas Solicitadas</Text>
        </View>
        <View style={styles.kcalBadge}><Text style={styles.kcalBadgeText}>{planData?.caloriasMeta} kcal</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* CONFIGURACIÓN DE MACROS */}
        <View style={styles.macroCard}>
          <Text style={styles.cardTitle}>Configurar Macros (g/kg)</Text>
          <View style={styles.macroGrid}>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>PROT</Text>
                <TextInput style={styles.smallInput} value={String(gProteina)} keyboardType="numeric" onChangeText={t => setGProteina(parseFloat(t) || 0)} />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>GRASA</Text>
                <TextInput style={styles.smallInput} value={String(gGrasa)} keyboardType="numeric" onChangeText={t => setGGrasa(parseFloat(t) || 0)} />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>HC (Auto)</Text>
                <Text style={styles.autoVal}>{macros?.carbo}g</Text>
             </View>
          </View>
        </View>

        {/* SECCIONES DE COMIDAS */}
        {[...Array(numComidas)].map((_, i) => {
          const n = i + 1;
          const alimentosComida = planData?.dietaDetalle?.[`comida${n}`] || [];
          return (
            <View key={n} style={styles.comidaSection}>
              <View style={styles.comidaHeader}>
                <Text style={styles.comidaTitle}>COMIDA {n}</Text>
                <Pressable style={styles.btnAdd} onPress={() => setComidaDestino(n)}>
                  <FontAwesome5 name="plus" size={12} color="#fff" />
                  <Text style={styles.btnAddText}> Agregar</Text>
                </Pressable>
              </View>

              {alimentosComida.map((al: any) => (
                <View key={al.idRef} style={styles.alimentoItem}>
                  <Text style={styles.alimentoNombre}>{al.nombre}</Text>
                  <Text style={styles.alimentoKcal}>{al.proteina}P | {al.carbohidratos}C | {al.grasas}G</Text>
                </View>
              ))}

              {comidaDestino === n && (
                <View style={styles.searchBox}>
                  <TextInput 
                    placeholder="Escribe para buscar..." 
                    style={styles.searchInput}
                    autoFocus
                    onChangeText={setBusqueda}
                  />
                  {biblioteca.filter(f => f.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0,5).map(f => (
                    <Pressable key={f.id} style={styles.searchResult} onPress={() => agregarAlimento(f)}>
                      <Text>{f.nombre}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setComidaDestino(null)}><Text style={styles.cancelLink}>Cancelar</Text></Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  backBtn: { padding: 10, marginRight: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 13, color: '#64748b' },
  kcalBadge: { backgroundColor: '#1e293b', padding: 8, borderRadius: 10 },
  kcalBadgeText: { color: '#fff', fontWeight: 'bold' },
  scroll: { padding: 20 },
  macroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20 },
  cardTitle: { fontWeight: 'bold', marginBottom: 15 },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { alignItems: 'center' },
  label: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 5 },
  smallInput: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, width: 60, textAlign: 'center', fontWeight: 'bold' },
  autoVal: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  comidaSection: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  comidaTitle: { fontWeight: 'bold', color: '#1e293b' },
  btnAdd: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 6 },
  btnAddText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  alimentoItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alimentoNombre: { fontSize: 14, color: '#334155' },
  alimentoKcal: { fontSize: 11, color: '#94a3b8' },
  searchBox: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 10 },
  searchInput: { backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  searchResult: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cancelLink: { textAlign: 'center', color: '#ef4444', marginTop: 10, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});