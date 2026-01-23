import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator } from 'react-native';
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
    });
    return () => unsubscribe();
  }, []);

  const alumnosFiltrados = alumnos.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
  );

  return (
    <View style={styles.container}>
      {/* Título e Info */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Mis Alumnos</Text>
        <Text style={styles.countText}>{alumnos.length} Alumnos</Text>
      </View>
      
      {/* Buscador */}
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
          <Pressable 
            style={styles.card}
            onPress={() => router.push({ pathname: '/(admin)/historial', params: { id: item.id, nombre: item.nombre } })}
          >
            <View style={styles.infoCol}>
              <Text style={styles.nameText}>{item.nombre}</Text>
              <Text style={styles.subText}>{item.nutricion?.objetivo || 'Sin objetivo'}</Text>
            </View>
            
            {/* Solo la flecha para entrar al historial */}
            <View style={styles.arrowIcon}>
              <FontAwesome5 name="chevron-right" size={16} color="#cbd5e1" />
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay alumnos activos.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mainTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  input: { 
    flex: 1, 
    paddingVertical: 10, 
    marginLeft: 10, 
    color: '#1e293b' 
  },
  listContent: { 
    padding: 20,
    paddingTop: 5
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0'
  },
  infoCol: { 
    flex: 1 
  },
  nameText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  subText: { 
    fontSize: 12, 
    color: '#64748b', 
    marginTop: 2 
  },
  arrowIcon: {
    paddingLeft: 10
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#94a3b8', 
    marginTop: 50 
  }
});