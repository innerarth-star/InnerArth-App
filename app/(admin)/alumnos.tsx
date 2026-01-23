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
    // Escuchamos la colección de alumnos aceptados
    const q = query(collection(db, "alumnos_activos"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setAlumnos(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtro de búsqueda
  const alumnosFiltrados = alumnos.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const contactarWhatsApp = (tel: string) => {
    if (!tel) return;
    const num = tel.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Mis Alumnos</Text>
        <Text style={styles.count}>{alumnos.length} activos</Text>
      </View>
      
      {/* Buscador Estilizado */}
      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={14} color="#94a3b8" />
        <TextInput 
          placeholder="Buscar alumno..." 
          style={styles.input} 
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <FlatList
        data={alumnosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.infoCol}>
              <Text style={styles.nameText}>{item.nombre}</Text>
              <Text style={styles.subText}>{item.nutricion?.objetivo || 'Sin objetivo definido'}</Text>
            </View>
            
            <View style={styles.actionCol}>
              <Pressable 
                onPress={() => contactarWhatsApp(item.telefono)} 
                style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
              >
                <FontAwesome5 name="whatsapp" size={16} color="#fff" />
              </Pressable>
              
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: '#1e293b' }]}
                onPress={() => {/* Futuro: Ver detalles o plan */}}
              >
                <FontAwesome5 name="chevron-right" size={14} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="users-slash" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aún no tienes alumnos aceptados.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  count: { fontSize: 12, color: '#64748b', backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 15
  },
  input: { flex: 1, paddingVertical: 12, marginLeft: 10, color: '#1e293b' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    // Sombra suave para que se vea bien en web y móvil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoCol: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  subText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actionCol: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 15, fontSize: 14 }
});