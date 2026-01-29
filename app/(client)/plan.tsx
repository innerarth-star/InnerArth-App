import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MiPlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Buscamos en la colección que confirmaste
    const q = query(
      collection(db, "alumnos_activos", auth.currentUser.uid, "planes_publicados"),
      orderBy("fechaPublicacion", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setPlan(snap.docs[0].data());
      }
      setCargando(false);
    }, (error) => {
      console.error("Error:", error);
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

  // Extraemos los totales de la carpeta totalesFinales que vimos en tu Firebase
  const totales = plan.totalesFinales || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* MACROS BASADOS EN TUS MAPAS (p, c, g, kcal) */}
        <Text style={styles.seccionTitle}>Resumen Nutricional Total</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{Number(totales.p || 0).toFixed(1)}g</Text>
            <Text style={styles.macroLab}>Prot</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{Number(totales.c || 0).toFixed(1)}g</Text>
            <Text style={styles.macroLab}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{Number(totales.g || 0).toFixed(1)}g</Text>
            <Text style={styles.macroLab}>Grasas</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroVal, {color:'#3b82f6'}]}>{Math.round(totales.kcal || 0)}</Text>
            <Text style={styles.macroLab}>Kcal</Text>
          </View>
        </View>

        {/* DIETA BASADA EN TU ARRAY 'dieta' */}
        <Text style={styles.seccionTitle}>Tu Dieta ({plan.dieta?.length || 0} alimentos)</Text>
        {plan.dieta?.map((item: any, i: number) => (
          <View key={i} style={styles.infoCard}>
            <View style={styles.row}>
                <Text style={styles.infoTitle}>{item.nombre}</Text>
                <Text style={styles.tag}>{item.grupo}</Text>
            </View>
            <Text style={styles.infoDesc}>
                {item.cantidad} {item.unidadMedida} - {item.calorias} kcal
            </Text>
            <Text style={styles.miniDetail}>P: {item.proteina}g | C: {item.carbohidratos}g | G: {item.grasa}g</Text>
          </View>
        ))}

        {/* RUTINA BASADA EN TU ARRAY 'rutina' */}
        <Text style={styles.seccionTitle}>Tu Rutina Semanal</Text>
        {plan.rutina?.map((ej: any, i: number) => (
          <View key={i} style={[styles.infoCard, { borderLeftColor: '#10b981', borderLeftWidth: 4 }]}>
            <View style={styles.row}>
                <Text style={[styles.infoTitle, {color:'#10b981'}]}>{ej.nombre}</Text>
                <Text style={[styles.tag, {backgroundColor: '#ecfdf5', color: '#10b981'}]}>{ej.dia}</Text>
            </View>
            <Text style={styles.infoDesc}>{ej.seriesReps} - {ej.tipo}</Text>
            {ej.notas ? <Text style={styles.notas}>Nota: {ej.notas}</Text> : null}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  seccionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, marginTop: 10 },
  macroCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 25, elevation: 3 },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  macroLab: { fontSize: 12, color: '#64748b' },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTitle: { fontWeight: 'bold', color: '#3b82f6', fontSize: 15, flex: 1 },
  infoDesc: { fontSize: 14, color: '#475569', fontWeight: '500' },
  miniDetail: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
  notas: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 5 },
  tag: { fontSize: 10, fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  vacioTxt: { marginTop: 15, color: '#64748b' }
});