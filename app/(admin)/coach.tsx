import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
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

  // 2. Función de Cerrar Sesión con logs para depuración
  const handleSignOut = async () => {
    console.log("Botón Salir presionado");
    try {
      await signOut(auth);
      console.log("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      if (Platform.OS === 'web') alert("Error al salir");
    }
  };

  // 3. Función para borrar registro
  const eliminarRegistro = async (id: string, nombre: string) => {
    const confirmar = async () => {
      try {
        await deleteDoc(doc(db, "revisiones_pendientes", id));
      } catch (err) {
        console.log("Error al borrar:", err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) confirmar();
    } else {
      confirmar(); // En móvil puedes añadir un Alert.alert aquí
    }
  };

  const renderCliente = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.clienteNombre}>{item.nombre || 'Sin nombre'}</Text>
        <Text style={styles.clienteSub}>{item.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PENDIENTE</Text>
        </View>
      </View>
      
      <View style={styles.acciones}>
        <Pressable 
          style={styles.btnRevisar} 
          onPress={() => alert('Entrando al expediente de: ' + item.nombre)}
        >
          <FontAwesome5 name="eye" size={16} color="#fff" />
        </Pressable>

        <Pressable 
          style={styles.btnBorrar} 
          onPress={() => eliminarRegistro(item.id, item.nombre)}
        >
          <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header centrado y ajustado para Web */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Panel Coach</Text>
          <Pressable 
            onPress={handleSignOut} 
            style={({ pressed }) => [
              styles.btnSalir,
              { opacity: pressed ? 0.7 : 1, cursor: Platform.OS === 'web' ? 'pointer' : 'auto' }
            ]}
          >
            <Text style={styles.txtSalir}>Cerrar Sesión</Text>
            <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {/* Contenedor principal con límite de ancho */}
      <View style={styles.mainWrapper}>
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
    alignItems: 'center', // Centra el contenido en Web
    zIndex: 10
  },
  headerInner: {
    width: '100%',
    maxWidth: 800,
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
    borderRadius: 8 
  },
  txtSalir: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center', // Clave para que no se estire en Web
  },
  lista: { padding: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    // Sombra suave
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } as any,
      default: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }
    })
  },
  cardInfo: { flex: 1 },
  clienteNombre: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  clienteSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: 'bold' },
  acciones: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnRevisar: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10 },
  btnBorrar: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#fecaca' 
  },
  vacio: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 15 }
});