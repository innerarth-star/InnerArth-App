import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform, SafeAreaView, Dimensions } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => { lista.push({ id: doc.id, ...doc.data() }); });
      setClientes(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  // ARREGLO DEL BOTÓN SALIR: Función explícita con manejo de errores
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // No necesitas redirección manual, onAuthStateChanged en App.js lo detectará
    } catch (error) {
      console.error("Error al salir:", error);
      if (Platform.OS === 'web') alert("Error al cerrar sesión");
    }
  };

  const eliminarRegistro = async (id: string, nombre: string) => {
    const confirmar = async () => {
      await deleteDoc(doc(db, "revisiones_pendientes", id));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) confirmar();
    } else {
      Alert.alert("Eliminar", `¿Borrar a ${nombre}?`, [{ text: "No" }, { text: "Sí", onPress: confirmar }]);
    }
  };

  const renderCliente = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.clienteNombre}>{item.nombre || 'Sin nombre'}</Text>
        <Text style={styles.clienteSub}>{item.email}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>PENDIENTE</Text></View>
      </View>
      <View style={styles.acciones}>
        <TouchableOpacity style={styles.btnRevisar} onPress={() => alert('Próximamente: Expediente')}>
          <FontAwesome5 name="eye" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnBorrar} onPress={() => eliminarRegistro(item.id, item.nombre)}>
          <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Panel Coach</Text>
          <TouchableOpacity style={styles.btnSalir} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.txtSalir}>Cerrar Sesión</Text>
            <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENEDOR LIMITADO PARA WEB */}
      <View style={styles.webWrapper}>
        {cargando ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={clientes}
            keyExtractor={(item) => item.id}
            renderItem={renderCliente}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={<Text style={styles.vacio}>No hay registros pendientes</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    // Esto asegura que el header no se estire infinito en web
    alignItems: 'center'
  },
  headerContent: {
    width: '100%',
    maxWidth: 800, // Máximo ancho en Web
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  btnSalir: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: '#fee2e2', 
    borderRadius: 8,
    // Cursor pointer para web
    ...Platform.select({ web: { cursor: 'pointer' } as any })
  },
  txtSalir: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  webWrapper: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 800, // Centra el contenido en pantallas grandes
    alignSelf: 'center' 
  },
  lista: { padding: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } as any
    })
  },
  cardInfo: { flex: 1 },
  clienteNombre: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  clienteSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badge: { 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    marginTop: 6, 
    alignSelf: 'flex-start' 
  },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: '900' },
  acciones: { flexDirection: 'row', gap: 12 },
  btnRevisar: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  btnBorrar: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  vacio: { textAlign: 'center', marginTop: 60, color: '#94a3b8' }
});