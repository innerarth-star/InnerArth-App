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

  useEffect(() => {
    if (!id) return;

    const cargarDatos = async () => {
      try {
        const docRef = doc(db, "alumnos_activos", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // ESTO ES LO MÁS IMPORTANTE: Mira tu consola de VS Code o del Navegador (F12)
          console.log("--- DIAGNÓSTICO DE ALUMNO ---");
          console.log("ID buscado:", id);
          console.log("Contenido Real en Firebase:", JSON.stringify(data, null, 2));
          setAlumno(data);
        } else {
          console.error("EL DOCUMENTO NO EXISTE EN alumnos_activos con ID:", id);
        }

        // Cargar planes
        const q = query(collection(db, "alumnos_activos", id as string, "planes"), orderBy("numero", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
          const lista: any[] = [];
          snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
          setPlanes(lista);
          setCargando(false);
        });

        return unsub;
      } catch (error) {
        console.error("Error en la carga:", error);
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id]);

  const calcularMetricas = () => {
    if (!alumno) return null;

    // Intento leer peso de varias formas posibles
    const peso = parseFloat(alumno.datosFisicos?.peso || alumno.peso || 0);
    const altura = parseFloat(alumno.datosFisicos?.altura || alumno.altura || 0);
    const edad = parseInt(alumno.datosFisicos?.edad || alumno.edad || 0);
    const genero = (alumno.datosFisicos?.genero || alumno.genero || 'hombre').toLowerCase();

    if (!peso || !altura || !edad) return null;

    // Cálculo rápido Mifflin-St Jeor
    let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
    tmb = genero === 'mujer' ? tmb - 161 : tmb + 5;
    
    // Factor actividad simplificado (x1.5 por defecto para ver si funciona)
    const get = tmb * 1.5;
    const final = get - ajusteCalorico;

    return { tmb: Math.round(tmb), get: Math.round(get), final: Math.round(final) };
  };

  const crearNuevoPlan = async () => {
    console.log("Intentando crear plan para el ID:", id);
    try {
      const num = planes.length + 1;
      const docRef = await addDoc(collection(db, "alumnos_activos", id as string, "planes"), {
        titulo: `Plan ${num}`,
        numero: num,
        fechaCreacion: serverTimestamp(),
        ajuste: ajusteCalorico
      });
      console.log("Plan creado con ID:", docRef.id);
    } catch (e) {
      console.error("Error al crear plan:", e);
    }
  };

  const m = calcularMetricas();

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
           <FontAwesome5 name="arrow-left" size={20} />
        </Pressable>
        <Text style={styles.title}>{nombre}</Text>
      </View>

      {m ? (
        <View style={styles.card}>
          <Text style={styles.calText}>{m.final} kcal</Text>
          <Text style={styles.subText}>TMB: {m.tmb} | GET: {m.get}</Text>
        </View>
      ) : (
        <View style={styles.errorBox}>
          <Text>No se detectan datos físicos en el perfil.</Text>
          <Pressable onPress={() => console.log("DATA ACTUAL:", alumno)} style={styles.btnDebug}>
            <Text style={{color:'#fff'}}>LOG DATA EN CONSOLA</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planes</Text>
        <Pressable onPress={crearNuevoPlan} style={styles.btnPlan}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>+ CREAR NUEVO PLAN</Text>
        </Pressable>
      </View>

      {planes.map(p => (
        <View key={p.id} style={styles.planItem}>
          <Text style={{fontWeight: 'bold'}}>{p.titulo}</Text>
          <FontAwesome5 name="chevron-right" />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', margin: 20, padding: 30, borderRadius: 20, alignItems: 'center' },
  calText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  subText: { color: '#94a3b8', marginTop: 10 },
  errorBox: { margin: 20, padding: 20, backgroundColor: '#fee2e2', borderRadius: 10, alignItems: 'center' },
  btnDebug: { backgroundColor: '#000', padding: 10, marginTop: 10, borderRadius: 5 },
  section: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  btnPlan: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  planItem: { backgroundColor: '#fff', marginHorizontal: 20, marginVertical: 5, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' }
});