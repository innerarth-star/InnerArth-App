import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditorPlan() {
  const { planId, alumnoId, nombreAlumno } = useLocalSearchParams();
  const [tab, setTab] = useState<'dieta' | 'entreno'>('dieta');
  const [planData, setPlanData] = useState<any>(null);
  const [busquedaAlimento, setBusquedaAlimento] = useState('');
  const [alimentosBiblioteca, setAlimentosBiblioteca] = useState<any[]>([]);
  
  const router = useRouter();

  // 1. Cargar datos del plan y biblioteca de alimentos
  useEffect(() => {
    if (!planId || !alumnoId) return;

    // Datos del Plan
    const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
    const unsubPlan = onSnapshot(planRef, (doc) => {
      if (doc.exists()) setPlanData(doc.data());
    });

    // Biblioteca de Alimentos (tus 55 alimentos)
    const qAlimentos = query(collection(db, "biblioteca_alimentos"));
    const unsubAlimentos = onSnapshot(qAlimentos, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
      setAlimentosBiblioteca(lista);
    });

    return () => { unsubPlan(); unsubAlimentos(); };
  }, [planId, alumnoId]);

  const agregarAlimentoAPlan = async (alimento: any) => {
    try {
      const planRef = doc(db, "alumnos_activos", alumnoId as string, "planes", planId as string);
      await updateDoc(planRef, {
        comidas: arrayUnion({
          ...alimento,
          cantidad: 100, // Por defecto 100g
          idInstancia: Date.now().toString()
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con Info de Calorías */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="chevron-left" size={20} color="#1e293b" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>{nombreAlumno}</Text>
          <Text style={styles.headerSub}>Meta: {planData?.caloriasMeta || 0} kcal</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('dieta')} style={[styles.tab, tab === 'dieta' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'dieta' && styles.tabTextActive]}>Dieta</Text>
        </Pressable>
        <Pressable onPress={() => setTab('entreno')} style={[styles.tab, tab === 'entreno' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'entreno' && styles.tabTextActive]}>Entrenamiento</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'dieta' ? (
          <View>
            <Text style={styles.sectionTitle}>Armar Dieta</Text>
            {/* Buscador de Alimentos */}
            <View style={styles.searchBar}>
              <FontAwesome5 name="search" size={14} color="#94a3b8" />
              <TextInput 
                placeholder="Buscar en biblioteca..." 
                style={styles.input}
                value={busquedaAlimento}
                onChangeText={setBusquedaAlimento}
              />
            </View>

            {/* Resultados de Búsqueda */}
            {busquedaAlimento.length > 1 && (
              <View style={styles.resultsBox}>
                {alimentosBiblioteca.filter(a => a.nombre.toLowerCase().includes(busquedaAlimento.toLowerCase())).map(al => (
                  <Pressable key={al.id} style={styles.resultItem} onPress={() => {
                    agregarAlimentoAPlan(al);
                    setBusquedaAlimento('');
                  }}>
                    <Text>{al.nombre}</Text>
                    <FontAwesome5 name="plus-circle" color="#3b82f6" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Lista de Comidas del Plan */}
            <View style={styles.planDieta}>
              {planData?.comidas?.map((item: any) => (
                <View key={item.idInstancia} style={styles.comidaCard}>
                  <Text style={styles.comidaNombre}>{item.nombre}</Text>
                  <Text style={styles.comidaKcal}>{item.kcal || 0} kcal / 100g</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Rutina de Entrenamiento</Text>
            <TextInput 
              placeholder="Escribe la rutina aquí..."
              multiline
              numberOfLines={10}
              style={styles.textArea}
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={styles.btnSave}>
              <Text style={styles.btnSaveText}>GUARDAR ENTRENAMIENTO</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 10, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#f1f5f9' },
  tabText: { fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#3b82f6' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 10 },
  resultsBox: { backgroundColor: '#fff', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3 },
  resultItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  planDieta: { marginTop: 20 },
  comidaCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  comidaNombre: { fontWeight: 'bold' },
  comidaKcal: { fontSize: 12, color: '#64748b' },
  textArea: { backgroundColor: '#fff', borderRadius: 12, padding: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0', height: 200 },
  btnSave: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});