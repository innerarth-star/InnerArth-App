import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { db } from '../../firebaseConfig'; // Ajusta la ruta a tu config
import { collection, addDoc } from 'firebase/firestore';

const AdminAlimentos = () => {
  const [nombre, setNombre] = useState('');
  const [protes, setProtes] = useState('');
  const [grasas, setGrasas] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calorias, setCalorias] = useState('');

  const guardarAlimento = async () => {
    if (!nombre || !protes || !grasas || !carbs) {
      Alert.alert("Error", "Por favor llena todos los campos macro");
      return;
    }

    try {
      await addDoc(collection(db, "alimentos"), {
        nombre: nombre.toLowerCase(),
        proteina: parseFloat(protes),
        grasa: parseFloat(grasas),
        carbohidratos: parseFloat(carbs),
        calorias: calorias ? parseFloat(calorias) : (parseFloat(protes) * 4 + parseFloat(carbs) * 4 + parseFloat(grasas) * 9),
        fechaCreacion: new Date()
      });
      
      Alert.alert("Éxito", "Alimento guardado en tu biblioteca");
      // Limpiar campos
      setNombre(''); setProtes(''); setGrasas(''); setCarbs(''); setCalorias('');
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el alimento");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Biblioteca de Alimentos</Text>
      <Text style={styles.label}>Nombre del Alimento (ej: Pechuga de Pollo)</Text>
      <TextInput 
        style={styles.input} 
        value={nombre} 
        onChangeText={setNombre} 
        placeholder="Ej: Arroz Blanco"
        placeholderTextColor="#94a3b8"
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Prot (g)</Text>
          <TextInput style={styles.input} value={protes} onChangeText={setProtes} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Grasa (g)</Text>
          <TextInput style={styles.input} value={grasas} onChangeText={setGrasas} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={guardarAlimento}>
        <Text style={styles.btnText}>Agregar a mi Biblioteca</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#64748b', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 15, color: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '30%' },
  btn: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default AdminAlimentos;