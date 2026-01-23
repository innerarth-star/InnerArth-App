import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MisAlumnos() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "alumnos_activos"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => { lista.push({ id: doc.id, ...doc.data() }); });
      setAlumnos(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const alumnosFiltrados = alumnos.filter(a => a.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  const contactarWhatsApp = (tel: string) => {
    const num = tel.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.mainTitle}>Panel de Alumnos</Text>
      
      <View style={styles.searchBox}>
        <FontAwesome5 name="search" size={14} color="#94a3b8" />
        <TextInput 
          placeholder="Buscar por nombre..." 
          style={styles.input} 
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <FlatList
        data={alumnosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.sub}>{item.nutricion?.objetivo || 'Sin objetivo'}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => contactarWhatsApp(item.telefono)} style={styles.btnWa}>
                <FontAwesome5 name="whatsapp" size={16} color="#fff" />
              </Pressable>
              <Pressable style={styles.btnFile}>
                <FontAwesome5 name="eye" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay alumnos activos aún.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, marginTop: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  input: { flex: 1, paddingVertical: 12, marginLeft: 10 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b' },
  actions: { flexDirection: 'row', gap: 8 },
  btnWa: { backgroundColor: '#25D366', width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnFile: { backgroundColor: '#1e293b', width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});