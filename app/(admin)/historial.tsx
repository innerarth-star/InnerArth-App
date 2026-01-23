import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function HistorialAlumno() {
  const { id, nombre } = useLocalSearchParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Obtener datos del alumno para cálculos
    const obtenerDatos = async () => {
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAlumno(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    // 2. Escuchar los planes creados para este alumno específico
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

  // FUNCIÓN PARA CREAR NUEVO PLAN
  const crearNuevoPlan = async () => {
    try {
      const proximoNumero = planes.length + 1;
      await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${proximoNumero}`,
        numero: proximoNumero,
        fechaCreacion: serverTimestamp(),
        completado: false
      });
    } catch (error) {
      console.error("Error al crear plan:", error);
    }
  };

  // CÁLCULO DE METROMETRÍA (Mifflin-St Jeor)
  const calcularMetricas = () => {
    if (!alumno) return null;
    const peso = parseFloat(alumno.datosFisicos?.peso) || 0;
    const altura = parseFloat(alumno.datosFisicos?.altura) || 0;
    const edad = parseInt(alumno.datosFisicos?.edad) || 0;
    const genero = alumno.datosFisicos?.genero;
    
    // Factor de actividad basado en la info de actividad física/METs
    const factorActividad = 1.4; // Valor base, ajustable según tu lógica de METs

    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;
    
    const get = tmb * factorActividad;
    const obj = alumno.nutricion?.objetivo?.toLowerCase() || '';
    let final = get;
    let tipo = "Mantenimiento";

    if (obj.includes('perder') || obj.includes('definicion')) {
      final = get - 500;
      tipo = "Déficit";
    } else if (obj.includes('ganar') || obj.includes('volumen')) {
      final = get + 400;
      tipo = "Superávit";
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
        {/* Header con regreso a Mis Alumnos */}
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(admin)/alumnos' as any)} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{nombre}</Text>
            <Text style={styles.headerSub}>Historial de Planes</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tarjeta de Cálculos */}
          {metricas && (
            <View style={styles.metricsCard}>
              <Text style={styles.cardLabel}>OBJETIVO: {metricas.tipo}</Text>
              <Text style={styles.caloriesMain}>{metricas.final} kcal</Text>
              <View style={styles.divider} />
              <View style={styles.miniRow}>
                <Text style={styles.miniLabel}>Basal: {metricas.tmb}</Text>
                <Text style={styles.miniLabel}>Gasto Total: {metricas.get}</Text>
              </View>
            </View>
          )}

          {/* Sección de Planes */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes Asignados</Text>
            <Pressable style={styles.btnAdd} onPress={crearNuevoPlan}>
              <FontAwesome5 name="plus" size={14} color="#fff" />
              <Text style={styles.btnAddText}>Nuevo Plan</Text>
            </Pressable>
          </View>

          {planes.map((plan) => (
            <Pressable 
              key={plan.id} 
              style={styles.folderCard}
              onPress={() => router.push({ pathname: '/(admin)/editorPlan' as any, params: { planId: plan.id, alumnoId: id } })}
            >
              <FontAwesome5 name="folder" size={24} color="#3b82f6" style={{ opacity: 0.8 }} />
              <View style={styles.folderInfo}>
                <Text style={styles.folderTitle}>{plan.titulo}</Text>
                <Text style={styles.folderSub}>Creado el: {plan.fechaCreacion?.toDate().toLocaleDateString() || 'Reciente'}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
            </Pressable>
          ))}

          {planes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay planes creados aún.</Text>
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
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25 },
  cardLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  caloriesMain: { color: '#fff', fontSize: 42, fontWeight: 'bold', marginVertical: 10 },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 15 },
  miniRow: { flexDirection: 'row', gap: 20 },
  miniLabel: { color: '#cbd5e1', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnAdd: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, gap: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  folderCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  folderInfo: { flex: 1, marginLeft: 15 },
  folderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  folderSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});