import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MiPlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // USAMOS LA RUTA QUE CONFIRMASTE EN FIREBASE
    const q = query(
      collection(db, "alumnos_activos", auth.currentUser.uid, "planes_publicados"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Guardamos los datos del plan encontrado
        setPlan(snap.docs[0].data());
      }
      setCargando(false);
    }, (error) => {
      console.error("Error al cargar plan:", error);
      setCargando(false);
    });

    return () => unsub();
  }, []);

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!plan) return (
    <View style={styles.centro}>
      <FontAwesome5 name="clipboard-list" size={50} color="#cbd5e1" />
      <Text style={styles.vacioTxt}>Aún no tienes información en tu plan.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* BLOQUE DE MACROS (Asegúrate que el Coach use estos nombres) */}
        <Text style={styles.seccionTitle}>Resumen Nutricional</Text>
        <View style={styles.macroCard}>
            <View style={styles.macroItem}>
            {/* Busca si se llama proteina, proteinas o prot */}
            <Text style={styles.macroVal}>{plan.proteina || plan.proteinas || plan.prot || 0}g</Text>
            <Text style={styles.macroLab}>Prot</Text>
        </View>
        <View style={styles.macroItem}>
            {/* Busca si se llama carbohidratos, carbs o carbo */}
            <Text style={styles.macroVal}>{plan.carbohidratos || plan.carbs || plan.carbo || 0}g</Text>
            <Text style={styles.macroLab}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
            {/* Busca si se llama grasas, grasa o fats */}
            <Text style={styles.macroVal}>{plan.grasas || plan.grasa || plan.fats || 0}g</Text>
            <Text style={styles.macroLab}>Grasas</Text>
        </View>
        <View style={styles.macroItem}>
            {/* Corregido: Usamos [style, {color}] con corchetes */}
            <Text style={[styles.macroVal, { color: '#3b82f6' }]}>
            {plan.calorias || plan.kcal || plan.cal || 0}
            </Text>
        <Text style={styles.macroLab}>Kcal</Text>
        </View>
        </View>

        {/* LISTA DE COMIDAS */}
        <Text style={styles.seccionTitle}>Tu Dieta Diaria</Text>
        {plan.comidas && plan.comidas.length > 0 ? (
          plan.comidas.map((c: any, i: number) => (
            <View key={i} style={styles.infoCard}>
              <Text style={styles.infoTitle}>Comida {i + 1}</Text>
              <Text style={styles.infoDesc}>{c.descripcion || "Sin descripción"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.vacioTxt}>No hay comidas registradas.</Text>
        )}

        {/* LISTA DE EJERCICIOS */}
        <Text style={styles.seccionTitle}>Tu Rutina</Text>
        {plan.ejercicios && plan.ejercicios.length > 0 ? (
          plan.ejercicios.map((e: any, i: number) => (
            <View key={i} style={styles.infoCard}>
              <Text style={[styles.infoTitle, {color:'#10b981'}]}>{e.nombre}</Text>
              <Text style={styles.infoDesc}>{e.series} series x {e.reps} reps</Text>
            </View>
          ))
        ) : (
          <Text style={styles.vacioTxt}>No hay ejercicios registrados.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  seccionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, marginTop: 10 },
  macroCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  macroLab: { fontSize: 12, color: '#64748b' },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTitle: { fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 },
  infoDesc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  vacioTxt: { marginTop: 10, color: '#94a3b8', fontSize: 14, textAlign: 'center' }
});