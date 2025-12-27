import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView, ScrollView } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Definición de grupos y sus unidades según lo que pediste
const GRUPOS_ALIMENTOS = [
    { nombre: 'Verduras', unidades: ['taza', 'pieza', 'cucharada'] },
    { nombre: 'Frutas', unidades: ['pieza', 'taza'] },
    { nombre: 'Lácteos', unidades: ['taza', 'pieza'] },
    { nombre: 'Leguminosas', unidades: ['taza'] },
    { nombre: 'Cereales', unidades: ['taza', 'pieza', 'rebanada'] },
    { nombre: 'Aceites', unidades: ['cucharada', 'pieza'] },
    { nombre: 'Azúcares', unidades: ['taza', 'cucharada'] },
  // Aquí agregamos tu medida específica de 35g
    { nombre: 'Origen Animal', unidades: ['porción (35g)', 'gr', 'pieza', 'rebanada'] },
];

export default function BibliotecaAlimentos() {
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState(GRUPOS_ALIMENTOS[0]);
  const [unidad, setUnidad] = useState(GRUPOS_ALIMENTOS[0].unidades[0]);
  const [calorias, setCalorias] = useState('');
  const [proteina, setProteina] = useState('');
  const [grasa, setGrasa] = useState('');
  const [carbs, setCarbs] = useState('');
  const [alimentos, setAlimentos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "alimentos"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAlimentos(lista.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    });
    return () => unsub();
  }, []);

  const guardarAlimento = async () => {
    if (!nombre || !calorias || !proteina) {
      Alert.alert("Error", "Nombre, Calorías y Proteína son obligatorios.");
      return;
    }

    try {
      await addDoc(collection(db, "alimentos"), {
        nombre: nombre.toLowerCase().trim(),
        grupo: grupo.nombre,
        unidadMedida: unidad,
        calorias: parseFloat(calorias),
        proteina: parseFloat(proteina),
        grasa: parseFloat(grasa || "0"),
        carbohidratos: parseFloat(carbs || "0"),
        fechaCreacion: new Date()
      });
      
      setNombre(''); setCalorias(''); setProteina(''); setGrasa(''); setCarbs('');
      Alert.alert("Éxito", "Alimento guardado por " + unidad);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Biblioteca de Alimentos</Text>
      
      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre del alimento (ej: Manzana)" 
          value={nombre} 
          onChangeText={setNombre} 
        />

        <Text style={styles.label}>Grupo de Alimento:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
          {GRUPOS_ALIMENTOS.map((g) => (
            <TouchableOpacity 
              key={g.nombre} 
              onPress={() => { setGrupo(g); setUnidad(g.unidades[0]); }}
              style={[styles.chip, grupo.nombre === g.nombre && styles.chipActive]}
            >
              <Text style={[styles.chipText, grupo.nombre === g.nombre && styles.chipTextActive]}>{g.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

<Text style={styles.label}>Selecciona la Unidad de Medida:</Text>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
  {grupo.unidades.map((u) => (
    <TouchableOpacity 
      key={u} 
      onPress={() => setUnidad(u)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: unidad === u ? '#3b82f6' : '#e2e8f0',
        backgroundColor: unidad === u ? '#eff6ff' : '#fff',
        minWidth: '30%',
        alignItems: 'center'
      }}
    >
      <Text style={{ 
        color: unidad === u ? '#3b82f6' : '#64748b', 
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase'
      }}>{u}</Text>
    </TouchableOpacity>
  ))}
</View>

        <View style={styles.gridInputs}>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Kcal</Text><TextInput style={styles.inputN} keyboardType="numeric" value={calorias} onChangeText={setCalorias} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Prot (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={proteina} onChangeText={setProteina} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Grasa (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={grasa} onChangeText={setGrasa} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Carbs (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={carbs} onChangeText={setCarbs} placeholder="0"/></View>
        </View>

        <TouchableOpacity style={styles.btnGuardar} onPress={guardarAlimento}>
          <Text style={styles.btnText}>Agregar a Biblioteca</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alimentos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{flex: 1}}>
              <Text style={styles.itemName}>{item.nombre.toUpperCase()}</Text>
              <Text style={styles.itemSub}>{item.grupo} • 1 {item.unidadMedida}</Text>
            </View>
            <View style={{alignItems: 'flex-end', marginRight: 15}}>
              <Text style={styles.itemMacros}>{item.calorias} kcal</Text>
              <Text style={styles.itemMacrosSub}>P: {item.proteina}g G: {item.grasa}g C: {item.carbohidratos}g</Text>
            </View>
            <TouchableOpacity onPress={() => deleteDoc(doc(db, "alimentos", item.id))}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, marginTop: 10 },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 4, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 10 },
  selector: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 11, color: '#64748b' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  unitBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', flex: 1, alignItems: 'center' },
  unitBtnActive: { backgroundColor: '#e0f2fe', borderColor: '#3b82f6' },
  unitText: { fontSize: 11, color: '#64748b' },
  unitTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  gridInputs: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  boxInput: { flex: 1, alignItems: 'center' },
  miniLabel: { fontSize: 9, color: '#94a3b8', marginBottom: 4 },
  inputN: { backgroundColor: '#f1f5f9', width: '100%', textAlign: 'center', padding: 8, borderRadius: 8, fontWeight: 'bold' },
  btnGuardar: { backgroundColor: '#22c55e', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  itemName: { fontWeight: 'bold', color: '#1e293b', fontSize: 14 },
  itemSub: { fontSize: 10, color: '#64748b' },
  itemMacros: { fontWeight: 'bold', color: '#3b82f6', fontSize: 13 },
  itemMacrosSub: { fontSize: 9, color: '#94a3b8' }
});