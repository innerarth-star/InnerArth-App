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
      } catch (error) {
        console.error("Error al obtener alumno:", error);
      }
    };

    const q = query(
      collection(db, "alumnos_activos", id as string, "planes"),
      orderBy("numero", "desc")
    );

    const unsubPlanes = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
      setPlanes(lista);
      setCargando(false);
    });

    obtenerDatos();
    return () => unsubPlanes();
  }, [id]);

  const crearNuevoPlan = async () => {
    try {
      const proximoNumero = planes.length > 0 ? Math.max(...planes.map(p => p.numero)) + 1 : 1;
      await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${proximoNumero}`,
        numero: proximoNumero,
        fechaCreacion: serverTimestamp(),
        ajusteAplicado: ajusteCalorico
      });
    } catch (error) {
      console.error("Error al crear plan:", error);
    }
  };

  const confirmarEliminar = (planId: string, titulo: string) => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`¿Estás seguro de eliminar el ${titulo}?`);
      if (confirmar) eliminarPlan(planId);
    } else {
      Alert.alert(
        "Eliminar Plan",
        `¿Borrar el ${titulo}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => eliminarPlan(planId) }
        ]
      );
    }
  };

  const eliminarPlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, "alumnos_activos", id as string, "planes", planId));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const calcularMetricas = () => {
    if (!alumno) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso) || 0;
    const altura = parseFloat(alumno.datosFisicos?.altura) || 0;
    const edad = parseInt(alumno.datosFisicos?.edad) || 0;
    const genero = alumno.datosFisicos?.genero;
    
    // Aquí podrías usar una lógica más compleja de METs si la tienes guardada
    const factorActividad = 1.4; 

    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;
    const get = tmb * factorActividad;
    
    const obj = alumno.nutricion?.objetivo?.toLowerCase() || '';
    let final = get;
    let tipo = "Mantenimiento";

    if (obj.includes('perder') || obj.includes('definicion')) {
      final = get - ajusteCalorico;
      tipo = `Déficit (-${ajusteCalorico})`;
    } else if (obj.includes('ganar') || obj.includes('volumen')) {
      final = get + ajusteCalorico;
      tipo = `Superávit (+${ajusteCalorico})`;
    }

    return { tmb: Math.round(tmb), get: Math.round(get), final: Math.round(final), tipo };
  };

  const metricas = calcularMetricas();

  if (cargando) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{nombre}</Text>
            <Text style={styles.headerSub}>Ajuste Metabólico y Planes</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {metricas && (
            <View style={styles.metricsCard}>
              <Text style={styles.cardLabel}>OBJETIVO: {metricas.tipo}</Text>
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              
              <Text style={styles.selectorTitle}>Ajustar Margen (kcal):</Text>
              <View style={styles.selectorRow}>
                {rangosAjuste.map((valor) => (
                  <Pressable 
                    key={valor} 
                    onPress={() => setAjusteCalorico(valor)}
                    style={[styles.chip, ajusteCalorico === valor && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, ajusteCalorico === valor && styles.chipTextActive]}>
                      {valor}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />
              <View style={styles.miniRow}>
                <Text style={styles.miniLabel}>Basal: {metricas.tmb}</Text>
                <Text style={styles.miniLabel}>Gasto Total: {metricas.get}</Text>
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <FontAwesome5 name="plus" size={14} color="#fff" />
              <Text style={styles.btnAddText}>Nuevo</Text>
            </Pressable>
          </View>

          {planes.map((plan) => (
            <View key={plan.id} style={styles.folderCard}>
              <Pressable 
                style={styles.folderMain}
                onPress={() => router.push({ 
                  pathname: '/(admin)/editorPlan' as any, 
                  params: { planId: plan.id, alumnoId: id, nombreAlumno: nombre } 
                })}
              >
                <FontAwesome5 name="folder" size={24} color="#3b82f6" />
                <View style={styles.folderInfo}>
                  <Text style={styles.folderTitle}>{plan.titulo}</Text>
                  <Text style={styles.folderSub}>Margen: {plan.ajusteAplicado || '300'} kcal</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={16} color="#cbd5e1" />
              </Pressable>
              
              <Pressable onPress={() => confirmarEliminar(plan.id, plan.titulo)} style={styles.btnDelete}>
                <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
              </Pressable>
            </View>
          ))}

          {planes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay planes. Haz clic en "Nuevo" para empezar.</Text>
            </View>
          )}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25 },
  cardLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  caloriesMain: { color: '#fff', fontSize: 44, fontWeight: 'bold', marginVertical: 10 },
  selectorTitle: { color: '#cbd5e1', fontSize: 12, marginTop: 15, marginBottom: 10 },
  selectorRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  chip: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#475569' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  miniRow: { flexDirection: 'row', gap: 20 },
  miniLabel: { color: '#cbd5e1', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnAdd: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, gap: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  folderCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  folderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18 },
  folderInfo: { flex: 1, marginLeft: 15 },
  folderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  folderSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  btnDelete: { paddingHorizontal: 20, height: 80, justifyContent: 'center', backgroundColor: '#fff5f5', borderLeftWidth: 1, borderLeftColor: '#fee2e2' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 13 }
});