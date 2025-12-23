import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar en tiempo real a los alumnos que se registren
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(docs);
      setLoading(false);
    }, (error) => {
      console.log("Error en Firebase:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const cerrarSesion = () => {
    signOut(auth);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Alumnos FitTech 📋</Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Alert.alert("Detalles", `Pronto verás aquí la ficha de ${item.nombre}`)}>
            <View>
              <Text style={styles.clientName}>{item.nombre || "Sin nombre"}</Text>
              <Text style={styles.clientEmail}>{item.emailUsuario}</Text>
              <Text style={styles.status}>Estado: {item.status}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay registros de alumnos.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  clientEmail: { fontSize: 14, color: '#64748b' },
  status: { fontSize: 12, color: '#f59e0b', fontWeight: 'bold', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});