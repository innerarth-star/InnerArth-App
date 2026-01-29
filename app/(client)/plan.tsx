import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MiPlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [verDetalle, setVerDetalle] = useState(false); // Para colapsar/expandir si lo deseas

useEffect(() => {
    if (!auth.currentUser) return;

    // Quitamos el orderBy para evitar que Firebase se quede "pensando"
    // Buscamos directamente en la carpeta que ya sabemos que funciona
    const q = query(
      collection(db, "alumnos_activos", auth.currentUser.uid, "planes_publicados"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        console.log("Plan cargado con éxito");
        setPlan(snap.docs[0].data());
      } else {
        console.log("No se encontró ningún documento en planes_publicados");
      }
      setCargando(false);
    }, (error) => {
      console.error("Error de Firebase:", error);
      setCargando(false);
    });

    return () => unsub();
  }, []);

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!plan) return (
    <View style={styles.centro}>
      <FontAwesome5 name="clipboard-list" size={50} color="#cbd5e1" />
      <Text style={styles.vacioTxt}>Aún no tienes un plan activo.</Text>
    </View>
  );

  const totales = plan.totalesFinales || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        {/* CABECERA DE PLAN ACTUAL */}
        <View style={styles.mainPlanCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planStatus}>PLAN ACTUAL</Text>
              <Text style={styles.planName}>{plan.nombreAlumno || 'Mi Entrenamiento'}</Text>
            </View>
            <FontAwesome5 name="award" size={24} color="#3b82f6" />
          </View>

          {/* BLOQUE UNIFICADO DE MACROS */}
          <View style={styles.macroGrid}>
            <View style={styles.macroBox}>
              <Text style={styles.mVal}>{Number(totales.p || 0).toFixed(0)}g</Text>
              <Text style={styles.mLab}>Prot</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.mVal}>{Number(totales.c || 0).toFixed(0)}g</Text>
              <Text style={styles.mLab}>Carbs</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.mVal}>{Number(totales.g || 0).toFixed(0)}g</Text>
              <Text style={styles.mLab}>Grasas</Text>
            </View>
            <View style={[styles.macroBox, { backgroundColor: '#3b82f6' }]}>
              <Text style={[styles.mVal, { color: '#fff' }]}>{Math.round(totales.kcal || 0)}</Text>
              <Text style={[styles.mLab, { color: '#fff', opacity: 0.8 }]}>Kcal</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN DIETA COLAPSABLE O EN BLOQUE */}
        <Text style={styles.sectionTitle}>Estructura Nutricional</Text>
        <View style={styles.contentBlock}>
          {plan.dieta?.map((item: any, i: number) => (
            <View key={i} style={[styles.listRow, i === plan.dieta.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{flex: 1}}>
                <Text style={styles.itemTitle}>{item.nombre}</Text>
                <Text style={styles.itemSub}>{item.cantidad} {item.unidadMedida} • {item.grupo}</Text>
              </View>
              <Text style={styles.itemKcal}>{item.calorias} kcal</Text>
            </View>
          ))}
        </View>

        {/* SECCIÓN RUTINA */}
        <Text style={styles.sectionTitle}>Entrenamiento Semanal</Text>
        <View style={styles.contentBlock}>
          {plan.rutina?.map((ej: any, i: number) => (
            <View key={i} style={[styles.listRow, i === plan.rutina.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.dayBadge}><Text style={styles.dayText}>{ej.dia}</Text></View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.itemTitle}>{ej.nombre}</Text>
                <Text style={styles.itemSub}>{ej.seriesReps} • {ej.grupo}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainPlanCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  planStatus: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  planName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBox: { flex: 1, backgroundColor: '#f8fafc', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  mVal: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  mLab: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginLeft: 5, marginBottom: 10, marginTop: 5 },
  contentBlock: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  itemSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemKcal: { fontSize: 13, fontWeight: 'bold', color: '#3b82f6' },
  dayBadge: { backgroundColor: '#3b82f6', width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dayText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  vacioTxt: { marginTop: 15, color: '#64748b' }
});