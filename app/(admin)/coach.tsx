import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // 1. Escuchar la base de datos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setClientes(lista);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Función para borrar registro
  const eliminarRegistro = async (id: string, nombre: string) => {
    const confirmar = () => {
      deleteDoc(doc(db, "revisiones_pendientes", id))
        .catch(err => console.log("Error al borrar:", err));
    };

    if (Platform.OS === 'web') {
      if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) confirmar();
    } else {
      Alert.alert(
        "Eliminar Registro",
        `¿Borrar a ${nombre}?`,
        [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", onPress: confirmar, style: "destructive" }]
      );
    }
  };

  // 3. Renderizado de cada tarjeta de cliente
  const renderCliente = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.clienteNombre}>{item.nombre || 'Sin nombre'}</Text>
        <Text style={styles.clienteSub}>{item.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Esperando revisión</Text>
        </View>
      </View>
      
      <View style={styles.acciones}>
        <TouchableOpacity 
          style={styles.btnRevisar} 
          onPress={() => alert('Abriendo expediente de: ' + item.nombre)} // Aquí irá la navegación al expediente
        >
          <FontAwesome5 name="eye" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnBorrar} 
          onPress={() => eliminarRegistro(item.id, item.nombre)}
        >
          <FontAwesome5 name="trash-alt" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con botón de Salir */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Coach</Text>
        <TouchableOpacity style={styles.btnSalir} onPress={() => signOut(auth)}>
          <Text style={styles.txtSalir}>Salir</Text>
          <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>No hay clientes en espera 🙌</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  btnSalir: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  txtSalir: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  lista: { padding: 15 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    // Sombras para que se vea limpio
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardInfo: { flex: 1 },
  clienteNombre: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  clienteSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { 
    backgroundColor: '#dcfce7', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 8 
  },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: 'bold' },
  acciones: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnRevisar: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10 },
  btnBorrar: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca' },
  vacio: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16 }
});