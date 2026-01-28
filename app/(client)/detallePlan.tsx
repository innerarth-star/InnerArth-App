import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function DetallePlanScreen() {
  const { planId } = useLocalSearchParams();
  const [tab, setTab] = useState<'dieta' | 'rutina'>('dieta');
  const [plan, setPlan] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser || !planId) return;

    // Escuchamos el plan específico que seleccionó el alumno
    const planRef = doc(db, "alumnos_activos", auth.currentUser.uid, "planes_publicados", planId as string);
    
    const unsub = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlan(docSnap.data());
      }
      setCargando(false);
    });

    return () => unsub();
  }, [planId]);

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!plan) return (
    <View style={styles.centro}>
      <Text>No se encontró el plan.</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}><Text style={{color:'#fff'}}>Volver</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Plan</Text>
      </View>

      {/* SELECTOR DE PESTAÑAS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'dieta' && styles.tabActive]} 
          onPress={() => setTab('dieta')}
        >
          <FontAwesome5 name="utensils" size={16} color={tab === 'dieta' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, tab === 'dieta' && styles.tabTextActive]}>Dieta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, tab === 'rutina' && styles.tabActive]} 
          onPress={() => setTab('rutina')}
        >
          <FontAwesome5 name="dumbbell" size={16} color={tab === 'rutina' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, tab === 'rutina' && styles.tabTextActive]}>Rutina</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'dieta' ? (
          <View>
            <Text style={styles.seccionTitle}>Menú Diario</Text>
            {/* Aquí asumo que guardas las comidas en un array o objeto */}
            {plan.comidas?.map((comida: any, index: number) => (
              <View key={index} style={styles.cardInfo}>
                <Text style={styles.comidaName}>Comida {index + 1}</Text>
                <Text style={styles.comidaDetalle}>{comida.descripcion || 'Sin descripción'}</Text>
              </View>
            )) || <Text style={styles.vacioTxt}>No hay comidas registradas.</Text>}
          </View>
        ) : (
          <View>
            <Text style={styles.seccionTitle}>Rutina de Entrenamiento</Text>
            {plan.ejercicios?.map((ej: any, index: number) => (
              <View key={index} style={styles.cardInfo}>
                <Text style={styles.ejercicioName}>{ej.nombre}</Text>
                <Text style={styles.ejercicioSets}>{ej.series} series x {ej.reps} reps</Text>
              </View>
            )) || <Text style={styles.vacioTxt}>No hay ejercicios registrados.</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, margin: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, gap: 8, borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  scroll: { padding: 15 },
  seccionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
  cardInfo: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaName: { fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 },
  comidaDetalle: { fontSize: 14, color: '#475569', lineHeight: 20 },
  ejercicioName: { fontWeight: 'bold', color: '#10b981' },
  ejercicioSets: { fontSize: 13, color: '#64748b' },
  btnVolver: { marginTop: 20, backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  vacioTxt: { textAlign: 'center', color: '#94a3b8', marginTop: 20 }
});