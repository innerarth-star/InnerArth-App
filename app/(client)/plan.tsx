import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MiPlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Buscamos el último plan publicado para este alumno
    const q = query(
      collection(db, "alumnos_activos", auth.currentUser.uid, "historial_planes"), orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setPlan(snap.docs[0].data());
      }
      setCargando(false);
    });

    return () => unsub();
  }, []);

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!plan) return (
    <View style={styles.centro}>
      <FontAwesome5 name="clipboard-list" size={50} color="#cbd5e1" />
      <Text style={styles.vacioTxt}>Aún no tienes un plan publicado.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* TARJETA DE MACROS */}
        <Text style={styles.seccionTitle}>Resumen Nutricional</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroItem}><Text style={styles.macroVal}>{plan.proteina || 0}g</Text><Text style={styles.macroLab}>Prot</Text></View>
          <View style={styles.macroItem}><Text style={styles.macroVal}>{plan.carbohidratos || 0}g</Text><Text style={styles.macroLab}>Carbs</Text></View>
          <View style={styles.macroItem}><Text style={styles.macroVal}>{plan.grasas || 0}g</Text><Text style={styles.macroLab}>Grasas</Text></View>
          <View style={styles.macroItem}><Text style={[styles.macroVal, {color:'#3b82f6'}]}>{plan.calorias || 0}</Text><Text style={styles.macroLab}>Kcal</Text></View>
        </View>

        {/* DIETA */}
        <Text style={styles.seccionTitle}>Tu Dieta</Text>
        {plan.comidas?.map((c: any, i: number) => (
          <View key={i} style={styles.infoCard}>
            <Text style={styles.infoTitle}>Comida {i + 1}</Text>
            <Text style={styles.infoDesc}>{c.descripcion}</Text>
          </View>
        ))}

        {/* RUTINA */}
        <Text style={styles.seccionTitle}>Tu Rutina</Text>
        {plan.ejercicios?.map((e: any, i: number) => (
          <View key={i} style={styles.infoCard}>
            <Text style={[styles.infoTitle, {color:'#10b981'}]}>{e.nombre}</Text>
            <Text style={styles.infoDesc}>{e.series} series x {e.reps} repeticiones</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  seccionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, marginTop: 10 },
  macroCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 25, elevation: 2 },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  macroLab: { fontSize: 12, color: '#64748b' },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTitle: { fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 },
  infoDesc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  vacioTxt: { marginTop: 15, color: '#64748b', textAlign: 'center' }
});