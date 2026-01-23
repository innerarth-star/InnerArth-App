import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MisAlumnos() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "alumnos_activos"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setAlumnos(lista);
      setCargando(false);
    }, (error) => {
      console.error("Error en Firestore:", error);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const alumnosFiltrados = alumnos.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mis Alumnos</Text>
            <Text style={styles.subTitle}>Gestión de activos</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{alumnos.length}</Text>
          </View>
        </View>

        {/* Buscador */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" />
            <TextInput 
              placeholder="Buscar por nombre..." 
              style={styles.input} 
              value={busqueda}
              onChangeText={setBusqueda}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Lista */}
        <FlatList
          data={alumnosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.card}
              onPress={() => router.push({ 
                pathname: '/(admin)/historial' as any, 
                params: { id: item.id, nombre: item.nombre } 
              })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.alumnoNombre}>{item.nombre}</Text>
                <Text style={styles.alumnoObjetivo}>
                  {item.nutricion?.objetivo || 'Sin objetivo definido'}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#cbd5e1" />
            </Pressable>
          )}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron alumnos.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ESTO ARREGLA EL ESTIRAMIENTO EN WEB
  outerContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', // Centra el contenido en pantallas anchas
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800, // Limita el ancho en Web para que no se vea "alargada"
    backgroundColor: '#f1f5f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  subTitle: { fontSize: 13, color: '#64748b' },
  badge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  searchSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  listPadding: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardInfo: { flex: 1 },
  alumnoNombre: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  alumnoObjetivo: { fontSize: 13, color: '#64748b', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 50 }
});