import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachPanel() {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para la calculadora de macros
  const [objetivo, setObjetivo] = useState<'deficit' | 'mantenimiento' | 'superavit'>('mantenimiento');
  const [ajusteKcal, setAjusteKcal] = useState('500');
  const [ratioProt, setRatioProt] = useState('2.2'); // g/kg
  const [ratioGrasa, setRatioGrasa] = useState('0.8'); // g/kg

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), where("status", "==", "pendiente"));
    const unsubscribe = onSnapshot(q, (sn) => {
      setPendientes(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, (err) => { setCargando(false); });
    return () => unsubscribe();
  }, []);

  const renderList = (data: any) => {
    if (!data) return 'Ninguno';
    if (Array.isArray(data)) return data.length > 0 ? data.join(', ') : 'Ninguno';
    return String(data);
  };

  // --- LÓGICA DE CÁLCULO DE MACROS ---
  const calcularTodo = () => {
    const p = parseFloat(seleccionado?.peso) || 0;
    const a = parseFloat(seleccionado?.altura) || 0;
    const e = parseInt(seleccionado?.edad) || 0;
    const rP = parseFloat(ratioProt) || 2.2;
    const rG = parseFloat(ratioGrasa) || 0.8;

    // 1. TDEE (Harris-Benedict simplificado con factor actividad 1.55)
    let tmb = (10 * p) + (6.25 * a) - (5 * e) + (seleccionado?.genero === 'hombre' ? 5 : -161);
    let tdee = Math.round(tmb * 1.55) || 0;

    // 2. Calorías Finales según objetivo
    let ajuste = parseInt(ajusteKcal) || 0;
    let final = objetivo === 'deficit' ? tdee - ajuste : objetivo === 'superavit' ? tdee + ajuste : tdee;

    // 3. Macros
    const protG = Math.round(p * rP);
    const grasaG = Math.round(p * rG);
    const restosKcal = final - (protG * 4) - (grasaG * 9);
    const carboG = Math.round(restosKcal / 4) || 0;

    return { tdee, final, protG, grasaG, carboG };
  };

  const { tdee, final, protG, grasaG, carboG } = calcularTodo();

  if (cargando) return <ActivityIndicator style={{flex:1}} size="large" color="#3b82f6" />;

  return (
    <SafeAreaView style={styles.safe}>
      {!seleccionado ? (
        <FlatList 
          data={pendientes} 
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<Text style={styles.mainTitle}>Revisiones Pendientes</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.clientCard} onPress={() => setSeleccionado(item)}>
              <Text style={styles.clientName}>{item.nombre || 'Sin Nombre'}</Text>
              <Text style={styles.clientSub}>{item.peso || '--'}kg | {item.preferencias?.objetivoDeseado || 'Revisión'}</Text>
            </TouchableOpacity>
          )} 
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
          <TouchableOpacity onPress={() => setSeleccionado(null)} style={styles.btnBack}>
            <Text style={{color: '#3b82f6', fontWeight: 'bold'}}>← REGRESAR A LISTA</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>{seleccionado.nombre}</Text>

          {/* DATOS PERSONALES */}
          <View style={[styles.infoCard, { borderLeftColor: '#3b82f6' }]}>
            <View style={styles.rowTitle}>
              <FontAwesome5 name="user" size={14} color="#3b82f6" />
              <Text style={[styles.cardHeader, {color: '#3b82f6'}]}> DATOS PERSONALES</Text>
            </View>
            <Text style={styles.infoT}>• Edad: {seleccionado.edad || '--'} años | Género: {seleccionado.genero?.toUpperCase()}</Text>
            <Text style={styles.infoT}>• Peso: {seleccionado.peso}kg | Altura: {seleccionado.altura}cm</Text>
          </View>

          {/* MEDIDAS CORPORALES */}
          <View style={[styles.infoCard, { borderLeftColor: '#10b981' }]}>
            <View style={styles.rowTitle}>
              <FontAwesome5 name="ruler-combined" size={14} color="#10b981" />
              <Text style={[styles.cardHeader, {color: '#10b981'}]}> MEDIDAS CORPORALES (cm)</Text>
            </View>
            <Text style={styles.infoT}>• Cintura: {seleccionado.medidas?.cintura} | Cuello: {seleccionado.medidas?.cuello}</Text>
            <Text style={styles.infoT}>• Brazo R: {seleccionado.medidas?.brazoR} | Brazo F: {seleccionado.medidas?.brazoF}</Text>
            <Text style={styles.infoT}>• Pierna: {seleccionado.medidas?.pierna} | Pantorrilla: {seleccionado.medidas?.pantorrilla}</Text>
          </View>

          {/* ACTIVIDAD FÍSICA */}
          <View style={[styles.infoCard, { borderLeftColor: '#f59e0b' }]}>
            <View style={styles.rowTitle}>
              <FontAwesome5 name="running" size={14} color="#f59e0b" />
              <Text style={[styles.cardHeader, {color: '#f59e0b'}]}> ACTIVIDAD FÍSICA</Text>
            </View>
            <Text style={styles.infoT}>• Actividades: {renderList(seleccionado.actividadFisica?.actividades)}</Text>
            <Text style={styles.infoT}>• Tiempo: {seleccionado.actividadFisica?.tiempo || seleccionado.actividadFisica?.minutos || 'No registrado'}</Text>
          </View>

          {/* SALUD */}
          <View style={[styles.infoCard, { borderLeftColor: '#ef4444' }]}>
            <View style={styles.rowTitle}>
              <FontAwesome5 name="heartbeat" size={14} color="#ef4444" />
              <Text style={[styles.cardHeader, {color: '#ef4444'}]}> SALUD Y ANTECEDENTES</Text>
            </View>
            <Text style={styles.infoT}>• Patologías: {renderList(seleccionado.historialClinico?.personales)}</Text>
            <Text style={styles.infoT}>• Herencia: {renderList(seleccionado.historialClinico?.familiares)}</Text>
          </View>

          {/* CALCULADORA DE MACROS - RESTAURADA */}
          <View style={styles.calcCard}>
            <Text style={styles.tdeeGrande}>{tdee} <Text style={{fontSize: 14}}>TDEE</Text></Text>
            <Text style={{color: '#94a3b8', textAlign: 'center', marginBottom: 15}}>Calorías Objetivo: {final} kcal</Text>
            
            <View style={styles.row}>
              <TouchableOpacity style={[styles.objBtn, objetivo === 'deficit' && {backgroundColor: '#ef4444'}]} onPress={() => setObjetivo('deficit')}><Text style={styles.objText}>DÉFICIT</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.objBtn, objetivo === 'mantenimiento' && {backgroundColor: '#3b82f6'}]} onPress={() => setObjetivo('mantenimiento')}><Text style={styles.objText}>MANTENER</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.objBtn, objetivo === 'superavit' && {backgroundColor: '#10b981'}]} onPress={() => setObjetivo('superavit')}><Text style={styles.objText}>SUPERÁVIT</Text></TouchableOpacity>
            </View>

            {/* Ajustes g/kg */}
            <View style={styles.inputRow}>
               <View style={styles.inputBox}><Text style={styles.inputLab}>Ajuste Kcal</Text><TextInput style={styles.smallInput} value={ajusteKcal} onChangeText={setAjusteKcal} keyboardType="numeric"/></View>
               <View style={styles.inputBox}><Text style={styles.inputLab}>Prot g/kg</Text><TextInput style={styles.smallInput} value={ratioProt} onChangeText={setRatioProt} keyboardType="numeric"/></View>
               <View style={styles.inputBox}><Text style={styles.inputLab}>Grasa g/kg</Text><TextInput style={styles.smallInput} value={ratioGrasa} onChangeText={setRatioGrasa} keyboardType="numeric"/></View>
            </View>

            {/* RESULTADO DE MACROS */}
            <View style={styles.macroDisplay}>
              <View style={styles.macroItem}><Text style={styles.macroVal}>{protG}g</Text><Text style={styles.macroLab}>PROTEÍNA</Text></View>
              <View style={styles.macroItem}><Text style={styles.macroVal}>{carboG}g</Text><Text style={styles.macroLab}>CARBOS</Text></View>
              <View style={styles.macroItem}><Text style={styles.macroVal}>{grasaG}g</Text><Text style={styles.macroLab}>GRASA</Text></View>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', margin: 25, marginTop: 60, color: '#1e293b' },
  clientCard: { backgroundColor: '#fff', padding: 20, marginHorizontal: 20, marginBottom: 10, borderRadius: 15 },
  clientName: { fontWeight: 'bold', fontSize: 16 },
  clientSub: { fontSize: 12, color: '#64748b' },
  btnBack: { margin: 20, marginTop: 40 },
  detailTitle: { fontSize: 26, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginHorizontal: 20, marginBottom: 10, borderLeftWidth: 6 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardHeader: { fontSize: 11, fontWeight: 'bold' },
  infoT: { fontSize: 13, color: '#334155', marginBottom: 2 },
  calcCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 25, marginHorizontal: 20, marginVertical: 10 },
  tdeeGrande: { color: '#fff', fontSize: 36, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 6, marginBottom: 15 },
  objBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  objText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  inputBox: { alignItems: 'center', flex: 1 },
  inputLab: { color: '#94a3b8', fontSize: 9, marginBottom: 5 },
  smallInput: { backgroundColor: '#0f172a', color: '#fff', padding: 8, borderRadius: 8, width: '80%', textAlign: 'center', fontSize: 12 },
  macroDisplay: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 15 },
  macroItem: { alignItems: 'center' },
  macroVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  macroLab: { color: '#94a3b8', fontSize: 8, fontWeight: 'bold' }
});