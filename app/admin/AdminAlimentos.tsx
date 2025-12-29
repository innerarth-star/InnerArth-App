import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';

const GRUPOS_ALIMENTOS = [
    { nombre: 'Verduras', unidades: ['taza', 'pieza', 'cucharada'] },
    { nombre: 'Frutas', unidades: ['pieza', 'taza'] },
    { nombre: 'Lácteos', unidades: ['taza', 'pieza'] },
    { nombre: 'Leguminosas', unidades: ['taza'] },
    { nombre: 'Cereales', unidades: ['taza', 'pieza', 'rebanada'] },
    { nombre: 'Aceites', unidades: ['cucharada', 'pieza'] },
    { nombre: 'Azúcares', unidades: ['taza', 'cucharada'] },
    { nombre: 'Origen Animal', unidades: ['gr', 'pieza', 'rebanada'] },
];

export default function BibliotecaAlimentos() {
    const router = useRouter();
    const navigation = useNavigation();
    const CORREO_COACH = "inner.arth@gmail.com";
    const user = auth.currentUser;
    const isCoach = user?.email?.toLowerCase().trim() === CORREO_COACH;

useEffect(() => {
    if (!isCoach) {
      // Si entra un cliente, le quitamos la barra para que no pueda picar nada
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
      // Y lo regresamos a su plan
      router.replace('/(client)/' as any);
    }
  }, [isCoach]);

  if (!isCoach) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }
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
    const lista = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as any));
    
    // ESTO ES CLAVE: Mira tu terminal de VS Code al guardar
    console.log("DEBUG: Alimentos bajados de Firebase ->", lista.length);
    
    setAlimentos(lista);
  });
  return () => unsub();
}, []);

  // --- FUNCIÓN DE CARGA MASIVA DESDE TU EXCEL ---
  const importarDatosDesdeExcel = async () => {
    const listaAlimentos = [
        { nombre: "verduras", grupo: "Verduras", unidadMedida: "taza", calorias: 25, proteina: 4, grasa: 0, carbohidratos: 8 },
        { nombre: "leche descremada", grupo: "Lácteos", unidadMedida: "taza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "leche de soya", grupo: "Lácteos", unidadMedida: "taza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "leche de almedras", grupo: "Lácteos", unidadMedida: "taza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "leche de arroz", grupo: "Lácteos", unidadMedida: "taza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "yogurt bajo en grasa", grupo: "Lácteos", unidadMedida: "pieza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "yogurt con fruta bajo en grasa", grupo: "Lácteos", unidadMedida: "pieza", calorias: 95, proteina: 9, grasa: 2, carbohidratos: 12 },
        { nombre: "leche semidescremada", grupo: "Lácteos", unidadMedida: "taza", calorias: 110, proteina: 9, grasa: 4, carbohidratos: 12 },
        { nombre: "yogurt griego", grupo: "Lácteos", unidadMedida: "pieza", calorias: 110, proteina: 9, grasa: 4, carbohidratos: 12 },
        { nombre: "leche entera", grupo: "Lácteos", unidadMedida: "taza", calorias: 150, proteina: 9, grasa: 5, carbohidratos: 12 },
        { nombre: "yogurt natural", grupo: "Lácteos", unidadMedida: "pieza", calorias: 150, proteina: 9, grasa: 5, carbohidratos: 12 },
        { nombre: "leche con azucar", grupo: "Lácteos", unidadMedida: "taza", calorias: 200, proteina: 8, grasa: 5, carbohidratos: 30 },
        { nombre: "yogurt con sabor", grupo: "Lácteos", unidadMedida: "taza", calorias: 200, proteina: 8, grasa: 5, carbohidratos: 30 },
        { nombre: "fruta", grupo: "Frutas", unidadMedida: "taza", calorias: 60, proteina: 0, grasa: 0, carbohidratos: 15 },
        { nombre: "frijol, lenteja, haba (1/2)", grupo: "Leguminosas", unidadMedida: "taza", calorias: 120, proteina: 8, grasa: 1, carbohidratos: 20 },
        { nombre: "amaranto (1/4)", grupo: "Cereales", unidadMedida: "taza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "arroz (1/4)", grupo: "Cereales", unidadMedida: "taza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "avena (1/3)", grupo: "Cereales", unidadMedida: "taza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "bolillo", grupo: "Cereales", unidadMedida: "pieza", calorias: 210, proteina: 6, grasa: 0, carbohidratos: 45 },
        { nombre: "cereal integral (1/2)", grupo: "Cereales", unidadMedida: "taza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "elote", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "pasta cocida (1/3)", grupo: "Cereales", unidadMedida: "taza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "granola (3)", grupo: "Cereales", unidadMedida: "cucharada", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "galletas marias (5)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "galletas saladas (4)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "hot cake", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "pan integral (1)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "pan tostado (1)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "papa", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "tortilla de maiz (1)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "torilla de harina", grupo: "Cereales", unidadMedida: "pieza", calorias: 140, proteina: 4, grasa: 0, carbohidratos: 30 },
        { nombre: "tostada horneada (2)", grupo: "Cereales", unidadMedida: "pieza", calorias: 70, proteina: 2, grasa: 0, carbohidratos: 15 },
        { nombre: "aceite", grupo: "Aceites", unidadMedida: "cucharada", calorias: 45, proteina: 0, grasa: 5, carbohidratos: 0 },
        { nombre: "aguacate", grupo: "Aceites", unidadMedida: "pieza", calorias: 135, proteina: 0, grasa: 15, carbohidratos: 0 },
        { nombre: "crema", grupo: "Aceites", unidadMedida: "cucharada", calorias: 45, proteina: 0, grasa: 5, carbohidratos: 0 },
        { nombre: "almendra (10)", grupo: "Aceites", unidadMedida: "pieza", calorias: 70, proteina: 3, grasa: 5, carbohidratos: 3 },
        { nombre: "cacahuate (14)", grupo: "Aceites", unidadMedida: "pieza", calorias: 70, proteina: 3, grasa: 5, carbohidratos: 3 },
        { nombre: "nueces (3)", grupo: "Aceites", unidadMedida: "pieza", calorias: 70, proteina: 3, grasa: 5, carbohidratos: 3 },
        { nombre: "pistache (18)", grupo: "Aceites", unidadMedida: "pieza", calorias: 70, proteina: 3, grasa: 5, carbohidratos: 3 },
        { nombre: "azucar", grupo: "Azúcares", unidadMedida: "cucharada", calorias: 40, proteina: 0, grasa: 0, carbohidratos: 10 },
        { nombre: "agua de sabor", grupo: "Azúcares", unidadMedida: "taza", calorias: 40, proteina: 0, grasa: 0, carbohidratos: 10 },
        { nombre: "miel", grupo: "Azúcares", unidadMedida: "cucharada", calorias: 20, proteina: 0, grasa: 0, carbohidratos: 5 },
        { nombre: "mermelada", grupo: "Azúcares", unidadMedida: "cucharada", calorias: 20, proteina: 0, grasa: 0, carbohidratos: 5 },
        { nombre: "atun", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "bistec de res", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "lomo de cerdo", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "pechuga de pollo", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "pescado", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "huevo", grupo: "Origen Animal", unidadMedida: "pieza", calorias: 55, proteina: 7, grasa: 5, carbohidratos: 0 },
        { nombre: "clara de huevo", grupo: "Origen Animal", unidadMedida: "pieza", calorias: 27.5, proteina: 3.5, grasa: 2.5, carbohidratos: 0 },
        { nombre: "jamon de pavo", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "requeson", grupo: "Origen Animal", unidadMedida: "cucharada", calorias: 18.75, proteina: 1.75, grasa: 1.25, carbohidratos: 0 },
        { nombre: "queso panela", grupo: "Origen Animal", unidadMedida: "gr", calorias: 1.65, proteina: 0.21, grasa: 0.09, carbohidratos: 0 },
        { nombre: "queso cottage", grupo: "Origen Animal", unidadMedida: "cucharada", calorias: 25, proteina: 2.3, grasa: 1.67, carbohidratos: 0 },
        { nombre: "proteina ISO", grupo: "Origen Animal", unidadMedida: "pieza", calorias: 110, proteina: 25, grasa: 0.5, carbohidratos: 0 },     
    ];

    try {
      for (const item of listaAlimentos) {
        await addDoc(collection(db, "alimentos"), {
          ...item,
          nombre: item.nombre.toLowerCase().trim(),
          fechaCreacion: new Date()
        });
      }
Alert.alert("Éxito", "Biblioteca actualizada a 1 gramo.");
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la lista.");
    }
  };

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
      Alert.alert("Éxito", "Guardado por 1 " + unidad);
    } catch (e) { Alert.alert("Error", "Falló el guardado."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Biblioteca de Alimentos</Text>
      
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre (ej: Manzana)" value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Grupo de Alimento:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
          {GRUPOS_ALIMENTOS.map((g) => (
            <TouchableOpacity key={g.nombre} onPress={() => { setGrupo(g); setUnidad(g.unidades[0]); }} style={[styles.chip, grupo.nombre === g.nombre && styles.chipActive]}>
              <Text style={[styles.chipText, grupo.nombre === g.nombre && styles.chipTextActive]}>{g.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Unidad de Medida:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
          {grupo.unidades.map((u) => (
            <TouchableOpacity key={u} onPress={() => setUnidad(u)} style={[styles.unitBtn, unidad === u && styles.unitBtnActive]}>
              <Text style={[styles.unitText, unidad === u && styles.unitTextActive]}>{u.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
{/* EL AVISO VA AQUÍ */}
        {unidad === 'gr' && (
          <View style={{ backgroundColor: '#fff7ed', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ffedd5' }}>
            <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: 'bold' }}>
              ⚠️ MODO PRECISIÓN: Ingresa los macros por cada 1 gramo.
            </Text>
            <Text style={{ color: '#9a3412', fontSize: 10 }}>
              Ejemplo Pollo: 0.2 prot | 1.5 kcal | 0.08 grasa
            </Text>
          </View>
        )}

        <View style={styles.gridInputs}>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Kcal</Text><TextInput style={styles.inputN} keyboardType="numeric" value={calorias} onChangeText={setCalorias} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Prot (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={proteina} onChangeText={setProteina} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Grasa (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={grasa} onChangeText={setGrasa} placeholder="0"/></View>
          <View style={styles.boxInput}><Text style={styles.miniLabel}>Carbs (g)</Text><TextInput style={styles.inputN} keyboardType="numeric" value={carbs} onChangeText={setCarbs} placeholder="0"/></View>
        </View>

        <TouchableOpacity style={styles.btnGuardar} onPress={guardarAlimento}>
          <Text style={styles.btnText}>Agregar Manualmente</Text>
        </TouchableOpacity>

        {/* BOTÓN AZUL PARA LA CARGA MASIVA DEL EXCEL */}
        <TouchableOpacity style={styles.btnImportar} onPress={importarDatosDesdeExcel}>
          <Text style={styles.btnText}>CARGAR TODO EL EXCEL</Text>
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
  unitBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff', minWidth: '22%', alignItems: 'center' },
  unitBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  unitText: { color: '#64748b', fontWeight: 'bold', fontSize: 10 },
  unitTextActive: { color: '#3b82f6' },
  gridInputs: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  boxInput: { flex: 1, alignItems: 'center' },
  miniLabel: { fontSize: 9, color: '#94a3b8', marginBottom: 4 },
  inputN: { backgroundColor: '#f1f5f9', width: '100%', textAlign: 'center', padding: 8, borderRadius: 8, fontWeight: 'bold' as const },
  btnGuardar: { backgroundColor: '#22c55e', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  btnImportar: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' as const, fontSize: 14 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  itemName: { fontWeight: 'bold', color: '#1e293b', fontSize: 14 },
  itemSub: { fontSize: 10, color: '#64748b' },
  itemMacros: { fontWeight: 'bold', color: '#3b82f6', fontSize: 13 },
  itemMacrosSub: { fontSize: 9, color: '#94a3b8' }
});