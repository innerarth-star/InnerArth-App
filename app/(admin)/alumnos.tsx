import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
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
        const data = doc.data();
        const idReal = data.uid || data.id || doc.id;
        lista.push({ 
          ...data,
          id: idReal,
        });
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

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        {/* HEADER CENTRADO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mis Alumnos</Text>
            <Text style={styles.subTitle}>Gestión de activos</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{alumnos.length}</Text></View>
        </View>

        {/* BARRA DE BÚSQUEDA */}
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

        {/* LISTADO */}
        <FlatList
          data={alumnosFiltrados}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.card}
              onPress={() => {
                console.log("Navegando con ID:", item.id);
                router.push({ 
                  pathname: '/(admin)/historial' as any, 
                  params: { id: item.id, nombre: item.nombre } 
                });
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nombre?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.alumnoNombre}>{item.nombre?.toUpperCase()}</Text>
                <Text style={styles.alumnoObjetivo}>
                  {item.nutricion?.objetivo || 'Sin objetivo definido'}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#cbd5e1" />
            </Pressable>
          )}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron alumnos.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', // Color de fondo para los laterales en web
    alignItems: 'center', 
  },
  mainContainer: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 600, // <--- AJUSTE CLAVE: Se ve como móvil en la Web
    backgroundColor: '#f8fafc',
    // Sombra para que parezca una ventana flotante en web
    ...Platform.select({
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
      }
    })
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 40, 
    paddingBottom: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  subTitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  badge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  searchSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 50, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  listPadding: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  cardInfo: { flex: 1 },
  alumnoNombre: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  alumnoObjetivo: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 50 }
});